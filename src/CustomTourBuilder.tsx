import {useState} from 'react'
import type {ChangeEvent} from 'react'
import {ALL_OPEN_STREAMS} from './cameraCatalog'
import {
  appendCustomTour, CUSTOM_TOUR_FORMAT, customTourToWorldTour, exportSharedCustomTour,
  makeCustomTour, MAX_CUSTOM_IMPORT_BYTES, MAX_CUSTOM_TOURS, MAX_TOUR_STOPS,
  MIN_TOUR_STOPS, moveCustomStop, parseSharedCustomTour,
} from './customTours'
import type {CustomTourRecord,CustomTourStore} from './customTours'
import type {WorldTour} from './worldTour'
import './custom-tours.css'

const grouped = [...ALL_OPEN_STREAMS].sort((a,b)=>a.name.localeCompare(b.name))
function newId() {
  // ID provides only local record differentiation, never security or provenance.
  return 'custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12)
}
function downloadText(text:string,name:string) {
  const url=URL.createObjectURL(new Blob([text],{type:'application/json'}))
  const link=document.createElement('a')
  link.href=url
  link.download=name
  link.click()
  window.setTimeout(()=>URL.revokeObjectURL(url),1000)
}
export default function CustomTourBuilder({
  store, onStoreChange, onChoose,
}:{
  store:CustomTourStore
  onStoreChange:(next:CustomTourStore)=>void
  onChoose:(tour:WorldTour)=>void
}) {
  const [open,setOpen]=useState(false)
  const [title,setTitle]=useState('')
  const [sourceIds,setSourceIds]=useState<string[]>([])
  const [newStop,setNewStop]=useState('new-orleans-bourbon')
  const [editingId,setEditingId]=useState<string|null>(null)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')

  function resetDraft() {
    setEditingId(null);setTitle('');setSourceIds([]);setError('');setMessage('')
  }
  function addStop(){
    if(sourceIds.includes(newStop)){setError('That location is already on your tour. Each stop appears once.');return}
    if(sourceIds.length>=MAX_TOUR_STOPS){setError('Custom tours have a ten-stop maximum.');return}
    if(!ALL_OPEN_STREAMS.some((item)=>item.id===newStop)){setError('Unknown catalog source.');return}
    setSourceIds((old)=>[...old,newStop]);setError('')
  }
  function loadDraft(tour:CustomTourRecord) {
    setEditingId(tour.id);setTitle(tour.title);setSourceIds([...tour.sourceIds])
    setError('');setMessage('Editing your local itinerary. Save to update it.');setOpen(true)
  }
  function save() {
    const record=makeCustomTour(editingId??newId(),title,sourceIds)
    if(!record) {
      setError('Enter a 3–64-character title and choose 3–10 different official destinations. No markup or control characters.')
      return
    }
    let next:CustomTourStore|null
    if(editingId){
      if(!store.tours.some((tour)=>tour.id===editingId)){setError('The route being edited no longer exists.');return}
      next={version:1,tours:store.tours.map((tour)=>tour.id===editingId?record:tour)}
    }else{
      next=appendCustomTour(store,record)
      if(!next){setError('You can save up to 12 routes. Delete an old route before creating another.');return}
    }
    onStoreChange(next)
    setEditingId(record.id)
    setError('')
    setMessage('Route saved locally. It is available in the World Tour selector, with no video/stream URLs stored.')
  }
  function remove(id:string) {
    const tour=store.tours.find((item)=>item.id===id)
    if(!tour)return
    if(!window.confirm('Delete your saved tour "'+tour.title+'"? Passport stamps are not deleted.'))return
    onStoreChange({version:1,tours:store.tours.filter((item)=>item.id!==id)})
    if(editingId===id)resetDraft()
    setMessage('Saved route deleted locally. Your existing manual passport stamps are unchanged.')
    setError('')
  }
  async function importFile(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];e.target.value=''
    if(!file)return
    setError('');setMessage('')
    if(file.size>MAX_CUSTOM_IMPORT_BYTES){setError('Shared tour exceeds the 24 KB import limit.');return}
    try{
      const imported=parseSharedCustomTour(await file.text())
      const record=makeCustomTour(newId(),imported.title,imported.sourceIds)
      if(!record)throw new Error('Invalid catalog ID in shared tour.')
      const next=appendCustomTour(store,record)
      if(!next)throw new Error('Maximum of 12 saved tours. Delete one before importing another.')
      onStoreChange(next)
      setTitle(record.title);setSourceIds([...record.sourceIds]);setEditingId(record.id)
      setMessage('Imported one safe, catalog-only itinerary. No links, scripts, feeds, external media or stamps were imported.')
      setOpen(true)
    }catch(e){setError(e instanceof Error?e.message:'Could not import the itinerary.')}
  }
  const remaining=MAX_TOUR_STOPS-sourceIds.length
  return <section className="ctb-shell" aria-labelledby="ctb-heading">
    <div className="ctb-header">
      <div><span className="wtd-kicker">NEW · RCTV v1.8 · YOUR WORLD, YOUR ROUTE</span>
        <h3 id="ctb-heading">Build Your Own <em>World Tour.</em></h3>
        <p>Pick destinations from all 50 official RCTV sources, put them in your own order, then save your trip or share its safe itinerary metadata.</p>
      </div>
      <button type="button" aria-expanded={open} onClick={()=>setOpen((v)=>!v)}>{open?'− Close Tour Builder':'+ Build a Custom Tour'}</button>
    </div>
    <div className="ctb-summary"><strong>{store.tours.length}/{MAX_CUSTOM_TOURS}</strong> custom routes saved in this browser · <strong>{MIN_TOUR_STOPS}–{MAX_TOUR_STOPS}</strong> stops per route · no uploads or camera playback</div>
    {open && <div className="ctb-body">
      <div className="ctb-editor">
        <div className="ctb-editor-top"><h4>{editingId?'Edit local itinerary':'Create new itinerary'}</h4>
          <button type="button" onClick={resetDraft}>+ New blank route</button>
        </div>
        <label className="ctb-field">Name your adventure
          <input type="text" value={title} maxLength={64} placeholder="Example: Midnight Harbor Hop" onChange={(e)=>{setTitle(e.target.value);setError('')}}/>
        </label>
        <label className="ctb-field">Add a curated destination
          <select value={newStop} onChange={(e)=>setNewStop(e.target.value)}>
            {grouped.map((item)=><option key={item.id} value={item.id}>{item.name} · {item.category}</option>)}
          </select>
        </label>
        <button type="button" className="ctb-add" onClick={addStop} disabled={remaining===0}>+ Add stop ({remaining} slots left)</button>
        <div className="ctb-stop-heading">YOUR ROUTE · {sourceIds.length} STOPS</div>
        {!sourceIds.length && <p className="ctb-empty">Add a city cam, beach, train, mountain, animal cam, official radio station, or any other curated source.</p>}
        <ol className="ctb-stops">
          {sourceIds.map((id,index)=>{
            const entry=ALL_OPEN_STREAMS.find((source)=>source.id===id)
            return <li key={id}>
              <span className="ctb-stop-no">{index+1}</span>
              <div><strong>{entry?.name??'Unknown source'}</strong><small>{entry?.category??'unknown'} · Official site only where required</small></div>
              <div className="ctb-reorder">
                <button type="button" onClick={()=>setSourceIds((old)=>moveCustomStop(old,index,-1))} disabled={index===0} aria-label={'Move '+(entry?.name??id)+' earlier'}>↑</button>
                <button type="button" onClick={()=>setSourceIds((old)=>moveCustomStop(old,index,1))} disabled={index===sourceIds.length-1} aria-label={'Move '+(entry?.name??id)+' later'}>↓</button>
                <button type="button" onClick={()=>setSourceIds((old)=>old.filter((x)=>x!==id))} aria-label={'Remove '+(entry?.name??id)}>×</button>
              </div>
            </li>
          })}
        </ol>
        <button type="button" className="ctb-save" onClick={save}>{editingId?'✓ Save route changes':'✓ Save new local route'}</button>
        <p className="ctb-footnote">Only the title and source IDs are saved. RCTV still opens official providers for viewing and does not claim a webcam is online.</p>
      </div>
      <div className="ctb-saved">
        <h4>Your saved tours</h4>
        {!store.tours.length&&<p className="ctb-empty">No custom tours yet. The ten built-in routes remain available above.</p>}
        <div className="ctb-saved-list">
          {store.tours.map((tour)=><article key={tour.id}>
            <div><strong>{tour.title}</strong><small>{tour.sourceIds.length} curated stops · Local browser storage</small></div>
            <div className="ctb-record-actions">
              <button type="button" onClick={()=>onChoose(customTourToWorldTour(tour))}>▶ Explore</button>
              <button type="button" onClick={()=>loadDraft(tour)}>Edit</button>
              <button type="button" onClick={()=>downloadText(exportSharedCustomTour(tour),'rctv-custom-tour.json')}>↓ Export</button>
              <button type="button" onClick={()=>remove(tour.id)} aria-label={'Delete '+tour.title}>Delete</button>
            </div>
          </article>)}
        </div>
        <div className="ctb-import">
          <span className="ctb-stop-heading">SHARE A ROUTE · NO MEDIA FILES</span>
          <label className="ctb-file-picker">↑ Import RCTV itinerary JSON
            <input type="file" accept=".json,application/json" aria-label="Import shared RCTV Custom World Tour JSON" onChange={importFile}/>
          </label>
          <p>Imported files are limited to 24 KB and must contain {CUSTOM_TOUR_FORMAT} with only a route title and 3–10 known catalog IDs. Arbitrary URL, script, video and tracking fields are rejected.</p>
        </div>
      </div>
    </div>}
    {message&&<div className="ctb-notice" role="status">{message}</div>}
    {error&&<div className="ctb-error" role="alert">{error}</div>}
  </section>
}
