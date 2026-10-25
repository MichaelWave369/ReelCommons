import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  creatorEpisodeManifest, exportCreatorEpisodeManifest, recordingExtension,
  safeStudioFilename, supportedRecordingMime,
} from './creatorStudioModel'
import type { CaptureMode, CreatorProjectInput } from './creatorStudioModel'
import './creator-studio.css'

const MAX_SESSION_BYTES=250*1024*1024
const PARACUT_URL='https://github.com/MichaelWave369/paracut'
const PHIBOX_URL='https://github.com/MichaelWave369/PhiBox'
const PHIAUDIO_URL='https://github.com/MichaelWave369/PHIAudio'
const WAVEFORGE_URL='https://github.com/MichaelWave369/WaveForgeStudio'

interface Recording {
  url: string
  blob: Blob
  filename: string
  mimeType: string
  recordedUtc: string
  mode: CaptureMode
}
const defaultProject: CreatorProjectInput = {
  show:'RCTV Originals',title:'Episode 001',
  description:'',notes:'',mode:'microphone',
}
function saveBlob(blob:Blob,filename:string) {
  const url=URL.createObjectURL(blob)
  const link=document.createElement('a')
  link.href=url
  link.download=filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(()=>URL.revokeObjectURL(url),0)
}

/** Capture is isolated from RCTV channels. Only user mic/camera may be recorded. */
export default function CreatorStudio({openRequestToken=0}: {openRequestToken?:number}) {
  const [opened,setOpened]=useState(false)
  const [project,setProject]=useState<CreatorProjectInput>(defaultProject)
  const [connected,setConnected]=useState(false)
  const [recording,setRecording]=useState(false)
  const [recorded,setRecorded]=useState<Recording|null>(null)
  const [status,setStatus]=useState('No mic or camera connection. Studio is local-only.')
  const [busy,setBusy]=useState(false)
  const streamRef=useRef<MediaStream|null>(null)
  const recorderRef=useRef<MediaRecorder|null>(null)
  const recordedRef=useRef<Recording|null>(null)
  const chunksRef=useRef<Blob[]>([])
  const bytesRef=useRef(0)
  const tooLargeRef=useRef(false)
  const disposedRef=useRef(false)
  const pendingRef=useRef(false)
  const requestIdRef=useRef(0)
  const videoRef=useRef<HTMLVideoElement|null>(null)
  const audioPreviewRef=useRef<HTMLAudioElement|null>(null)
  const videoPreviewRef=useRef<HTMLVideoElement|null>(null)

  useEffect(()=>{
    if(openRequestToken>0)setOpened(true)
  },[openRequestToken])

  useEffect(()=>{
    disposedRef.current=false
    return ()=>{
      disposedRef.current=true
      requestIdRef.current++
      const recorder=recorderRef.current
      if(recorder&&recorder.state!=='inactive') {
        recorder.ondataavailable=null
        recorder.onstop=null
        recorder.onerror=null
        try{recorder.stop()}catch{/* already stopped */}
      }
      streamRef.current?.getTracks().forEach((track)=>track.stop())
      streamRef.current=null
      recorderRef.current=null
      if(recordedRef.current) URL.revokeObjectURL(recordedRef.current.url)
    }
  },[])

  useEffect(()=>{
    if(videoRef.current) videoRef.current.srcObject=opened&&connected ? streamRef.current:null
  },[opened,connected,project.mode])

  function update<K extends keyof CreatorProjectInput>(key:K,value:CreatorProjectInput[K]) {
    setProject((before)=>({...before,[key]:value}))
  }
  function revokeTake() {
    if(recordedRef.current) URL.revokeObjectURL(recordedRef.current.url)
    recordedRef.current=null
    setRecorded(null)
  }
  function disconnect() {
    requestIdRef.current++
    const r=recorderRef.current
    if(r&&r.state!=='inactive'){
      r.onstop=null
      r.ondataavailable=null
      r.onerror=null
      try{r.stop()}catch{/* already stopped */}
    }
    recorderRef.current=null
    streamRef.current?.getTracks().forEach((track)=>track.stop())
    streamRef.current=null
    if(videoRef.current)videoRef.current.srcObject=null
    setConnected(false)
    setRecording(false)
    setBusy(false)
    pendingRef.current=false
    setStatus('Microphone and camera resources disconnected. No background capture.')
  }
  function close() {
    disconnect()
    setOpened(false)
  }
  async function connect() {
    if(pendingRef.current||streamRef.current||disposedRef.current)return
    pendingRef.current=true
    setBusy(true)
    setStatus('Requesting browser permission. No capture begins until you allow it.')
    const request=++requestIdRef.current
    try {
      if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined') {
        throw new Error('This browser does not expose secure microphone/camera capture and recording.')
      }
      const supported=supportedRecordingMime(project.mode,(mime)=>MediaRecorder.isTypeSupported(mime))
      if(!supported)throw new Error('No supported recording format for this mode. Try another browser or audio-only.')
      const stream=await navigator.mediaDevices.getUserMedia({
        audio:{echoCancellation:true,noiseSuppression:true},
        video:project.mode==='camera-microphone'?{width:{ideal:1280},height:{ideal:720}}:false,
      })
      if(disposedRef.current||requestIdRef.current!==request) {
        stream.getTracks().forEach((track)=>track.stop())
        return
      }
      streamRef.current=stream
      setConnected(true)
      setStatus(project.mode==='microphone'
        ? 'Microphone connected. Monitoring is OFF to prevent feedback. Press Record explicitly.'
        : 'Camera and microphone connected. Camera preview is muted. Press Record explicitly.')
    } catch(error) {
      if(!disposedRef.current&&requestIdRef.current===request) {
        setStatus(error instanceof Error?error.message:'Microphone/camera permission denied or unavailable.')
      }
    } finally {
      if(!disposedRef.current&&requestIdRef.current===request)setBusy(false)
      pendingRef.current=false
    }
  }
  function startRecording() {
    if(!streamRef.current||recorderRef.current?.state==='recording'||recording)return
    try {
      const mime=supportedRecordingMime(project.mode,(v)=>MediaRecorder.isTypeSupported(v))
      if(!mime)throw new Error('No supported recording encoder for this mode.')
      revokeTake()
      chunksRef.current=[]
      bytesRef.current=0
      tooLargeRef.current=false
      const recorder=new MediaRecorder(streamRef.current,{mimeType:mime})
      const requestedMode=project.mode
      const requestedFilename=safeStudioFilename(project.title,recordingExtension(mime))
      recorderRef.current=recorder
      recorder.ondataavailable=(event)=>{
        if(event.data.size===0)return
        bytesRef.current+=event.data.size
        if(bytesRef.current>MAX_SESSION_BYTES) {
          tooLargeRef.current=true
          chunksRef.current=[]
          if(recorder.state!=='inactive')recorder.stop()
          return
        }
        if(!tooLargeRef.current)chunksRef.current.push(event.data)
      }
      recorder.onerror=()=>{
        setStatus('Browser recorder reported an error. Stop and reconnect input before retrying.')
      }
      recorder.onstop=()=>{
        setRecording(false)
        if(disposedRef.current)return
        recorderRef.current=null
        if(tooLargeRef.current) {
          chunksRef.current=[]
          setStatus('Recording exceeded the 250 MB session limit and was discarded.')
          return
        }
        const blob=new Blob(chunksRef.current,{type:recorder.mimeType||mime})
        chunksRef.current=[]
        if(blob.size===0){
          setStatus('The browser produced an empty recording. Try again or change browsers.')
          return
        }
        const take:Recording={
          url:URL.createObjectURL(blob),blob,filename:requestedFilename,
          mimeType:recorder.mimeType||mime,mode:requestedMode,
          recordedUtc:new Date().toISOString(),
        }
        recordedRef.current=take
        setRecorded(take)
        setStatus('Take recorded locally. Preview, download the media, then export metadata for postproduction.')
      }
      recorder.start(1000)
      setRecording(true)
      setStatus('RECORDING locally. No files are uploaded and no RCTV source is captured.')
    } catch(error) {
      setStatus(error instanceof Error?error.message:'Browser refused to start recording.')
    }
  }
  function stopRecording() {
    const recorder=recorderRef.current
    if(recorder?.state==='recording'||recorder?.state==='paused') {
      recorder?.stop()
      setStatus('Finalizing your recording locally.')
    }
  }
  function exportManifest() {
    if(!recorded)return
    try {
      const manifest=creatorEpisodeManifest(
        {...project,mode:recorded.mode},
        {mediaFilename:recorded.filename,mimeType:recorded.mimeType,
          byteLength:recorded.blob.size},recorded.recordedUtc,
      )
      saveBlob(new Blob([exportCreatorEpisodeManifest(manifest)],{
        type:'application/json'}),recorded.filename.replace(/\.[^.]+$/,'.rctv.json'))
      setStatus('Metadata manifest exported. It is reference-only; import the media file separately into ParaCut.')
    }catch(error) {
      setStatus(error instanceof Error?error.message:'Could not export metadata manifest.')
    }
  }
  function downloadMedia() {
    if(!recorded)return
    saveBlob(recorded.blob,recorded.filename)
    setStatus('Media file download requested. Confirm it completed before leaving this page.')
  }
  function changeCaptureMode(event:ChangeEvent<HTMLSelectElement>) {
    const value=event.target.value
    if(value==='microphone'||value==='camera-microphone'){
      revokeTake()
      update('mode',value)
    }
  }

  return <section className="rcs" aria-labelledby="rcs-title">
    <div className="rcs-head">
      <div>
        <span className="rcs-kicker">RCTV v3.2 · CREATOR STUDIO / LOCAL PRODUCTION</span>
        <h2 id="rcs-title" tabIndex={-1}>The Broadcasting & Podcast Studio</h2>
        <p>Start with the real thing: permission-gated microphone or camera recordings, private browser preview, download and postproduction handoff. This is a recording booth, not a public livestream server.</p>
      </div>
      <button type="button" aria-expanded={opened} aria-controls="rcs-workspace"
        onClick={()=>opened?close():(setOpened(true),setStatus('Studio ready. Connect your own mic or camera to begin.'))}>
        {opened?'■ Close studio & disconnect':'🎙 Open Creator Studio'}
      </button>
    </div>
    <p className="rcs-banner"><strong>OWNED MEDIA ONLY.</strong> No RCTV/YouTube/KEXP feed capture. Nothing is uploaded, published, restreamed, or sent to ParaCut, PHIAudio, WaveForge or PhiBox automatically. Downloads are controlled by you.</p>
    {opened&&<div id="rcs-workspace" className="rcs-workspace">
      <div className="rcs-grid">
        <div className="rcs-block">
          <h3>01 · Your show</h3>
          <label>SHOW NAME
            <input value={project.show} maxLength={100}
              onChange={(event)=>update('show',event.target.value)}/>
          </label>
          <label>EPISODE TITLE
            <input value={project.title} maxLength={120}
              onChange={(event)=>update('title',event.target.value)}/>
          </label>
          <label>CAPTURE INPUT
            <select value={project.mode} onChange={changeCaptureMode}
              disabled={connected||busy||recording||!!recorded}>
              <option value="microphone">Microphone · Podcast audio</option>
              <option value="camera-microphone">Camera + microphone · Video podcast</option>
            </select>
          </label>
          <label>SHORT DESCRIPTION
            <textarea rows={3} maxLength={800} value={project.description}
              onChange={(event)=>update('description',event.target.value)}
              placeholder="What's this episode about?"/>
          </label>
          <label>SHOW NOTES / EDIT CUES
            <textarea rows={5} maxLength={2400} value={project.notes}
              onChange={(event)=>update('notes',event.target.value)}
              placeholder="Topics, timestamps, ideas for ParaCut titles…"/>
          </label>
          <p>Pick your capture input before connecting. Existing recording must be discarded before switching capture mode.</p>
        </div>
        <div className="rcs-block rcs-stage">
          <h3>02 · Local recording booth</h3>
          <div className="rcs-monitor">
            {connected&&project.mode==='camera-microphone'?
              <video ref={videoRef} muted autoPlay playsInline aria-label="Muted local camera preview"/>:
              <div className="rcs-standby"><strong>{connected?'MIC CONNECTED':'INPUT OFFLINE'}</strong>
                <p>{connected?'Microphone preview stays muted to avoid speaker feedback.':'No microphone or camera is active.'}</p></div>}
            <span>{recording?'● RECORDING':connected?'● INPUT CONNECTED':'○ STANDBY'}</span>
          </div>
          <div className="rcs-transport">
            {!connected?<button type="button" disabled={busy} onClick={connect}>
              {busy?'Requesting permission…':'◉ Connect mic / camera'}</button>:
              <button type="button" disabled={recording} onClick={disconnect}>■ Disconnect inputs</button>}
            {connected&&!recording&&<button type="button" className="rcs-rec" onClick={startRecording}>● Record locally</button>}
            {recording&&<button type="button" className="rcs-stop" onClick={stopRecording}>■ Stop recording</button>}
          </div>
          <p className="rcs-status" role="status">{status}</p>
          <p className="rcs-hint">Explicit permission required. No microphone monitor through speakers. Max recording blob 250 MB; supported formats depend on the browser. Close/disconnect to release tracks.</p>
          {recorded&&<div className="rcs-take">
            <h4>03 · Your local take</h4>
            <p><strong>{recorded.filename}</strong> · {(recorded.blob.size/1_048_576).toFixed(1)} MiB · {recorded.mimeType}</p>
            {recorded.mode==='microphone'?
              <audio ref={audioPreviewRef} src={recorded.url} controls preload="metadata"
                aria-label="Local podcast recording preview"/>:
              <video ref={videoPreviewRef} src={recorded.url} controls preload="metadata" playsInline
                aria-label="Local video recording preview"/>}
            <div className="rcs-export-actions">
              <button type="button" onClick={downloadMedia}>↓ Download recorded media</button>
              <button type="button" onClick={exportManifest}>↓ Export episode metadata</button>
              <button type="button" onClick={()=>{revokeTake();setStatus('Take discarded from this browser session.')}}>Discard take</button>
            </div>
            <p>Download both media and metadata before leaving. The metadata file does NOT contain the audio/video bytes.</p>
          </div>}
        </div>
      </div>
      <div className="rcs-bridges">
        <h3>04 · The creative production chain</h3>
        <div>
          <a href={PARACUT_URL} target="_blank" rel="noopener noreferrer"><strong>ParaCut</strong><span>Edit your downloaded video and titles</span></a>
          <a href={PHIBOX_URL} target="_blank" rel="noopener noreferrer"><strong>PhiBox</strong><span>Create original loops, beds and sound effects</span></a>
          <a href={PHIAUDIO_URL} target="_blank" rel="noopener noreferrer"><strong>PHIAudio</strong><span>Future deterministic audio engine</span></a>
          <a href={WAVEFORGE_URL} target="_blank" rel="noopener noreferrer"><strong>WaveForgeStudio</strong><span>Future review and release handoff</span></a>
        </div>
        <p>These are separate repositories, not secretly embedded or automatically synced apps. ParaCut expects its own native project/RenderPlan; this studio exports only a reference-only episode manifest and an independently downloaded media file. Studio-generated channels and live streaming require separate review and infrastructure in later releases.</p>
      </div>
    </div>}
  </section>
}
