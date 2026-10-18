export type ServiceKind = 'ads' | 'library' | 'public'
export type Mood = 'all' | 'comfort' | 'curious' | 'energy' | 'nostalgia'
export type ServiceFilter = ServiceKind | 'all'
export type MediaKind = 'Movie' | 'Series'
export type Tab = 'discover' | 'catalog' | 'live' | 'fta' | 'signal' | 'tuner' | 'watchlist' | 'guide'

export interface Service {
  id: string
  name: string
  initials: string
  tagline: string
  description: string
  url: string
  kind: ServiceKind
  access: string
  highlight: string
  tags: string[]
  moods: Exclude<Mood, 'all'>[]
  color: string
}

export interface WatchItem {
  id: string
  title: string
  kind: MediaKind
  note: string
  watched: boolean
  createdAt: number
}

export const serviceKinds: { id: ServiceFilter; label: string }[] = [
  { id: 'all', label: 'All sources' },
  { id: 'ads', label: 'Free with ads' },
  { id: 'library', label: 'Library access' },
  { id: 'public', label: 'Public collections' },
]

export const moods: { id: Mood; label: string; symbol: string }[] = [
  { id: 'all', label: 'Anything', symbol: '✳' },
  { id: 'comfort', label: 'Comfort', symbol: '☕' },
  { id: 'curious', label: 'Curious', symbol: '✦' },
  { id: 'energy', label: 'Something lively', symbol: '⚡' },
  { id: 'nostalgia', label: 'Throwback', symbol: '◷' },
]

// Service homepages, not title-specific availability claims.
// Content, geographic coverage, ads, and library rules change.
export const services: Service[] = [
  {
    id: 'tubi', name: 'Tubi', initials: 'tu', tagline: 'Big screen, zero subscription',
    description: 'Explore on-demand movies and series on a free, ad-supported streaming service.',
    url: 'https://tubitv.com/', kind: 'ads', access: 'Free with ads',
    highlight: 'Movie night essentials', tags: ['movies', 'series', 'cult', 'action', 'comedy'],
    moods: ['comfort', 'energy', 'nostalgia'], color: 'tangerine'
  },
  {
    id: 'pluto', name: 'Pluto TV', initials: 'pl', tagline: 'Flip through something fun',
    description: 'Discover live-style channels and free on-demand entertainment.',
    url: 'https://pluto.tv/', kind: 'ads', access: 'Free with ads',
    highlight: 'Channel surfing', tags: ['live', 'channels', 'movies', 'series', 'news'],
    moods: ['comfort', 'energy', 'nostalgia'], color: 'violet'
  },
  {
    id: 'plex', name: 'Plex', initials: 'px', tagline: 'Find your next screen obsession',
    description: 'Browse Plex’s free streaming films, shows, and live TV offerings.',
    url: 'https://watch.plex.tv/', kind: 'ads', access: 'Free with ads',
    highlight: 'Films & live TV', tags: ['movies', 'live', 'series', 'documentary'],
    moods: ['comfort', 'curious', 'energy'], color: 'gold'
  },
  {
    id: 'roku', name: 'The Roku Channel', initials: 'ro', tagline: 'A whole lot to explore',
    description: 'Watch free movies, shows, and live programming where the service is supported.',
    url: 'https://therokuchannel.roku.com/', kind: 'ads', access: 'Free with ads',
    highlight: 'Easy viewing', tags: ['movies', 'series', 'live', 'comedy'],
    moods: ['comfort', 'energy'], color: 'purple'
  },
  {
    id: 'kanopy', name: 'Kanopy', initials: 'ka', tagline: 'Your library card has range',
    description: 'Explore films and documentaries through participating public libraries and universities.',
    url: 'https://www.kanopy.com/', kind: 'library', access: 'Participating library required',
    highlight: 'Thoughtful cinema', tags: ['film', 'independent', 'documentary', 'library', 'classic'],
    moods: ['curious', 'nostalgia'], color: 'sky'
  },
  {
    id: 'hoopla', name: 'hoopla', initials: 'ho', tagline: 'Borrow some brilliance',
    description: 'Borrow streaming movies and television through a participating library.',
    url: 'https://www.hoopladigital.com/', kind: 'library', access: 'Participating library required',
    highlight: 'Library-powered', tags: ['movies', 'series', 'library', 'family'],
    moods: ['comfort', 'curious', 'nostalgia'], color: 'blue'
  },
  {
    id: 'pbs', name: 'PBS', initials: 'pb', tagline: 'A little more to discover',
    description: 'Find public television videos and selected free episodes, subject to location and availability.',
    url: 'https://www.pbs.org/video/', kind: 'public', access: 'Selected videos free',
    highlight: 'Public media', tags: ['documentary', 'science', 'history', 'series', 'public'],
    moods: ['curious', 'comfort'], color: 'teal'
  },
  {
    id: 'archive', name: 'Internet Archive', initials: 'ia', tagline: 'Take a trip through time',
    description: 'Browse historical moving-image collections. Check each item’s rights and playback details.',
    url: 'https://archive.org/details/movies', kind: 'public', access: 'Item rights vary',
    highlight: 'Time machine', tags: ['archive', 'history', 'classic', 'film', 'vintage'],
    moods: ['curious', 'nostalgia'], color: 'rose'
  },
]
