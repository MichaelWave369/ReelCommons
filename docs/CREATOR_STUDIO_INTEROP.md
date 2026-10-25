# RCTV Creator Studio 3.2 · Existing Creative Stack Audit

Audited 2026-10-25 from the connected repositories. **This document describes actual observed repository boundaries; it does not claim any cross-repository API already works.**

## Existing source projects

| Repo | Observed implementation and status | Appropriate RCTV integration |
|---|---|---|
| [ParaCut](https://github.com/MichaelWave369/paracut) | R8.8 Studio title-style library, direct placement/animation, source-based timeline editing, browser Canvas/FFmpeg export, validated draft `paracut.studio.draft.v3`; its Interop Room exposes `window.ParaCut` on the **ParaCut origin** for an existing Creative Bridge v2 flow. | **Postproduction destination.** Download the RCTV recorded video/audio file, import to ParaCut as a native source, author titles/scenes, export through ParaCut. Do not forge a ParaCut project or assume other-origin browser storage is readable. |
| [PhiBox](https://github.com/MichaelWave369/PhiBox) | Actual browser Web Audio groovebox, input recording, four-loop mixer, effect buses, faders and optional headphone monitoring. Separate input permissions and browser storage. | **Soundbed/FX production.** Download original stems or loop recordings from PhiBox, then explicitly import them into a future Creator Studio mixing desk or ParaCut timeline. Never automatically attach PhiBox mic/monitor bus, samples, or local IndexedDB. |
| [PHIAudio](https://github.com/MichaelWave369/PHIAudio) | v0.1 foundation (typed plan/receipt boundaries, deterministic model, CLI/runtime intent). Docs explicitly say legacy implementation is **not** fully imported. | **Future audio adapter.** We can propose a typed render/analysis handshake once PHIAudio provides a tested browser-compatible or worker/desktop adapter. Do not claim live realtime audio DSP is available today. |
| [WaveForgeStudio](https://github.com/MichaelWave369/WaveForgeStudio) | Python-first creative planning/release stage, browser Interop Room independently checks ParaCut's verified v2 RenderPlan handoff and freshness. It produces reference-only release evidence. | **Postproduction and release evidence.** Proper future chain: Creator Media → explicit ParaCut import/edit → native verified RenderPlan → WaveForge receiver. No automatic publishing. |
| PhiVideo / PHIVid | No repository named `PhiVideo` found among installed GitHub search matches; PHIAudio lineage mentions a historical **PHIVid** adapter. | **Unknown.** Resolve repo identity before designing an integration contract or advertising active rendering capability. |

## What v3.2 actually ships

- Explicit microphone and camera capture permission via `navigator.mediaDevices.getUserMedia`. Browser support and secure context required.
- Browser-local `MediaRecorder` audio-only (audio/webm, audio/mp4, audio/ogg depending support) or camera + mic (video/webm or video/mp4 if browser supports it). Start/stop require user gestures.
- An intentionally muted local camera preview and **no live mic speaker monitoring** to reduce feedback risk. All capture tracks are released when Disconnect/Close/unmount occurs, including a late grant after closing the workspace.
- Local media preview, a separate downloadable recording, and an explicit JSON episode-notes manifest (schema `RCTV_CREATOR_LOCAL_EPISODE_V1`). The JSON contains metadata only; it does **not** embed recorded bytes.
- Bound recording budget: 250 MiB browser-collected chunks, with larger takes discarded. A browser can refuse permission, codec, device, output memory or Blob downloads regardless.
- The exported manifest is a **reference-only suggestion to ParaCut**, with `status: REFERENCE_ONLY_NOT_NATIVE_PARACUT_DRAFT`, `published: false`, `rightsVerified: false`, `networkAuthority: false`, `autoImportAuthority: false`. It is not a Parallax Creative Bridge, ParaCut RenderPlan, PHIAudio render receipt, WaveForgeStudio release, licensed media clearance or authorization to go live.

## Interop bridge milestones

### v3.3 · Creator sidecar manifest reader for ParaCut
- First design a **ParaCut-owned** reader/adapter for `RCTV_CREATOR_LOCAL_EPISODE_V1` with its *separately supplied media file*. The receiver independently validates file type, size, and locally computed hash, maps title + notes into safely staged ParaCut timeline metadata, and asks for human approval before import.
- Only after ParaCut publishes tests and an accepted receiver should RCTV advertise one-click creator-to-editor handoff. Browser-local storage across GitHub Pages sites is origin-scoped, so silent sharing is not available.
- Use the existing ParaCut `parallax.bridge.v2` profile **only** through its validated native RenderPlan path. RCTV must never mint a fake `parallax.bridge.v2` packet to convince WaveForge to accept unverified footage.

### v3.4 · Embedded creative modules
- Explicitly extract **license-compatible, tested Web Audio modules** from PhiBox behind RCTV's own recording bus instead of importing its entire SPA. Dedicated mic/bed/FX faders, speech ducking, sample preview, isolated tracks and a master stereo recorder.
- Contract with PHIAudio for waveform analysis, loudness checks and deterministic render receipts **after** the engine gains the required browser implementation and tests. No automatic network requests or mic permissions from an engine.
- Reuse ParaCut's branded title recipes and its validation/easing logic only through a versioned shared package or standalone adapter with independent integration tests.

### v3.5+ · First owned RCTV creator channel
- Add creator-owned **published** media via a reviewed, source-controlled manifest and a durable host, keeping the first 50 frozen channel IDs unchanged. Channel entries append at CH 051+ only after rights, consent and supported playback policies are reviewed.
- Live broadcasting requires a separate authenticated ingest/delivery service. The GitHub Pages SPA cannot serve as a live streaming backend. Podcast RSS requires hosted audio, an accessible HTTPS feed, and explicit publication.

## Explicit media separation

The Creator Studio never receives `OPEN_STREAMS` or `playableUrl()` as capture sources, nor does it load M3U, IPTV-org feeds, stream proxies or player DOM into its recording graph. Media capture is `getUserMedia` of the user's *own* mic/camera only. The RCTV v2.7 playback trust policy and reviewed station roster remain unchanged.

## Manual validation

Verify actual browser permission prompts, codec availability, mic-only recording/playback/download, camera-and-mic recording and preview, closed/stopped track release, denial/error messaging, 250 MiB discard behavior, correct two-file export, absence of network uploads, and that all existing RCTV channels retain the original no-autoplay behavior. The GitHub CI suite cannot establish camera/microphone hardware success.
