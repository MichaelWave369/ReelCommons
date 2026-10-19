/**
 * RCTV v1.3 · Open Streams Commons
 *
 * Original, hand-curated official destinations. Metadata is NOT a channel
 * availability scan or stream-rights license. Source types remain separate
 * from playback capabilities, which are strictly allowlisted.
 */
export type StreamCategory = 'tv' | 'radio' | 'earth' | 'space' | 'city' | 'nature' | 'beach' | 'harbor' | 'train' | 'mountain'
export type CameraScene = 'streets' | 'landmarks' | 'national-parks' | 'volcanoes' | 'wildlife' | 'ocean' | 'beaches' | 'harbors' | 'railways' | 'mountains'
export type CameraFormat = 'video' | 'refreshed-still' | 'mixed'
export type PlaybackPolicy = 'official' | 'youtube-embed' | 'published-audio'
export interface OpenStream {
  id: string
  name: string
  tagline: string
  description: string
  category: StreamCategory
  tags: string[]
  region: string
  officialUrl: string
  officialDomain: string
  playback: PlaybackPolicy
  playbackNote: string
  // Only hardcoded, reviewed, explicitly supported capabilities are permitted.
  youtubeId?: string
  audioUrl?: string
  color: 'mint' | 'blue' | 'gold' | 'violet' | 'coral' | 'rose'
  icon: string
  sourceEvidence: string
  cameraScene?: CameraScene
  cameraFormat?: CameraFormat
  place?: string
}
export const OPEN_STREAMS: readonly OpenStream[] = [
  {
    id: 'cbs-news', name: 'CBS News 24/7', tagline: 'News from the official newsroom.',
    description: 'National breaking news and local streams, including Sacramento coverage when available.',
    category: 'tv', tags: ['News', 'Live', 'USA'], region: 'Availability may vary by region.',
    officialUrl: 'https://www.cbsnews.com/live/', officialDomain: 'cbsnews.com',
    playback: 'official', playbackNote: 'CBS controls its streaming player, lineup and advertising.',
    color: 'blue', icon: '▣', sourceEvidence: 'CBS News official live streaming page',
  },
  {
    id: 'abc-news', name: 'ABC News Live', tagline: 'Live headlines and reporting.',
    description: 'Watch ABC News live coverage and special broadcasts on the broadcaster’s own player.',
    category: 'tv', tags: ['News', 'Live', 'USA'], region: 'Regional programming and availability can change.',
    officialUrl: 'https://abcnews.go.com/Live/', officialDomain: 'abcnews.go.com',
    playback: 'official', playbackNote: 'Official broadcaster player; no syndicated stream is embedded.',
    color: 'coral', icon: '◉', sourceEvidence: 'ABC News official Live destination',
  },
  {
    id: 'house-live', name: 'U.S. House FloorCast', tagline: 'See the legislature at work.',
    description: 'Official proceedings from the U.S. House when it is in session, with archived activity.',
    category: 'tv', tags: ['Government', 'Public', 'Events'], region: 'Sessions occur on a published schedule.',
    officialUrl: 'https://www.house.gov/watch-houselive', officialDomain: 'house.gov',
    playback: 'official', playbackNote: 'Availability follows the legislative calendar, not a 24/7 channel.',
    color: 'violet', icon: '⌘', sourceEvidence: 'Official U.S. House Watch Live Proceedings',
  },
  {
    id: 'pbs-online', name: 'PBS Local Livestream', tagline: 'Public television, local to you.',
    description: 'Discover your local station’s official streaming options, where supported.',
    category: 'tv', tags: ['Public', 'Documentary', 'Local'], region: 'Eligible station area may be required.',
    officialUrl: 'https://www.pbs.org/', officialDomain: 'pbs.org',
    playback: 'official', playbackNote: 'Local station identification and program availability are set by PBS.',
    color: 'mint', icon: '◌', sourceEvidence: 'Official PBS website and local station player',
  },
  {
    id: 'kexp', name: 'KEXP Radio', tagline: 'Independent music discovery.',
    description: 'Seattle public radio and eclectic music, with broadcaster-published third-party listening URLs.',
    category: 'radio', tags: ['Music', 'Independent', 'Live'], region: 'Some places restrict audio streams.',
    officialUrl: 'https://www.kexp.org/listen/', officialDomain: 'kexp.org',
    playback: 'published-audio', audioUrl: 'https://kexp.streamguys1.com/kexp160.aac',
    playbackNote: 'KEXP publishes this AAC stream for third-party listeners. Personal listening only: do not record, relay, or rebroadcast.',
    color: 'gold', icon: '♫', sourceEvidence: 'https://www.kexp.org/mobile/kexp-livestreams/',
  },
  {
    id: 'somafm', name: 'SomaFM', tagline: 'Independent, listener-supported radio.',
    description: 'Discover eclectic electronic and alternative stations on SomaFM’s own authorized player.',
    category: 'radio', tags: ['Music', 'Electronic', 'Independent'], region: 'Station streams may be region-restricted.',
    officialUrl: 'https://somafm.com/', officialDomain: 'somafm.com',
    playback: 'official', playbackNote: 'SomaFM prohibits unapproved third-party stream embedding. Always use its official player.',
    color: 'violet', icon: '≋', sourceEvidence: 'https://somafm.com/contact/tos.html',
  },
  {
    id: 'radio-garden', name: 'Radio Garden', tagline: 'Spin the globe of radio.',
    description: 'Explore radio stations worldwide through Radio Garden’s interactive map and official interface.',
    category: 'radio', tags: ['Global', 'Community', 'Music'], region: 'Streams vary by broadcaster and territory.',
    officialUrl: 'https://radio.garden/browse', officialDomain: 'radio.garden',
    playback: 'official', playbackNote: 'Listening occurs on Radio Garden, not through a copied station stream.',
    color: 'mint', icon: '◎', sourceEvidence: 'Radio Garden official Browse',
  },
  {
    id: 'radio-browser', name: 'Radio Browser Directory', tagline: 'An open window into stations.',
    description: 'Explore an open directory of internet radio stations and their broadcaster-controlled destinations.',
    category: 'radio', tags: ['Directory', 'Global', 'Independent'], region: 'Listings are community-maintained and not guaranteed live.',
    officialUrl: 'https://www.radio-browser.info/', officialDomain: 'radio-browser.info',
    playback: 'official', playbackNote: 'Directory listing does not establish third-party playback or stream rights.',
    color: 'blue', icon: '▤', sourceEvidence: 'https://docs.radio-browser.info/',
  },
  {
    id: 'radio-paradise', name: 'Radio Paradise', tagline: 'Eclectic internet radio.',
    description: 'Listener-supported music broadcasting with multiple mixes and an official listening interface.',
    category: 'radio', tags: ['Music', 'Eclectic', 'Independent'], region: 'Playback may vary by region.',
    officialUrl: 'https://radioparadise.com/', officialDomain: 'radioparadise.com',
    playback: 'official', playbackNote: 'Open the official player; no third-party stream copying or rebroadcast.',
    color: 'coral', icon: '◈', sourceEvidence: 'Radio Paradise official listening site',
  },
  {
    id: 'monterey-cams', name: 'Monterey Bay Aquarium Cams', tagline: 'The ocean, right outside your screen.',
    description: 'Visit official live sea otter, shark, jellyfish, kelp forest and bay cameras.',
    category: 'earth', tags: ['Ocean', 'Wildlife', 'Live Cam'], region: 'Many cams broadcast around 7 a.m.–7 p.m. Pacific, with offline video outside hours.',
    officialUrl: 'https://www.montereybayaquarium.org/cams-videos/live-cams', officialDomain: 'montereybayaquarium.org',
    playback: 'official', playbackNote: 'Cameras may be offline or show replay; open the aquarium’s own player.',
    color: 'blue', icon: '⌁', sourceEvidence: 'Monterey Bay Aquarium official live cam directory',
  },
  {
    id: 'explore-wildlife', name: 'Explore.org Live Nature Cams', tagline: 'A front-row seat to wild places.',
    description: 'Visit the nonprofit live-cam network to find wildlife, nature, marine and conservation cameras.',
    category: 'earth', tags: ['Wildlife', 'Live Cam', 'Conservation'], region: 'Cam schedules, seasonal feeds and availability change.',
    officialUrl: 'https://explore.org/livecams', officialDomain: 'explore.org',
    playback: 'official', playbackNote: 'Explore.org controls individual feeds and playback permissions.',
    color: 'mint', icon: '✳', sourceEvidence: 'Explore.org official livecams index',
  },
  {
    id: 'nasa-live', name: 'NASA Live / NASA+', tagline: 'Launches, science and mission briefings.',
    description: 'Official NASA live coverage schedules and access to free agency programming.',
    category: 'space', tags: ['NASA', 'Missions', 'Events'], region: 'Events are scheduled and can have temporary off-air periods.',
    officialUrl: 'https://www.nasa.gov/live/', officialDomain: 'nasa.gov',
    playback: 'official', playbackNote: 'This is an event guide, not a guaranteed continuous station.',
    color: 'gold', icon: '✦', sourceEvidence: 'NASA official live events and NASA+ page',
  },
  {
    id: 'nasa-iss', name: 'NASA ISS Live Views', tagline: 'Earth through the station window.',
    description: 'NASA’s official YouTube International Space Station live video, with intermittent communication-loss screens.',
    category: 'space', tags: ['NASA', 'ISS', 'Earth', 'Live Cam'], region: 'Feed can be unavailable, interrupted, or embedding-disabled.',
    officialUrl: 'https://www.youtube.com/watch?v=jKHvbJe9c_Y', officialDomain: 'youtube.com',
    playback: 'youtube-embed', youtubeId: 'jKHvbJe9c_Y',
    playbackNote: 'Uses YouTube’s supported privacy-enhanced iframe only when you press play. The broadcaster or YouTube can block embedding at any time.',
    color: 'mint', icon: '◉', sourceEvidence: 'NASA verified official YouTube ISS live-video page and YouTube embed documentation',
  },
  {
    id: 'esa-webtv', name: 'ESA Web TV', tagline: 'Science from the European Space Agency.',
    description: 'Explore ESA’s official space programming, mission streams and scheduled live transmissions.',
    category: 'space', tags: ['ESA', 'Space', 'Science'], region: 'Events follow a schedule and may be unavailable outside broadcasts.',
    officialUrl: 'https://www.esa.int/ESA_Multimedia/ESA_Web_TV', officialDomain: 'esa.int',
    playback: 'official', playbackNote: 'ESA’s player stays on ESA’s own website.',
    color: 'violet', icon: '✧', sourceEvidence: 'ESA official Web TV',
  },
]
export const STREAM_CATEGORIES: { id: StreamCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All channels', icon: '✳' },
  { id: 'tv', label: 'Live TV', icon: '▣' },
  { id: 'radio', label: 'Radio', icon: '♫' },
  { id: 'earth', label: 'Live Earth', icon: '⌁' },
  { id: 'space', label: 'Space & Science', icon: '✦' },
  { id: 'city', label: 'City Cams', icon: '▤' },
  { id: 'nature', label: 'Nature Cams', icon: '♧' },
  { id: 'beach', label: 'Beaches', icon: '≋' },
  { id: 'harbor', label: 'Harbors', icon: '⚓' },
  { id: 'train', label: 'Train Cams', icon: '▣' },
  { id: 'mountain', label: 'Mountain Views', icon: '△' },
]
export function filterOpenStreams(
  sources: readonly OpenStream[],
  category: StreamCategory | 'all', query: string, favoriteIds: readonly string[], favoriteOnly: boolean,
): OpenStream[] {
  const q = query.trim().toLocaleLowerCase().slice(0, 100)
  const favorites = new Set(favoriteIds)
  return sources.filter((source) => {
    if (category !== 'all' && source.category !== category) return false
    if (favoriteOnly && !favorites.has(source.id)) return false
    return !q || [source.name, source.tagline, source.description, source.region, ...source.tags]
      .join(' ').toLocaleLowerCase().includes(q)
  })
}
export const CAMERA_SCENE_FILTERS: { id: CameraScene | 'all'; label: string }[] = [
  { id: 'all', label: 'All scenes' }, { id: 'streets', label: 'City streets' },
  { id: 'landmarks', label: 'Landmarks' }, { id: 'national-parks', label: 'National parks' },
  { id: 'volcanoes', label: 'Volcanoes' }, { id: 'wildlife', label: 'Wildlife' }, { id: 'ocean', label: 'Ocean life' },
  { id: 'beaches', label: 'Beaches' }, { id: 'harbors', label: 'Harbors' },
  { id: 'railways', label: 'Railways' }, { id: 'mountains', label: 'Mountain peaks' },
]
export const CAMERA_FORMAT_LABELS: Record<CameraFormat, string> = {
  video: 'PROVIDER-LISTED VIDEO', 'refreshed-still': 'REFRESHED STILL IMAGES', mixed: 'VARIABLE / SCHEDULED',
}
export function filterCameraScene(sources: readonly OpenStream[], scene: CameraScene | 'all'): OpenStream[] {
  return scene === 'all' ? [...sources] : sources.filter((source) => source.cameraScene === scene)
}
export const COMMONS_FAVORITES_KEY = 'rctv-open-streams-favorites-v1'
export function readCommonsFavorites(raw: string | null, sources: readonly OpenStream[] = OPEN_STREAMS): string[] {
  try {
    const data: unknown = raw ? JSON.parse(raw) as unknown : []
    if (!Array.isArray(data)) return []
    const allowed = new Set(sources.map((source) => source.id))
    return [...new Set(data.filter((id): id is string => typeof id === 'string' && allowed.has(id)))].slice(0, 60)
  } catch { return [] }
}
/** Only source-owned, explicitly reviewed playback URLs can be loaded inline. */
export function playableUrl(source: OpenStream): string | null {
  if (source.playback === 'youtube-embed') {
    return source.youtubeId && /^[-_a-zA-Z0-9]{11}$/.test(source.youtubeId) &&
      source.id === 'nasa-iss' && source.youtubeId === 'jKHvbJe9c_Y'
      ? 'https://www.youtube-nocookie.com/embed/' + source.youtubeId + '?rel=0' : null
  }
  if (source.playback === 'published-audio') {
    return source.id === 'kexp' && source.audioUrl === 'https://kexp.streamguys1.com/kexp160.aac'
      ? source.audioUrl : null
  }
  return null
}
export function playbackLabel(source: OpenStream): string {
  return playableUrl(source) === null ? 'OFFICIAL PLAYER' :
    source.playback === 'youtube-embed' ? 'OPTIONAL EMBED' : 'BROADCASTER AUDIO LINK'
}
