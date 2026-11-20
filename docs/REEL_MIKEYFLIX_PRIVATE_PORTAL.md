# REEL Network private MikeyFlix doorway (Issue #39, first slice)

## Purpose

Expose the existing personal-media launcher inside REEL Network without copying media, building a second server, changing the RCTV CH 001–050 roster, or inventing Jellyfin stream playback.

- The owner's existing Jellyfin server is the private media origin; REEL Network never hosts those files.
- REEL Theater's merged [Rung 13 PR #13](https://github.com/MichaelWave369/ReelTheater/pull/13) provides a **user-configured local LAN launcher** in its Library.
- REEL Network has a new clearly labeled **personal media** panel, separate from the public REEL Originals programming and rights/publishing gates.
- The panel links to a GitHub Pages **candidate** for REEL Theater Library and a confirmed GitHub source fallback. A code repository and a workflow do not establish an actually working Pages deployment; do the manual check.

## Manual acceptance

1. Verify GitHub Pages is enabled for ReelTheater and confirm the real published URL in GitHub Settings → Pages. If it is not at the default candidate URL, update the panel after confirming the actual address.
2. Open REEL Network, locate the personal MikeyFlix panel, follow the Theater Library link, and verify the browser **actually loads**. The code does not auto-probe or advertise it as already deployed.
3. In REEL Theater, enter a private PC LAN address to the existing Jellyfin server (with no credential or token in its URL), save it, and deliberately open it. The native Jellyfin app remains the recommended Fire TV player.
4. Confirm REEL Network never learns or stores the server URL: its static panel has no form, localStorage, connection request or media API calls.
5. Confirm mobile/keyboard navigation and the unchanged 50 RCTV channels, original programming pitch data, source trust gates and production ledger.

## Later work, not implemented by this PR

An opt-in, locally hosted, short-lived, least-privilege **Jellyfin adapter** could expose authenticated read-only catalog summaries and playback handoff. That needs separate CORS/mixed-content/transport design and physical TV/XR field qualification. Avoid forwarding Jellyfin port 8096 or exposing any library address, access token, filenames or watch history through GitHub Pages, public channel directories or export packets.

Follow-on work is tracked by [REEL issue #39](https://github.com/MichaelWave369/ReelCommons/issues/39) and [PhiCade XR issue #68](https://github.com/MichaelWave369/PhiCade/issues/68).
