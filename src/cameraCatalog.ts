/**
 * RCTV v1.4 · independently curated official city & nature cam directory.
 * NO camera here is embedded, downloaded, proxied or treated as license-free.
 * 'video' / 'refreshed-still' means source-described format, not a live check.
 */
import { OPEN_STREAMS } from './openStreams'
import { COAST_RAIL_STREAMS } from './coastRailCatalog'
import type { CameraFormat, CameraScene, OpenStream } from './openStreams'

interface CameraSeed {
  id: string
  name: string
  place: string
  line: string
  detail: string
  url: string
  category: 'city' | 'nature'
  scene: CameraScene
  format: CameraFormat
  caveat: string
  usage?: string
}
const CAMERAS: readonly CameraSeed[] = [
  // Cities: individually checked publisher-operated destinations.
  {
    id: 'nyc-times-square', name: 'Times Square · New York', place: 'New York City, USA',
    line: 'A city that never stops moving.', detail: 'EarthCam views of Times Square, its iconic billboards, pedestrians and street life.',
    url: 'https://www.earthcam.com/usa/newyork/timessquare/', category: 'city',
    scene: 'streets', format: 'video', caveat: 'The broadcaster can interrupt or change cameras.',
  },
  {
    id: 'london-abbey-road', name: 'Abbey Road Crossing', place: 'London, United Kingdom',
    line: 'A world-famous crossing, live from the studio.', detail: 'Official Abbey Road Studios zebra-crossing webcam and its footage archive.',
    url: 'https://www.abbeyroad.com/crossing', category: 'city',
    scene: 'streets', format: 'video', caveat: 'Live footage and archive availability are studio-controlled.',
  },
  {
    id: 'new-orleans-bourbon', name: 'Bourbon Street', place: 'New Orleans, USA',
    line: 'Music, nightlife and the French Quarter.', detail: 'The official EarthCam Bourbon Street view, from daytime pedestrians to late-night energy.',
    url: 'https://www.earthcam.com/usa/louisiana/neworleans/bourbonstreet/', category: 'city',
    scene: 'streets', format: 'video', caveat: 'EarthCam controls cameras, ads and viewing restrictions.',
  },
  {
    id: 'vegas-skyline', name: 'Las Vegas Skyline', place: 'Las Vegas, USA',
    line: 'Neon desert cityscapes.', detail: 'EarthCam views of Las Vegas, the Strip area and the Mojave Desert.',
    url: 'https://www.earthcam.com/usa/nevada/lasvegas/skyline/', category: 'city',
    scene: 'landmarks', format: 'video', caveat: 'Camera selection and availability are EarthCam-managed.',
  },
  {
    id: 'tokyo-shibuya', name: 'Shibuya Streets · Tokyo', place: 'Tokyo, Japan',
    line: 'The organized rhythm of the crossing.', detail: 'SkylineWebcams view of the bustling Shibuya streets and crossing.',
    url: 'https://www.skylinewebcams.com/en/webcam/japan/kanto/tokyo/streets-of-shibuya.html', category: 'city',
    scene: 'streets', format: 'video', caveat: 'Feed availability, advertising and access vary.',
  },
  {
    id: 'venice-grand-canal', name: 'Venice Grand Canal', place: 'Venice, Italy',
    line: 'Watch the boats drift through history.', detail: 'SkylineWebcams official waterfront view of gondolas and traffic on the Grand Canal.',
    url: 'https://www.skylinewebcams.com/en/webcam/italia/veneto/venezia/canal-grande.html', category: 'city',
    scene: 'landmarks', format: 'video', caveat: 'Official site controls the feed and may interrupt service.',
  },
  {
    id: 'rome-trevi-fountain', name: 'Trevi Fountain', place: 'Rome, Italy',
    line: 'Roman streets around a spectacular fountain.', detail: 'SkylineWebcams official camera overlooking the famous Trevi Fountain.',
    url: 'https://www.skylinewebcams.com/en/webcam/italia/lazio/roma/fontana-di-trevi.html', category: 'city',
    scene: 'landmarks', format: 'video', caveat: 'The broadcaster may restrict or interrupt the camera.',
  },

  // National parks: NPS lists live video and periodically refreshed still views.
  {
    id: 'yellowstone-geysers', name: 'Yellowstone · Old Faithful', place: 'Wyoming, USA',
    line: 'A geyser worth waiting for.', detail: 'Official park webcams including the Old Faithful / Upper Geyser Basin live video and other park viewpoints.',
    url: 'https://www.nps.gov/yell/learn/photosmultimedia/webcams.htm', category: 'nature',
    scene: 'national-parks', format: 'mixed', caveat: 'One live feed plus other webcams; downtime and still-image refresh vary.',
  },
  {
    id: 'yosemite-valley', name: 'Yosemite · Valley Views', place: 'California, USA',
    line: 'Half Dome and El Capitan without the hike.', detail: 'National Park Service partner webcams covering Half Dome, Yosemite Falls and the valley.',
    url: 'https://www.nps.gov/yose/learn/photosmultimedia/webcams.htm', category: 'nature',
    scene: 'national-parks', format: 'refreshed-still',
    caveat: 'Still images and seasonal cameras can be stale or offline.',
    usage: 'Yosemite Conservancy requests a webcam usage agreement to feature its images, so RCTV only links to the NPS directory.',
  },
  {
    id: 'grand-canyon-south-rim', name: 'Grand Canyon · South Rim', place: 'Arizona, USA',
    line: 'A changing canyon by the minute.', detail: 'NPS webcams at Yavapai Point, Kolb Studio, trailheads and canyon entrances.',
    url: 'https://www.nps.gov/grca/learn/photosmultimedia/webcams.htm', category: 'nature',
    scene: 'national-parks', format: 'refreshed-still',
    caveat: 'Official images can refresh every 1–15 minutes; check timestamps for currentness.',
  },
  {
    id: 'glacier-montana', name: 'Glacier National Park', place: 'Montana, USA',
    line: 'Lakes, mountains and seasons passing.', detail: 'National Park Service webcams of Apgar, Lake McDonald, Logan Pass, Many Glacier and more.',
    url: 'https://www.nps.gov/glac/learn/photosmultimedia/webcams.htm', category: 'nature',
    scene: 'national-parks', format: 'refreshed-still',
    caveat: 'Weather, remote connectivity and seasonal closures affect cameras.',
  },
  {
    id: 'rocky-mountain-park', name: 'Rocky Mountain National Park', place: 'Colorado, USA',
    line: 'High mountain weather from the source.', detail: 'Official park webcam views of Longs Peak, alpine tundra and the Continental Divide.',
    url: 'https://www.nps.gov/romo/learn/photosmultimedia/webcams.htm', category: 'nature',
    scene: 'national-parks', format: 'refreshed-still',
    caveat: 'Camera refresh timing and snow-season access vary.',
  },

  // Volcano science: USGS notes image refresh, darkness/weather and outages.
  {
    id: 'usgs-kilauea', name: 'Kīlauea · Summit Camera', place: 'Hawaiʻi, USA',
    line: 'A geological window into an active volcano.', detail: 'USGS Hawaiian Volcano Observatory camera looking toward Halemaʻumaʻu.',
    url: 'https://volcanoes.usgs.gov/observatories/hvo/cams/panorama.php?cam=V3cam',
    category: 'nature', scene: 'volcanoes', format: 'refreshed-still',
    caveat: 'Clouds, rain, darkness and camera outages can obscure the image; not an eruption warning service.',
  },
  {
    id: 'usgs-mauna-loa', name: 'Mauna Loa · Thermal Camera', place: 'Hawaiʻi, USA',
    line: 'The mountain through a thermal eye.', detail: 'USGS summit thermal camera monitoring Mokuʻāweoweo caldera.',
    url: 'https://volcanoes.usgs.gov/observatories/hvo/cams/panorama.php?cam=MTcam',
    category: 'nature', scene: 'volcanoes', format: 'refreshed-still',
    caveat: 'Image uptime and field of view vary. Always consult USGS hazard updates separately.',
  },

  // Animals and oceans: scheduling, habitat and replay caveats included.
  {
    id: 'smithsonian-pandas', name: 'Smithsonian Giant Pandas', place: 'Washington, DC, USA',
    line: 'A little panda time is a good thing.', detail: 'Official National Zoo cameras of Bao Li and Qing Bao in their habitats.',
    url: 'https://nationalzoo.si.edu/webcams/panda-cam', category: 'nature',
    scene: 'wildlife', format: 'mixed',
    caveat: 'Live 7 a.m.–7 p.m. Eastern; a prerecorded view is shown overnight.',
  },
  {
    id: 'smithsonian-zoo', name: 'Smithsonian Zoo Cams', place: 'Washington, DC, USA',
    line: 'A front-row seat to animal habitats.', detail: 'The zoo camera directory includes elephants, lions, pandas and naked mole-rats.',
    url: 'https://nationalzoo.si.edu/webcams', category: 'nature',
    scene: 'wildlife', format: 'mixed',
    caveat: 'Individual cameras and schedules vary, and footage may be replayed.',
  },
  {
    id: 'cornell-bird-cams', name: 'Cornell Lab Bird Cams', place: 'Worldwide',
    line: 'Birds from the backyard to the coast.', detail: 'Cornell Lab official directory of live, offline and retired bird webcams.',
    url: 'https://www.allaboutbirds.org/cams/all-cams/', category: 'nature',
    scene: 'wildlife', format: 'mixed',
    caveat: 'Cornell explicitly labels some cams off or retired; not every entry is live.',
  },
  {
    id: 'cornell-feederwatch', name: 'Cornell FeederWatch · Ithaca', place: 'Ithaca, New York, USA',
    line: 'The busiest small dining room in New York.', detail: 'Cornell Lab’s official live view of birds around the Ithaca feeding stations.',
    url: 'https://www.allaboutbirds.org/cams/cornell-lab-feederwatch/',
    category: 'nature', scene: 'wildlife', format: 'video',
    caveat: 'Live cam may be interrupted for maintenance or technical issues.',
  },
  {
    id: 'aquarium-pacific', name: 'Aquarium of the Pacific', place: 'Long Beach, California, USA',
    line: 'Penguins, reefs, and a peaceful ocean.', detail: 'Official aquarium webcams of Penguin Habitat, Shark Lagoon, Blue Cavern and Tropical Reef.',
    url: 'https://www.aquariumofpacific.org/exhibits/webcams', category: 'nature',
    scene: 'ocean', format: 'mixed',
    caveat: 'Individual feeds and web-player formats vary.',
  },
  {
    id: 'georgia-aquarium-cams', name: 'Georgia Aquarium Live', place: 'Atlanta, Georgia, USA',
    line: 'Sharks, belugas, sea lions and jellyfish.', detail: 'Georgia Aquarium’s own camera directory showcasing marine animals and exhibits.',
    url: 'https://www.georgiaaquarium.org/webcam/', category: 'nature',
    scene: 'ocean', format: 'mixed',
    caveat: 'Program times, feeds and access vary by exhibit.',
  },
]

const iconByScene: Record<CameraScene, string> = {
  streets: '▦', landmarks: '◈', 'national-parks': '△',
  volcanoes: '♨', wildlife: '✳', ocean: '≋',
  beaches: '≋', harbors: '⚓', railways: '▣', mountains: '△',
}
const accentByScene: Record<CameraScene, OpenStream['color']> = {
  streets: 'violet', landmarks: 'gold', 'national-parks': 'mint',
  volcanoes: 'coral', wildlife: 'rose', ocean: 'blue',
  beaches: 'blue', harbors: 'mint', railways: 'gold', mountains: 'violet',
}
export const CAMERA_STREAMS: readonly OpenStream[] = CAMERAS.map((camera) => ({
  id: camera.id, name: camera.name, tagline: camera.line, description: camera.detail,
  place: camera.place, category: camera.category, cameraScene: camera.scene,
  cameraFormat: camera.format,
  tags: [camera.place, camera.scene.replace('-', ' '), camera.category === 'city' ? 'City camera' : 'Nature camera'],
  region: camera.caveat, officialUrl: camera.url,
  officialDomain: new URL(camera.url).hostname.replace(/^www\./, ''),
  playback: 'official', playbackNote: camera.usage ??
    'The camera operator owns its player and stream. RCTV opens the official website and does not embed, record or restream it.',
  sourceEvidence: camera.url, color: accentByScene[camera.scene], icon: iconByScene[camera.scene],
}))
export const ALL_OPEN_STREAMS: readonly OpenStream[] = [...OPEN_STREAMS, ...CAMERA_STREAMS, ...COAST_RAIL_STREAMS]
export const CAMERA_COUNTS = Object.freeze({
  cities: CAMERA_STREAMS.filter((cam) => cam.category === 'city').length,
  nature: CAMERA_STREAMS.filter((cam) => cam.category === 'nature').length,
  total: CAMERA_STREAMS.length,
})
