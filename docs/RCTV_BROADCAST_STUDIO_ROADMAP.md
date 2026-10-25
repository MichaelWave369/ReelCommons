# RCTV Broadcasting & Podcast Studio · Next milestone blueprint

Status: **proposal only**. Recording, live streaming, creator publishing, and owned-program channels are **not** implemented by v3.1.

## Goal

A browser-based, creator-owned production room integrated with ReelCommons. Authors can record voices and cameras, build scenes, mix music they own or have permission to use, produce episodes, export recordings, and eventually publish to broadcaster-owned RCTV channels. The existing 50 official-source slots stay stable; creator channels are an independently reviewed extension, not self-approving input.

## Proposed phases

### v3.2 · Local-first Creator Studio (record, edit, export)
- Dedicated TV Studio entry in Unified TV Home; no automatic microphone/camera access.
- Consent-gated `getUserMedia` for microphones and cameras. Display prominent live input and recording state; stop and release tracks when closing the studio. Clear permission errors and browser-compatibility fallback.
- Audio console: individual mic/music/FX faders, input mute, master output, peak indicators with `Web Audio API`. Imported tracks remain local to the user's browser. No automatic downloads or uploads.
- Scenes: camera-only, presentation/screen share via a separate `getDisplayMedia` click, split view, title card / podcast cover, and end card; explicitly label live preview vs recorded output.
- Record a **user-controlled** mixed program with browser `MediaRecorder` when supported. Local playback preview, stop, discard, and export a supported video/audio file. No promises that all browsers support the same codecs or simultaneous screen+mic capture.
- Local show-notes editor, chapter cue notes, title/description, and exportable metadata/episode manifest.
- No hidden recording, recording while desk is closed, background mic/camera use, call-in ingestion, streaming server, auto-publishing, rebroadcasting of RCTV's third-party sources, or automatic inclusion in the RCTV guide.

### v3.3 · Creator channel publishing contract
- Distinguish an **unpublished local project**, a **published owned episode**, a **declared official creator destination**, and an **approved inline playback method**.
- Add a source-controlled `creatorChannels.ts` manifest for *publisher-provided, independently reviewed* destinations only. Add creator virtual channel IDs by appending after the frozen CH 001–050 mapping. Never recycle existing channel numbers.
- Channel details: official creator home, program title, category, own-media declaration, playable destination policy, publish timestamp and territory/usage caveat. Source review receipts remain separate from approval authority.
- v2.7 Playback Trust Gate must recognize every new reviewed route through a deliberate policy manifest edit, regression tests, evidence and code review. Arbitrary RSS, local JSON, playlist, video file or pasted URL cannot become an auto-playable channel.
- Browse creator show pages, an episode list, local schedules, and published feed/RSS metadata with explicit provenance and permission.
- GitHub Pages can serve a **static show catalog** or appropriately hosted owned-media links. It cannot act as a public livestream relay or provide a backend merely by publishing a React UI.

### v3.4+ · Explicit live broadcasting / podcast distribution
- Only after selecting and integrating a user-owned/publisher-authorized transport (e.g. a connected streaming provider or independent backend), add a deliberately configured live broadcast pipeline.
- Permissions, transport key isolation, revocable credentials and rights audit must be designed before any `Go Live` button is activated. Secrets never belong in client-side React bundles, repositories or exported session receipts.
- Broadcasting requires a real ingest/origin/delivery service and bandwidth; a pure GitHub Pages SPA does not supply this.
- Offer a podcast RSS publication workflow backed by explicitly user-owned hosted audio and durable feed hosting. Review music/license rights and user consent before publishing.

## Integration opportunities

ReelCommons Unified TV Home: the home of creator channels. PhiBox or BackSpin96 could later supply original music and DJ audio, but require explicit licensing/permissions and a deliberate bridge before they can be recorded/published. Source Lab and its review ledger provide a starting provenance pattern, **not** automatic publishing authorization.

## Success criteria before advertising broadcast functionality

1. All microphone/camera and screen permissions are explicit and revocable.
2. Stop, error, tab-close, scene-change and output discard release media safely.
3. Local recording exports a playable file without a service dependency (on supported browsers).
4. Source-controlled creator channel registration cannot change any of the initial fifty channel IDs/numbers.
5. No third-party RCTV destination is captured, restreamed, or rebroadcast.
6. Audio/video codec and browser-API limitations are disclosed and tested.
7. Live broadcast and podcast publishing are clearly distinguished from local recording.
