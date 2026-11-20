/**
 * REEL Network private-media doorway, not an API adapter or broadcast source.
 * Only static, public project URLs appear here. No user library hosts or tokens.
 * A Pages deployment must be separately verified by its owner on their device.
 */
export const THEATER_PAGES_CANDIDATE = 'https://michaelwave369.github.io/ReelTheater/#library'
export const THEATER_SOURCE = 'https://github.com/MichaelWave369/ReelTheater'

export default function MikeyFlixPortal() {
  return <aside className="reel-mikeyflix" id="reel-mikeyflix" aria-labelledby="reel-mikeyflix-title">
    <div className="reel-mikeyflix-art" aria-hidden="true">
      <span>REEL / PRIVATE MEDIA</span>
      <strong>MIKEY<span>FLIX</span></strong>
      <small>YOUR ARCHIVES. YOUR NETWORK.</small>
    </div>
    <div className="reel-mikeyflix-copy">
      <p className="reel-mikeyflix-label">PERSONAL MEDIA · NOT A PUBLIC CHANNEL</p>
      <h3 id="reel-mikeyflix-title">Your media lives at home.</h3>
      <p>Your existing Jellyfin server remains on your own PC. REEL Theater provides a manual, private LAN launcher through its Library screen. REEL Network never receives your media files, server address, passwords, tokens or watch history.</p>
      <div className="reel-mikeyflix-actions">
        <a href={THEATER_PAGES_CANDIDATE} target="_blank" rel="noopener noreferrer" aria-label="Try REEL Theater Library on GitHub Pages (deployment not verified)">Try REEL Theater Library ↗</a>
        <a href={THEATER_SOURCE} target="_blank" rel="noopener noreferrer">View REEL Theater source ↗</a>
      </div>
      <p className="reel-mikeyflix-limits">The GitHub Pages address is a deployment candidate, not verified as live. If unavailable, use the source link. Browser-to-local-server playback is not embedded here. Your existing Fire TV Jellyfin app remains the working playback route.</p>
    </div>
  </aside>
}
