/**
 * RCTV v1.6 · Coastlines & Rails.
 * 16 independently described official-source viewing destinations: no player
 * embeds, third-party thumbnails, stream URL extraction, proxying or recording.
 * Format labels are source-described and are NOT live-status checks.
 */
import type { CameraFormat, CameraScene, OpenStream } from './openStreams'

export interface CoastRailSeed {
  id: string; name: string; place: string; tagline: string; description: string
  category: 'beach' | 'harbor' | 'train' | 'mountain'
  scene: CameraScene; format: CameraFormat
  officialUrl: string; accessNote: string; scheduleNote: string
}
const SEEDS: readonly CoastRailSeed[] = [
  // BEACHES: operator-owned or official visitor-organization access.
  {
    id: 'beach-santa-monica', name: 'Santa Monica Beach & Pier', place: 'Santa Monica, California, USA',
    tagline: 'Ocean waves and the pier in one frame.',
    description: 'Explore.org’s official camera looks across the Santa Monica Pier, beach and Pacific Ocean.',
    category: 'beach', scene: 'beaches', format: 'video',
    officialUrl: 'https://explore.org/livecams/oceans/santa-monica-beach-cam',
    accessNote: 'Explore.org owns the hosted player; RCTV opens its official viewing page only.',
    scheduleNote: 'The source labels this a live camera; weather and outages can interrupt its stream.',
  },
  {
    id: 'beach-huntington-pier', name: 'Huntington Beach Pier Surf Cam', place: 'Huntington Beach, California, USA',
    tagline: 'Surf City, from the pier.',
    description: 'Official Visit Huntington Beach live surf cam from the Kite Connection on Huntington Beach Pier.',
    category: 'beach', scene: 'beaches', format: 'video',
    officialUrl: 'https://www.surfcityusa.com/things-to-do/surfing/live-surf-cam/',
    accessNote: 'Visit Huntington Beach provides the player. No copied frames or embedded surf stream.',
    scheduleNote: 'Source-reported surf cam, not a real-time uptime measurement.',
  },
  {
    id: 'beach-clearwater', name: 'Clearwater Beach · Pier 60', place: 'Clearwater, Florida, USA',
    tagline: 'White sand and Florida sunshine.',
    description: 'Official St. Pete–Clearwater visitor bureau camera directory, including the Clearwater Beach webcam near Pier 60.',
    category: 'beach', scene: 'beaches', format: 'video',
    officialUrl: 'https://www.visitstpeteclearwater.com/things-to-do/beaches/webcams',
    accessNote: 'Tourism-board destination with source-owned camera players, not a RCTV feed.',
    scheduleNote: 'A multi-camera beach directory; select the Clearwater viewpoint on the official page.',
  },
  {
    id: 'beach-park-point', name: 'Park Point Beach · Lake Superior', place: 'Duluth, Minnesota, USA',
    tagline: 'Freshwater surf beside a working port.',
    description: 'The Solglimt beach camera watches Lake Superior waves and the Duluth shipping canal.',
    category: 'beach', scene: 'beaches', format: 'video',
    officialUrl: 'https://www.duluthharborcam.com/p/solglimt-b-b-beach-cam.html',
    accessNote: 'Camera is operated by Solglimt Bed and Breakfast; follow its official listing for playback.',
    scheduleNote: 'Weather, waves and camera availability vary throughout the year.',
  },
  // HARBORS: port authorities or independently operated original camera hosts.
  {
    id: 'harbor-los-angeles', name: 'Port of Los Angeles Waterfront', place: 'Los Angeles Harbor, California, USA',
    tagline: 'Cargo ships, tugboats and the Vincent Thomas Bridge.',
    description: 'Port authority’s two panoramic high-resolution cameras, viewing the harbor from San Pedro and Wilmington.',
    category: 'harbor', scene: 'harbors', format: 'video',
    officialUrl: 'https://www.portoflosangeles.org/news/livestream',
    accessNote: 'The Port of Los Angeles and EarthCam run the original cameras; no RCTV rebroadcast.',
    scheduleNote: 'Port-listed live cams rotate among views. Individual camera availability can change.',
  },
  {
    id: 'harbor-duluth', name: 'Duluth Harbor · Ship Watch', place: 'Duluth, Minnesota, USA',
    tagline: 'Freighters at the gateway to Lake Superior.',
    description: 'The original Duluth Harbor Cam site offers a panoramic view of vessel traffic and the Aerial Lift Bridge.',
    category: 'harbor', scene: 'harbors', format: 'video',
    officialUrl: 'https://www.duluthharborcam.com/p/harbor-cam.html',
    accessNote: 'Independent Duluth Harbor Cam operator controls the stream and original player.',
    scheduleNote: 'Ship traffic is intermittent, and harsh winter weather can affect camera views.',
  },
  {
    id: 'harbor-san-luis', name: 'Port San Luis Pier Camera', place: 'Avila Beach, California, USA',
    tagline: 'A working pier above the Pacific.',
    description: 'Official Port San Luis Harbor District page links to its pier and parking-area webcams.',
    category: 'harbor', scene: 'harbors', format: 'mixed',
    officialUrl: 'https://www.portsanluis.com/2155/Live-Webcam',
    accessNote: 'Municipal harbor district is the source destination; RCTV does not copy the camera media.',
    scheduleNote: 'Two camera links on the official page; format and active status are provider-controlled.',
  },
  {
    id: 'harbor-duluth-lighthouse', name: 'Duluth South Pier Lighthouse', place: 'Duluth, Minnesota, USA',
    tagline: 'Lake Superior from the end of the pier.',
    description: 'Original South Pier lighthouse camera looks toward the Duluth Ship Canal and Aerial Lift Bridge.',
    category: 'harbor', scene: 'harbors', format: 'video',
    officialUrl: 'https://www.duluthharborcam.com/p/south-pier-lighthouse-cam.html',
    accessNote: 'Original Duluth Harbor Cam player is the viewing destination, not licensed for RCTV embedding.',
    scheduleNote: 'Owner describes a fixed wide-angle streaming camera; outages can happen.',
  },
  // TRAINS: free access only where the provider explicitly offers it. Some
  // premium cameras or multi-view controls require accounts/payments.
  {
    id: 'train-railstream-free', name: 'RailStream · Free Railcams', place: 'North America',
    tagline: 'A front-row seat to railroad action.',
    description: 'RailStream’s official free Fireman tier lists ad-supported live cameras at selected railway locations.',
    category: 'train', scene: 'railways', format: 'mixed',
    officialUrl: 'https://www.railstream.net/camera-lineup',
    accessNote: 'Only the operator’s free Fireman camera lineup is described here. Premium views are not included, unlocked or re-hosted.',
    scheduleNote: 'The free selection is ad-supported and may change; some camera tiers cost money.',
  },
  {
    id: 'train-virtualrailfan-free', name: 'Virtual Railfan · Free Cameras', place: 'USA and Canada',
    tagline: 'Wait for the next locomotive.',
    description: 'Official free train-camera directory with public rail views, alongside separately paid membership options.',
    category: 'train', scene: 'railways', format: 'mixed',
    officialUrl: 'https://virtualrailfan.com/free-cameras',
    accessNote: 'Virtual Railfan explicitly prohibits recording, copying and restreaming footage without consent; official player only.',
    scheduleNote: 'Only public/free cams are covered. Premium PTZ and other features require membership.',
  },
  {
    id: 'train-ashland-va', name: 'Ashland Station Rail Cam', place: 'Ashland, Virginia, USA',
    tagline: 'Amtrak and freight beside a historic station.',
    description: 'Virtual Railfan’s own public YouTube train stream observes the tracks at Ashland Amtrak station.',
    category: 'train', scene: 'railways', format: 'video',
    officialUrl: 'https://www.youtube.com/watch?v=wgkdREYOfw0',
    accessNote: 'Official Virtual Railfan YouTube viewing page. Redistribution is prohibited; no RCTV iframe or copied media.',
    scheduleNote: 'Live video can end, restart or be interrupted; paid Virtual Railfan functionality is separate.',
  },
  {
    id: 'train-cog-washington', name: 'Mount Washington Cog Railway Views', place: 'Mount Washington, New Hampshire, USA',
    tagline: 'Mountain trains climbing the clouds.',
    description: 'Mount Washington Observatory’s official webcam hub includes Cog Waumbek Station and Up The Tracks views.',
    category: 'train', scene: 'railways', format: 'mixed',
    officialUrl: 'https://mountwashington.org/webcams/',
    accessNote: 'Mount Washington Observatory hosts the viewing hub. RCTV does not embed railway camera footage.',
    scheduleNote: 'Trains pass about every 30 minutes during operations. Conditions and operating hours vary.',
  },
  // MOUNTAINS: official observatory and resort hubs. Views may be obstructed,
  // seasonal, daylight-dependent or a combination of frames and video.
  {
    id: 'mountain-washington', name: 'Mount Washington Summit', place: 'New Hampshire, USA',
    tagline: 'The weather on top of the Northeast.',
    description: 'Mount Washington Observatory’s official summit, tower and surrounding mountain weather webcams.',
    category: 'mountain', scene: 'mountains', format: 'mixed',
    officialUrl: 'https://mountwashington.org/webcams/',
    accessNote: 'Original nonprofit observatory’s viewing pages; no embedded or copied camera feed.',
    scheduleNote: 'Ice, clouds and outages can obstruct views; some cameras operate only during daylight.',
  },
  {
    id: 'mountain-whistler', name: 'Whistler Blackcomb Peaks', place: 'Whistler, British Columbia, Canada',
    tagline: 'From the village to the mountain peaks.',
    description: 'Official resort webcams include Whistler Peak, Roundhouse Lodge, Blackcomb and village viewpoints.',
    category: 'mountain', scene: 'mountains', format: 'mixed',
    officialUrl: 'https://www.whistlerblackcomb.com/the-mountain/mountain-conditions/mountain-cams.aspx',
    accessNote: 'Whistler Blackcomb operates its original mountain camera display; RCTV only links there.',
    scheduleNote: 'Video and still cams vary, and some areas are seasonal.',
  },
  {
    id: 'mountain-mammoth', name: 'Mammoth Mountain · Main Lodge', place: 'Mammoth Lakes, California, USA',
    tagline: 'Sierra peaks through a mountain camera.',
    description: 'Mammoth Mountain’s official live webcam page at Main Lodge, with snapshot and player views.',
    category: 'mountain', scene: 'mountains', format: 'mixed',
    officialUrl: 'https://www.mammothmountain.com/on-the-mountain/mammoth-webcam/main-lodge',
    accessNote: 'Mammoth Mountain site/player is the source; no RCTV stream extraction.',
    scheduleNote: 'The original page has live-cam and snapshot elements; coverage can vary by season.',
  },
  {
    id: 'mountain-jackson-hole', name: 'Jackson Hole Mountain Cams', place: 'Teton Village, Wyoming, USA',
    tagline: 'A window toward the Tetons.',
    description: 'Jackson Hole Mountain Resort’s official camera directory and mountain-condition views.',
    category: 'mountain', scene: 'mountains', format: 'mixed',
    officialUrl: 'https://www.jacksonhole.com/live-mountain-cams',
    accessNote: 'Visit the resort’s own official cam viewer; no copied camera imagery or RCTV embed.',
    scheduleNote: 'Snow season, conditions and available camera angles change.',
  },
]
const SYMBOLS: Record<CoastRailSeed['category'], string> = { beach: '≋', harbor: '⚓', train: '▣', mountain: '△' }
const COLORS: Record<CoastRailSeed['category'], OpenStream['color']> = {
  beach: 'blue', harbor: 'mint', train: 'gold', mountain: 'violet',
}
export const COAST_RAIL_STREAMS: readonly OpenStream[] = SEEDS.map((item) => {
  const url = new URL(item.officialUrl)
  return {
    id: item.id, name: item.name, tagline: item.tagline, description: item.description,
    category: item.category, cameraScene: item.scene, cameraFormat: item.format, place: item.place,
    tags: [item.place, item.category + ' camera', item.scene],
    region: item.scheduleNote, officialUrl: item.officialUrl,
    officialDomain: url.hostname.replace(/^www\./, ''), playback: 'official',
    playbackNote: item.accessNote, sourceEvidence: item.officialUrl,
    color: COLORS[item.category], icon: SYMBOLS[item.category],
  }
})
export const COAST_RAIL_COUNTS = Object.freeze({
  beaches: COAST_RAIL_STREAMS.filter((x) => x.category === 'beach').length,
  harbors: COAST_RAIL_STREAMS.filter((x) => x.category === 'harbor').length,
  trains: COAST_RAIL_STREAMS.filter((x) => x.category === 'train').length,
  mountains: COAST_RAIL_STREAMS.filter((x) => x.category === 'mountain').length,
  total: COAST_RAIL_STREAMS.length,
})
