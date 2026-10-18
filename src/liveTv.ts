/**
 * RCTV v0.6: Curated official destinations, not scraped streams or a live EPG.
 * Internet FAST, public-service livestreams, and OTA broadcast reception are distinct.
 */
export type LiveSourceKind = 'fast' | 'public' | 'antenna'
export type LiveGenre = 'news' | 'movies' | 'sports' | 'family' | 'documentary' | 'variety'
export type SourceFilter = LiveSourceKind | 'all'
export type GenreFilter = LiveGenre | 'all'

export interface LiveSource {
  id: string
  name: string
  shortName: string
  kind: LiveSourceKind
  url: string
  headline: string
  description: string
  access: string
  genres: LiveGenre[]
  regionNote: string
  accountNote: string
  icon: string
  verifiedSource: string
  accent: 'coral' | 'violet' | 'gold' | 'cyan' | 'lime' | 'blue' | 'rose' | 'mint'
}

export const liveSources: readonly LiveSource[] = [
  {
    id: 'pluto', name: 'Pluto TV', shortName: 'PLUTO', kind: 'fast', icon: '✦',
    url: 'https://pluto.tv/', headline: 'Classic channel surfing, online.',
    description: 'Browse free linear-style entertainment channels and on-demand programs on Pluto TV.',
    access: 'Ad-supported streaming', genres: ['movies', 'news', 'sports', 'variety', 'family'],
    regionNote: 'Channel lineup varies by region.', accountNote: 'Provider determines login and device requirements.',
    verifiedSource: 'Official Pluto TV website', accent: 'violet',
  },
  {
    id: 'tubi-live', name: 'Tubi Live TV', shortName: 'TUBI', kind: 'fast', icon: '◈',
    url: 'https://tubitv.com/live', headline: 'Movies, local news, and plenty more.',
    description: 'Visit Tubi’s official live-TV guide for its changing lineup of free ad-supported channels.',
    access: 'Ad-supported streaming', genres: ['movies', 'news', 'sports', 'family', 'documentary'],
    regionNote: 'Live channels and access depend on country and location.', accountNote: 'Check any account or device requirements on Tubi.',
    verifiedSource: 'Official Tubi live guide', accent: 'coral',
  },
  {
    id: 'plex-live', name: 'Plex Live TV', shortName: 'PLEX', kind: 'fast', icon: '▶',
    url: 'https://watch.plex.tv/live-tv/channel', headline: 'Free live channels from Plex.',
    description: 'Discover Plex’s official ad-supported live channel guide without an antenna or tuner.',
    access: 'Ad-supported streaming', genres: ['movies', 'news', 'sports', 'family', 'documentary', 'variety'],
    regionNote: 'Lineup and titles depend on location.', accountNote: 'Check Plex for optional sign-in and supported devices.',
    verifiedSource: 'Official Plex live TV guide', accent: 'gold',
  },
  {
    id: 'sling-freestream', name: 'Sling Freestream', shortName: 'SLING', kind: 'fast', icon: '≋',
    url: 'https://www.sling.com/freestream', headline: 'Live channel surfing without a paid plan.',
    description: 'Explore Sling’s free ad-supported live channel selection on the official Freestream portal.',
    access: 'Ad-supported streaming', genres: ['movies', 'news', 'sports', 'family', 'variety'],
    regionNote: 'Offerings and device support depend on location.', accountNote: 'Some features need an account; basic streaming may not.',
    verifiedSource: 'Official Sling Freestream portal', accent: 'blue',
  },
  {
    id: 'roku-live', name: 'The Roku Channel', shortName: 'ROKU', kind: 'fast', icon: '◉',
    url: 'https://therokuchannel.roku.com/', headline: 'The Roku Channel’s free live-TV universe.',
    description: 'Browse the official Roku Channel, including free live channels and other offerings.',
    access: 'Free channels with ads; paid titles may also appear', genres: ['movies', 'news', 'sports', 'family', 'variety'],
    regionNote: 'Supported countries and device options vary.', accountNote: 'Some content and features may prompt sign-in.',
    verifiedSource: 'Official Roku Channel website', accent: 'violet',
  },
  {
    id: 'xumo-live', name: 'Xumo Play', shortName: 'XUMO', kind: 'fast', icon: '✳',
    url: 'https://play.xumo.com/live-guide', headline: 'Pick a channel and explore.',
    description: 'Browse Xumo Play’s official free live-TV channel guide by category.',
    access: 'Ad-supported streaming', genres: ['movies', 'news', 'sports', 'family', 'documentary'],
    regionNote: 'Geographic and device restrictions may apply.', accountNote: 'Provider controls sign-in requirements.',
    verifiedSource: 'Official Xumo Play live guide', accent: 'rose',
  },
  {
    id: 'pbs-live', name: 'PBS Local Livestream', shortName: 'PBS', kind: 'public', icon: '◌',
    url: 'https://www.pbs.org/', headline: 'Your local public television, online.',
    description: 'Find your local PBS station’s LIVE TV option on PBS.org when available in your service area.',
    access: 'Free local public-service stream where offered', genres: ['news', 'documentary', 'family', 'variety'],
    regionNote: 'Only available within participating US stations’ broadcast service areas.', accountNote: 'PBS.org local live stream generally does not require donation; app/device rules may vary.',
    verifiedSource: 'Official PBS website', accent: 'cyan',
  },
  {
    id: 'nasa-live', name: 'NASA Live / NASA+', shortName: 'NASA', kind: 'public', icon: '✧',
    url: 'https://www.nasa.gov/live/', headline: 'Space television from the source.',
    description: 'NASA’s official event schedule, live mission coverage, and links to free NASA programming.',
    access: 'Free public agency programming', genres: ['news', 'documentary', 'family'],
    regionNote: 'Live events are scheduled, not necessarily on air 24/7.', accountNote: 'Third-party distribution may have additional terms.',
    verifiedSource: 'Official NASA Live page', accent: 'mint',
  },
  {
    id: 'fcc-ota', name: 'Over-the-Air Antenna TV', shortName: 'OTA TV', kind: 'antenna', icon: '⌁',
    url: 'https://transition.fcc.gov/mb/engineering/dtvmaps/', headline: 'Old-school free-to-air broadcasting.',
    description: 'Use the FCC reception map to estimate broadcast TV stations reachable using an antenna and compatible tuner.',
    access: 'Broadcast reception; antenna and TV tuner required', genres: ['news', 'sports', 'family', 'variety'],
    regionNote: 'US reception depends on terrain, distance, antenna, and local broadcasters.', accountNote: 'Not an internet stream. This opens a reception-planning tool.',
    verifiedSource: 'Official FCC digital TV reception map', accent: 'lime',
  },
]

export const kindFilters: { id: SourceFilter; label: string }[] = [
  { id: 'all', label: 'Everything live & free' },
  { id: 'fast', label: 'Internet TV (FAST)' },
  { id: 'public', label: 'Public-service live' },
  { id: 'antenna', label: 'Antenna / FTA' },
]

export const genreFilters: { id: GenreFilter; label: string }[] = [
  { id: 'all', label: 'All interests' },
  { id: 'news', label: 'News' },
  { id: 'movies', label: 'Movies' },
  { id: 'sports', label: 'Sports' },
  { id: 'documentary', label: 'Documentaries' },
  { id: 'family', label: 'Family' },
  { id: 'variety', label: 'Variety' },
]

export function filterLiveSources(
  sources: readonly LiveSource[],
  { kind, genre, query, favoritesOnly, favorites }: {
    kind: SourceFilter
    genre: GenreFilter
    query: string
    favoritesOnly: boolean
    favorites: readonly string[]
  },
): LiveSource[] {
  const q = query.trim().toLocaleLowerCase()
  const saved = new Set(favorites)
  return sources.filter((source) => {
    if (kind !== 'all' && source.kind !== kind) return false
    if (genre !== 'all' && !source.genres.includes(genre)) return false
    if (favoritesOnly && !saved.has(source.id)) return false
    if (!q) return true
    return [source.name, source.headline, source.description, source.access, source.regionNote, ...source.genres]
      .join(' ').toLocaleLowerCase().includes(q)
  })
}

export const FAVORITES_STORAGE_KEY = 'reelcommons.live-tv.favorites.v1'
export function parseFavorites(raw: string | null, sources: readonly LiveSource[] = liveSources): string[] {
  if (!raw || raw.length > 5000) return []
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    const allowed = new Set(sources.map((s) => s.id))
    return [...new Set(value.filter((id): id is string => typeof id === 'string' && allowed.has(id)))].slice(0, 100)
  } catch { return [] }
}

export function pickSource(
  sources: readonly LiveSource[],
  random: () => number = Math.random,
): LiveSource | null {
  if (!sources.length) return null
  const value = random()
  const index = Number.isFinite(value) ? Math.min(sources.length - 1, Math.max(0, Math.floor(value * sources.length))) : 0
  return sources[index]
}

export function isOfficialSourceUrl(source: LiveSource): boolean {
  try {
    const url = new URL(source.url)
    return url.protocol === 'https:' && [
      'pluto.tv', 'tubitv.com', 'watch.plex.tv', 'www.sling.com',
      'therokuchannel.roku.com', 'play.xumo.com', 'www.pbs.org',
      'www.nasa.gov', 'transition.fcc.gov',
    ].includes(url.hostname)
  } catch { return false }
}
