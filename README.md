# ReelCommons

**Good stories. Open doors.**

ReelCommons is an original, independent, open-source directory for **legitimate free streaming**. It helps you discover official streaming destinations, build a personal watchlist, and choose what to watch next.

> **Scope honesty:** v0.1 is a curated **service directory**, not a live title-availability search engine. Provider links go to official homepages. Verify a specific title, ad load, cost, geographic restrictions, and accessibility features on the provider's site.

## v3.2: Creator Studio · Original podcast and camera recording

The new **RCTV Broadcasting & Podcast Studio** is a real, consent-gated **browser-local recording booth** inside Open Streams, accessible from Unified TV Home's **Creator Studio** button. It is **not** a live broadcast server, a licensed music library, an automatic content distribution platform, or a hidden cross-app integration.

- **Original sources only.** Choose mic-only podcast or video podcast (camera + mic), then explicitly **Connect mic/camera** using the browser permission dialog, followed by **Record locally** and **Stop recording**. Nothing starts until a direct click. A muted camera preview is shown when camera capture is enabled; the mic is never routed to speakers by default.
- **Capture and export.** Browser `MediaRecorder` encodes a supported audio/webm, audio/mp4, audio/ogg, video/webm or video/mp4 format depending on user browser and hardware. Preview locally and click to download the file. A separate **Export episode metadata** action creates a small `RCTV_CREATOR_LOCAL_EPISODE_V1` JSON sidecar with title, show, notes, recording mode and explicit provenance/permission denials. The manifest **never contains the media file's bytes**. The recording must be separately downloaded before the page is closed.
- **Bounded and private.** Takes are capped at 250 MiB of collected recording chunks, otherwise discarded. Closing the studio, disconnecting, or unmounting the page releases all microphone and camera tracks; even permissions arriving after cancellation are immediately released. Nothing is automatically uploaded, persisted to localStorage, synced with another repo or published. Browser failures (insecure origin, unsupported codec, lack of permission, device errors) are surfaced.
- **Reuse the creative ecosystem honestly.** RCTV exposes links to [ParaCut](https://github.com/MichaelWave369/paracut), [PhiBox](https://github.com/MichaelWave369/PhiBox), [PHIAudio](https://github.com/MichaelWave369/PHIAudio) and [WaveForgeStudio](https://github.com/MichaelWave369/WaveForgeStudio). ParaCut provides postproduction/titles/render plans; PhiBox supplies original grooves/FX and real Web Audio recording patterns; PHIAudio is an emerging typed runtime; WaveForge checks release/intake references. **No native bridge is claimed yet.** The exported JSON is explicitly `REFERENCE_ONLY_NOT_NATIVE_PARACUT_DRAFT`. Never interpret it as a valid ParaCut draft/RenderPlan, PHIAudio receipt or WaveForgeStudio release.
- **Future own-channel pipeline.** Add a separately verified ParaCut media+manifest importer, then source-controlled *owned* program destinations in CH 051+ without changing any of the original 50 curated slots. Real live broadcasts require an actual user-owned transport/host and explicit credentials kept off GitHub Pages.

Read [the source-project interoperability audit](docs/CREATOR_STUDIO_INTEROP.md) for concrete source repo capabilities, verified boundary decisions and next phases. The earlier [Broadcasting & Podcast Studio roadmap](docs/RCTV_BROADCAST_STUDIO_ROADMAP.md) remains a conceptual overview.

### Tests and manual QA

`src/creatorStudio.test.tsx` tests a closed, media-silent initial studio, supported/unsupported MIME fallback, safe bounded filenames, legitimate audio/video manifest fields, and rejection of malicious or invalid metadata and forged publishing authority. Existing source-policy gate, Python companion, React unit tests, TypeScript and Vite build remain in CI.

After merge, **manual browser hardware testing** is still required to validate microphone/camera permission prompts, actual sound/video, recorder codecs, preview and download behavior, close/disconnect resource cleanup and the 250 MiB capture bound. CI cannot access the user's physical microphone or camera. This release does **not** ship multi-track FX mixing, podcast RSS, public live streaming or new RCTV playback channels.

## v3.1: TV Experience Polish · Mini remote, focused handoffs, optional gamepad

RCTV v3.1 makes the v3.0 Unified TV Home feel like one navigation system across screens, without changing playback rights or the two existing opt-in media routes.

- **Persistent mini remote** on the Open Streams page: a compact fixed-position channel indicator with optional expandable controls for CH−/CH+, numeric 001–050 tuning, official publisher link, and three screen-navigation buttons. It hides while the Couch Mode dialog is open to avoid a second active remote behind the modal, and its responsive placement respects mobile safe areas. Nothing in the dock loads an audio/video player automatically.
- **Better cross-screen focus**: entering Couch Mode remembers the currently focused launcher and returns focus on exit when it still exists, otherwise returning to the original Couch Mode launch button. Moving to Channel Desk or Reviewed Player Desk scrolls to and focuses the corresponding heading with `tabIndex=-1`. Handoffs unload any previously loaded in-app media and reset signal observations.
- **Optional browser Gamepad API control in Couch Mode**: an explicit user click enables polling *only while the dialog is open*. D-pad and left stick surf directory channels, A/X toggles the guide, and B closes Couch Mode. Inputs are rate-limited; disabling or closing the dialog cancels polling. These controls never invoke a Load action. This is progressive enhancement and requires a browser/controller combination exposing the standard Gamepad API. Quest controller browser mappings and other gamepads still require device testing.
- **Visibility and accessible focus**: minimum-size touch targets, keyboard focus rings, screen reader labels, and clear interface states. Native player controls and official publisher links remain independent of controller navigation.
- **No authority changes**: the frozen 50 numbered RCTV channels, seven reviewed station roster, NASA and KEXP exact playable URLs, v2.7 trust gate, and browser-session-only recovery receipts are unchanged. No IPTV-org, M3U, browser storage, or self-reported Source Lab packet gains access to playback.
- **v3.2+ studio blueprint**: `docs/RCTV_BROADCAST_STUDIO_ROADMAP.md` scopes a consent-gated, local-first Broadcasting & Podcast Studio. A future release can append source-reviewed user-owned programs after CH 050 and later integrate an explicit creator-controlled publishing/streaming backend. Neither recording nor public broadcasting is implemented by this PR.

### v3.1 quality checks

`src/tvPolish.test.tsx` tests the fixed-channel numeric mini tuner, valid controller mappings and deadzone, no-autoplay initial Couch rendering, and compact dock markup. Existing Vitest, Python companion, source-policy gate and TypeScript/Vite build run in CI.

After merge, manual browser QA should cover desktop/mobile sizes, safe-area placement, keyboard focus return from each Couch launcher, navigation to the Channel Desk and Reviewed Player Desk, CH switching while another desk is active, gamepad mapping on real devices and stop/unload behavior. CI cannot physically verify gamepad connectivity or actual video/audio playback.

## v3.0: Unified TV Home · One channel, three screens

RCTV v3.0 introduces a shared, visible **Unified TV Home** at the top of Open Streams Commons. It connects the 50-channel guide, the main **Channel Desk**, lean-back **Couch Mode**, and seven-source **Reviewed Player Desk** around one currently selected, source-controlled station. No automatically loaded video, new stream sources, media proxy, account or server is needed.

### One source selection
- **Unified TV Home** shows the selected source's virtual channel number, name, category, source access method and no-autoplay status.
- Users can **CH− / CH+** through the existing frozen 50-slot lineup, enter a **virtual channel number**, click curated featured stations, revisit their **previously selected channels this visit**, or expand a **searchable full guide** with an optional favorites-only filter.
- All channel choices reuse the existing `selectSource` flow. Choosing a station updates the main player, the Channel Surf Remote, the Couch Mode launch selection and the reviewed player's station (where supported), including the existing last-channel browser preference. Previous selections in the new Home are **in React memory only**, never saved.
- A unified **View Channel Desk** action scrolls to the regular player. **Enter Couch Mode** launches the existing accessible large-screen interface with the same selected channel. **Open Reviewed Player Desk** explicitly expands the reviewed desk for any of its seven checked-in stations. For website-only destinations outside that seven-source roster, this button is disabled with an explanation; the official broadcaster site remains available.
- The Reviewed Player Desk also reports station selection *back* to the main app, keeping the shared choice consistent. That handoff stops the main player, resets stale signal observations, and preserves opt-in playback. Unsupported destinations cannot become reviewed stations by selecting them elsewhere in RCTV.
- Source switching, starting Couch Mode or switching to the reviewed desk always unmounts previously loaded in-app media. The browser must still explicitly receive a separate **Load** click inside the chosen player before an iframe or audio element appears.

### Consistent trust boundaries
The Unified Home is a **catalog navigation tool** over the same fixed `CHANNEL_LINEUP` and `reviewedPlaybackBridge` roster. It does not import IPTV-org playlist streams, inspect third-party media URLs, load content from imported Source Lab packets, bypass broadcaster restrictions, record, proxy, rebroadcast, autoplay or create a new source. Provider-controlled links remain the fallback for every station.

The RCTV v2.7 Playback Trust Gate still provides a dedicated CI release check, and the v2.8/v2.9 Signal & Recovery panels still label browser events as observations rather than proof a broadcast is live or a license exists.

### Tests and manual QA
`src/tvHub.test.tsx` verifies all 50 frozen numbers, safe numeric lookup, favorite/search behavior, bounded **session-only** navigation history, exact seven-source handoff eligibility, no-player initial markup and a safe Reviewed Desk interface with shared selection props. Existing React, Python, policy-gate, TypeScript and Vite tests remain.

After merging and deploying: choose a station in the Unified TV Home, confirm the regular player and Channel Surf Remote reflect it, launch Couch Mode, tune a new number, exit and verify selection persists. Then choose KEXP or NASA, open the reviewed desk, change stations there and verify the main selected channel follows, without autoplay. Use the official-site-only station fallback and test keyboard focus and small screens.

## v2.9: Shared Signal & Recovery · Channel Desk + Couch Mode

RCTV v2.9 takes v2.8's honest browser-session diagnostics beyond the small Reviewed Player Desk and brings them directly into the **main Channel Desk** and **50-channel Couch Mode**. This is a usability and recovery upgrade, not a source expansion or media-rights review.

### Three surfaces, one observation model

- **Channel Desk** in Open Streams now presents a Signal & Recovery panel under the existing source player. If you choose NASA ISS or KEXP and explicitly load the already-reviewed media, browser events update the panel. An iframe `load` is **not** proof that NASA video is playing; native audio `canplay`, `playing`, `waiting`, `stalled`, `pause` and `error` events are described accurately, without guaranteeing audible output.
- **Couch Mode**, designed for television screens, uses the same panel and event model. Tuning by channel arrows, numeric remote or the guide unmounts the prior media and clears the observation. Old asynchronous callbacks are rejected by monotonically advancing attempt generations, even when you tune through an official-site-only channel and return.
- **Reviewed Player Desk** retains its v2.8 Signal & Recovery Desk. All three player desks still use the same original `playableUrl()` explicit source allowlist. None of them accepts imported station or playlist URLs.
- For all other curated destinations, the shared panel explains that there is no approved RCTV inline player and provides a one-click **Recover on official broadcaster** link. It does not invent a media stream.
- After manually loading NASA or KEXP, the shared panel offers **I can see video / I can hear audio** and **Not working here** self-report buttons, plus a local JSON session receipt. Reports never imply verified availability, rights or uptime. Its source-owned official link remains available independently of any media status.

### Privacy, receipts, and constraints

The shared panel displays **no media endpoints or viewer history** and writes no session diagnostic state to local storage. Click-to-export uses the existing `RCTV_SIGNAL_SESSION_RECEIPT_V1` with `BROWSER_OBSERVATION_AND_USER_REPORT_NOT_VERIFIED` provenance and includes only session counts/observations, the checked-in source ID/mode, current code-policy consistency and the export timestamp. Files are user-controlled and editable. No automatic health probes, retries, cross-origin iframe inspection, cookies, tracking, recording, proxying or retransmission are introduced.

### Tests and manual QA

`src/sharedSignalDesk.test.tsx` exercises the saved-channel initializer, tuning through website-only sources, invalidation of old callbacks, main/Couch presentation, official recovery, opt-in self-reports and receipts without stream endpoints. The existing v2.8 Signal & Recovery unit tests, v2.7 Playback Trust Gate CI policy, Python companion suite and TypeScript/Vite build remain in the release checks.

After merge and deployment, test the main Channel Desk and Couch Mode on an actual browser: load KEXP manually, pause/play and force a network failure, tune away and back, inspect NASA's iframe load wording, export a receipt, use official recovery, and confirm the remote/keyboard interactions stay accessible. Browser events are not a network measurement of broadcast uptime.

## v2.8: Signal & Recovery Desk · Observe, diagnose, recover

**RCTV v2.8** adds a browser-session-only **Signal & Recovery Desk** beneath the live stage of the opt-in **Reviewed Player Desk**. It reuses exactly the existing NASA ISS YouTube iframe and KEXP publisher-listed AAC audio player. It adds no new broadcasts, playback permissions, IPTV-org streams, redirects, or background requests.

### What the user sees

- **Standby** until they explicitly open the reviewed desk and press **Load** for a source. No background pings, probes, auto playback or periodic timers.
- On NASA ISS, the player reports **iframe document loaded**, never "video playing" just because an iframe fired its `load` event. YouTube playback can still be unavailable, age/region/embedding restricted, or interrupted.
- On KEXP, the native audio element reports meaningful local browser states: controls loaded, `canplay`, `playing`, `pause`, `waiting`, `stalled`, and `error`. A browser "playing" event does **not** prove the speakers are audible.
- Optional **I can see the video / I can hear the audio** and **Not working here** buttons are transparently **self-reported**. They are never presented as verified or broadcast-owner approvals.
- A direct **Recover on official broadcaster website** link works for all seven reviewed stations, including the five official-site-only destinations. **Stop / unload** removes the existing media element. A subsequent Load is explicitly user-triggered.
- Switching source, closing the desk, opening Couch Mode, or taking over with the original RCTV player unloads media and resets signal status. Old callbacks from a previous iframe/audio attempt cannot override newer state. A separate generation counter prevents stale events from regaining authority if the same station is reselected.
- A deliberate **Export this session's diagnostic receipt** saves a JSON summary of the selected reviewed station ID, player mode, session-only load count, current observation status, optional manual report, timestamp of export, and source-controlled trust-policy status. It includes no media endpoint, user identity, IP, watch duration, cookies, listening history or secret. **Nothing is saved to `localStorage` or sent anywhere by the diagnostic desk.**

### Honest limitations

The receipt carries `RCTV_SIGNAL_SESSION_RECEIPT_V1` and provenance `BROWSER_OBSERVATION_AND_USER_REPORT_NOT_VERIFIED`. Neither the iframe document-load event nor any self-report demonstrates rights, source uptime, stream authenticity, copyright ownership or continuous playback. An exported receipt is a user-controlled file and can be edited. The RCTV v2.7 Playback Trust Gate continues to validate source-code policy separately and cannot infer availability or permission.

### QA

New `src/signalRecovery.test.tsx` covers explicit loading only, NASA iframe/load limits, KEXP audio states, stalled/error fallback messages, stale-event isolation after switching back to the same source, denial of unknown/unreviewed sources, untrusted self-reports, standby rendering and privacy-safe receipts. Existing `npm test`, policy gate tests and TypeScript/Vite CI remain unchanged. Manual QA is required for actual NASA/KEXP playback, browser-specific events, network failures, link fallback, phone layouts and accessibility.

## v2.7: Playback Trust Gate · Source-controlled release guard

**RCTV v2.7** introduces a transparent **Playback Trust Gate** inside the Reviewed Playback Bridge. This is a deterministic **code configuration audit**, **not** proof of publisher consent, a licensing service, an uptime check or a legal opinion. No broadcaster websites or media endpoints are contacted when viewing this report.

### What the gate checks

- Builds an inventory of the checked-in RCTV catalog and compares *every* in-app media route to a separate, human-authored policy manifest (`src/playbackTrustGate.ts`). There are currently **two** configured inline methods: NASA ISS through a supported YouTube embed and KEXP's publisher-listed AAC listening link.
- Confirms that the seven-source Reviewed Playback Bridge roster, exact `playableUrl()` output, source type, public official host and evidence/boundary notes match the declared policy. The other curated sources must remain website-only unless a new code-reviewed exception is added.
- Flags unreviewed inline modes, undeclared media routes, changed media endpoints, missing/duplicate policy entries, roster drift, unsupported official homepages and missing source notes as **engineering-review-required**.
- Offers an opt-in, browser-local policy dashboard, with counts, per-source rationale, mismatch detail and a small `RCTV_PLAYBACK_TRUST_GATE_V1` JSON export. It does not include direct media URLs, browser storage, viewer identity, streams, EPG information, playlist URLs or credentials.
- The policy is checked into source code. Browser-supplied candidate packets, Source Lab checklists and imported Source Review Ledger entries **never participate** in the actual routing decision.

### Explicit CI release gate

The existing GitHub CI suite still runs all Vitest tests and the Python companion. A newly named **Playback trust gate policy** step re-runs the focused trust audit regression suite before `npm run build` so failures are visible independently. Tests intentionally mutate catalog IDs, NASA/KEXP routes and methods, duplicates, official hosts, evidence strings and policy/roster membership to prove that unreviewed changes are caught.

Changing the approved allowlist or policy requires a deliberate code edit reviewed in a normal GitHub PR. Passing the policy checks means **configuration agrees with the review manifest**, not that a media source is currently live, free of restrictions, embeddable on every browser or authorized for rebroadcast. CI cannot verify broadcaster rights, and real-world publisher terms can change between reviews.

### Manual QA

After merge and deployment, open **Open Streams → Reviewed Player Desk → Open Playback Trust Gate**. Check source counts, inspect both reviewed media routes and five official-site-only declarations, export the report, verify no media or guide requests from the dashboard, and confirm keyboard navigation. Test the existing NASA/KEXP Load/Stop controls separately; they remain manual and governed by external providers.

## v2.6: Source Review Ledger · Evidence snapshots and manual GitHub handoff

RCTV v2.6 extends the browser-local **Source Certification Lab** with a **Source Review Ledger**. This preserves evidence revisions and review recommendations as an append-only history *inside the app*, not an authenticated or tamper-proof ledger. Completing review steps does not change `playableUrl()`, the hardcoded broadcaster roster, IPTV-org index, M3U quarantine, or media permissions.

### Evidence snapshots and recorded dispositions

- Open **Open Streams → Source Certification Lab**, create or select an unverified candidate, then use the new Ledger below its existing checklist.
- **Capture evidence revision snapshot** freezes that candidate's current name, safe publisher HTTPS homepage, proposed route, notes, seven self-attested flags and date. Later edits create future snapshots; existing ledger entries cannot be edited through this UI.
- **Record review recommendation** pairs the same frozen evidence snapshot with a reason (15–600 characters) and one of **Request more evidence**, **Decline candidate**, or **Recommend independent code review (NOT approval)**.
- Show the latest recorded recommendation and up to 12 recent revisions per candidate. The local export includes all events (maximum 100), even for candidate IDs that were later removed from the local intake list.
- All decisions are explicitly advisory. There is intentionally **no** `approved` / `certified` / `verified` outcome, reviewer login, authorized media endpoint, playback flag or permission grant. Imported records are marked `USER_RECORDED_UNVERIFIED`.

### Receipts, conflict checks and GitHub issue template

- The Ledger is stored only in browser `localStorage` under `rctv-source-review-ledger-v1`. Export/import uses exact-field `RCTV_SOURCE_REVIEW_LEDGER_V1` JSON, strict v2.5 candidate validation, canonical UTC timestamps, event-ID deduplication and a 128 KB / 100-event cap.
- Imports reject extra fields, fake approval states, invalid/forged trust provenance, media URLs disguised as official homepages, duplicate events and same-ID conflicting histories. Import merges valid new events without overwriting existing ones.
- **Copy review handoff** uses the browser clipboard only after the user clicks and includes relevant local notes, snapshot count and recent events. **Open GitHub issue templates** is a separate external link to `MichaelWave369/ReelCommons`'s issue chooser. The new `.github/ISSUE_TEMPLATE/rctv-source-review.yml` form asks for public publisher evidence and reminds contributors not to share secrets.
- The app never sends candidate information or attachments to GitHub. Pasting into a GitHub issue is **manual** and may publish the material publicly. A GitHub issue is an intake item, not permission to play. A maintainer still needs to independently verify broadcaster terms, regional availability, supported player behavior and scope, then create a distinct code-reviewed PR with tests.

### Epistemic and technical limitation

Browser `localStorage` and downloaded JSON can be edited or deleted; this is a **local chronology of self-recorded claims**, not cryptographically signed proof, verified identity, or third-party authorization. Re-review original publisher evidence before making a source-code decision.

`src/sourceReviewLedger.test.tsx` exercises snapshots, proposed decisions, imported-forgery rejection, bounded merges, immutable-ID collision refusal, orphan candidate history and server-rendered no-playback behavior. Existing tests and CI remain unchanged. After merging, manually verify two or more candidate revisions, timeline, JSON roundtrip, conflict imports, blocked storage, mobile layout, clipboard permissions and issue handoff.

## v2.5: TV Source Certification Lab · Independent-review intake

RCTV v2.5 adds **Source Certification Lab** below the Reviewed Playback Bridge in Open Streams. The name describes a workflow to organize evidence for broadcaster playback, **not** an automatic certification service. Even a seven-of-seven checklist entry is merely *ready for independent human review*. Only an audited code change can add playback support.

### Source-controlled roster and candidate intake

- The workbench starts closed. Open it on demand to see the seven current source-controlled review outcomes from v2.4, clearly distinguishing NASA ISS video, KEXP published audio and five official-site-only destinations.
- Propose a broadcaster by its **official public HTTPS homepage**, publisher name, requested method (site link, platform-supported YouTube iframe, or publisher-listed audio) and research notes.
- The intake validator refuses localhost, private-IP and credential-bearing hosts, arbitrary ports, plain HTTP, query strings/fragments (including tokenized links), and M3U/M3U8, MP3, MP4, AAC, OGG, JSON, XML or TS media/data endpoints. **No URL supplied here is fetched, linked, probed or promoted to media playback.** It is plain-text metadata only.
- Maintain a self-attested seven-point checklist covering official publisher identity, terms, playback-method permission evidence, geography, privacy, official-site fallback and manual browser testing.
- The *ready-for-independent-review* indicator requires all seven self-attested boxes and substantive written evidence. This is intentionally **not** an approval, verification, license, trust escalation, or authorization to embed/rebroadcast.

### Local research packets

- Up to 40 drafts remain in browser `localStorage`; storage denial is handled without breaking the interface. No account, telemetry, remote processing or automatic fetch is introduced by the Lab.
- Export/import strict, bounded JSON (64 KB) under `RCTV_SOURCE_INTAKE_PACKET_V1` with immutable provenance `USER_SUPPLIED_UNVERIFIED`. Intake records contain a name, safe homepage, proposed method, notes, date, and enumerated checklist flags, **never an approved player URL**.
- Import rejects unknown or duplicate record IDs, extra fields (including `approved` / `playableUrl`), forged provenance, invalid dates, restricted URLs and unrecognized checkmarks. Import merges new IDs without rewriting existing drafts.
- Export is a portable **research submission for independent audit**, not an executable playlist or authorized playback manifest. A maintainer must separately examine current broadcaster terms and corroborating permission evidence, run manual browser tests, write a reviewed static source-code change, and pass CI before expanding the v2.4 `playableUrl()` allowlist.

### Regression coverage

`src/sourceCertification.test.tsx` tests safe homepage validation, bounded payloads, date/method validation, checkbox gating, provenance, JSON export/import, denial of forged approvals and media URLs, and standby-only initial rendering with no media tags. Existing RCTV streaming, M3U quarantine, World Broadcast Atlas, Guide Desk, Passport and Couch Mode tests continue unchanged.

After merge, smoke test browser-local persistence, the seven-point checklist, create/edit/delete flows, export/import roundtrips, invalid URLs, blocked storage, mobile layout and keyboard navigation. This feature **does not add a new live channel**, and a checklist marked complete is **not evidence of broadcaster consent**.

## v2.4: Reviewed Playback Bridge · The World Screen

**RCTV v2.4** adds a standalone **Reviewed Player Desk** in **Open Streams**, alongside (not inside) the IPTV-org World Broadcast Atlas. The World TV directory, EPG sources and M3U inspector remain metadata-only; none can promote unreviewed links into playback.

### Playback method roster

The desk uses a closed, source-controlled list of **seven previously reviewed RCTV destinations**:

| Source | How the desk handles it | Evidence / constraint |
| --- | --- | --- |
| NASA ISS Live Views | Opt-in YouTube privacy-enhanced iframe; no autoplay query | Official NASA YouTube stream and YouTube's documented embed interface; channel owner/platform may disable embedding |
| KEXP Radio | Opt-in 160K AAC audio element with `preload="none"`, manual Play | KEXP's [published third-party listening URLs](https://www.kexp.org/mobile/kexp-livestreams/); regional conditions may differ |
| CBS News 24/7, ABC News Live, PBS Local Livestream, U.S. House FloorCast, NASA Live | **Official broadcaster website only** | No new in-app playback permission is claimed |

Sources are drawn from the existing hand-curated `ALL_OPEN_STREAMS` dataset, and in-app media URLs must still pass the exact-source `playableUrl()` allowlist. The IPTV-org APIs (`streams.json`, M3U, EPG index) never feed this roster. Any future candidate must be independently documented, reviewed, explicitly approved and accompanied by failure/terms notes.

### User experience

- **Open Reviewed Player Desk** explicitly expands the optional stage. Merely opening the page or opening the desk mounts **no** external media.
- Seven selectable station buttons and **CH− / CH+** controls. The stage has local left/right keyboard controls only when focused. Selecting a new channel always unloads the previous media and returns to standby.
- **Load official YouTube embed** and **Load KEXP audio controls** appear **only** for the two reviewed routes. The user must click them. KEXP's audio also requires the user to press the browser player's Play button; playback can fail or vary by region/browser. The YouTube embed obeys YouTube controls and may be blocked.
- **Stop / unload** immediately removes the iframe or audio element, and closing the desk removes any loaded media. Selecting a station in the original RCTV channel desk, starting its reviewed media, or opening Couch Mode resets the bridge; loading the bridge first unloads original desk media.
- Other listed sources show a standby panel with an **Open official broadcaster** link only, without embedding, proxying, rehosting or bypassing access restrictions.
- **Export source-review receipt** downloads a small `RCTV_REVIEWED_BRIDGE_RECEIPT_V1` JSON with reviewed source ID, mode, publisher's official page, evidence and caveats. It contains **no** direct audio/video endpoint, viewer identity, playback success or watch history.

### Rights and privacy

This is a review of the **supported playback mechanism**, not a blanket license to redistribute content. All publisher logos/ads/video remain under owner and platform control. No recording, DRM circumvention, stream proxy, paywall bypass, user-added URL, live status ping, playback telemetry or additional third-party metadata calls are introduced. YouTube's supported embed may use cookies/network connections after explicit load; its privacy-enhanced URL is not equivalent to zero data collection. Only the official website is offered when in-app playback isn't reviewed.

Sources: [NASA official ISS feed](https://www.youtube.com/watch?v=jKHvbJe9c_Y), [YouTube embed support](https://support.google.com/youtube/answer/171780?hl=en), [KEXP third-party listening links](https://www.kexp.org/mobile/kexp-livestreams/).

### QA

`src/reviewedPlaybackBridge.test.tsx` tests the exact reviewed ID roster, both exact media routes, all official-site-only denials, untrusted URL denial, load/switch/stop state transitions, metadata receipt contents and zero iframe/audio in initial server markup. Existing Python companion tests, Vitest, TypeScript and production bundle checks still run.

After merging, manually test NASA embed playback (which YouTube may disable), KEXP browser audio controls, Stop/Close unloading, switching to the old RCTV channel desk and Couch Mode, keyboard focus, and small-screen layout. Runtime playback, publisher policy changes, ad behavior and device compatibility cannot be verified by CI.

## v2.3: World TV Guide Desk · EPG source research

RCTV now has a dedicated **World TV Guide Desk** in the existing opt-in World Broadcast Atlas. This is a metadata research station, not a commercial electronic-program-guide player. **Nothing is fetched before the visitor explicitly loads the World TV Directory**, and no EPG data is fetched unless they separately choose **Load EPG source index**.

### Features

- Load the fixed IPTV-org `guides.json` *source index only*, with source-response and per-channel caps. Source data comes from [IPTV-org EPG](https://github.com/iptv-org/epg).
- Browse and search channel-linked EPG metadata: source site name/domain (plain text only), optional feed ID, listed guide language, listed format and source-entry count. At most 12 deduplicated guide-site rows per station are retained.
- Enable **Show only stations with indexed guide sources** to filter the World TV directory and existing Channel Hopper/Passport remote together. Disable it to restore ordinary catalog browsing.
- Select **View guide sources** on any matching channel card to open its metadata detail panel. Visitors may still open the broadcaster's preexisting official HTTPS website, not a third-party guide crawler.
- Export a metadata-only `RCTV_GUIDE_SOURCE_RECEIPT_V1` JSON research receipt with explicit `IPTV_ORG_INDEX_METADATA_UNVERIFIED` provenance and a warning that EPG source presence is not proof of program information, live status, availability or permissions.

### Nonnegotiable boundaries

The guide index contains URLs to third-party XMLTV or other collectors, but RCTV **never visits, stores, presents or exports these endpoints**, their query strings, host headers, secrets, site IDs, or their full guide contents. It does not fetch actual schedules, program titles, videos, IPTV playlists, streams or logos. Metadata site names are **not** assumed to be broadcaster-owned or authorized; they render only as plain text. Guide URLs are not made clickable. Nothing from a guide source can enter `playableUrl()`, the original 50-number RCTV channel roster, Couch Mode, or the local M3U quarantine.

The Guide Desk's state is only in-memory until page exit. It uses the same already opt-in `guides.json` request and requires no account, server, stream proxy, new runtime dependencies or analytics. The v2.2 World TV Passport remains a **manual, self-reported exploration record**, not a viewing/now-playing history.

### Validation

New `worldBroadcastGuides.test.tsx` verifies known-channel membership, deduplication, input size and source-entry caps, missing/invalid values, that provider URLs/tokens/host headers never survive normalization or receipt exports, and that server-rendered markup contains no XMLTV/stream links or autoplay elements. Existing unit/CI checks and TypeScript build still apply.

Post-merge QA: load directory, then load guide index; inspect multiple station cards; use guide-only filtering with World Hop; export a JSON receipt; verify its source-only fields; use the browser network panel to confirm no XMLTV, HLS, audio or video requests from this integration; verify responsive keyboard/screen-reader flow.

Actual program schedules and inline media playback remain a **separate future workstream** requiring source authorization and a rights review.

## v2.2: World TV Channel Hopper · Private Explorer Passport

The metadata-only **World Broadcast Atlas** adds a guided **World TV Channel Hopper** and a portable, browser-local **Explorer Passport**. Open **Open Streams → World TV Directory → Load World TV Directory**, then use the new remote beneath the search filters. The v2.1 catalog loading is still opt-in.

### Channel-hop explorer (directory only)

- **CH− / CH+** cycle through the *currently filtered* broadcaster index with wraparound. **World Hop** picks another listed destination at random without fetching or starting media.
- A large TV-style standby screen shows the indexed broadcaster name, country and filtered position. Use **Open official broadcaster** to visit the listed public HTTPS publisher website in a new tab.
- The remote's focused panel alone supports left/right arrow navigation. Searching, forms, the original numbered RCTV 50-channel remote, Couch Mode and player allowlists are unchanged.
- **No new playlist/stream/EPG feed is fetched by this interface.** This is a discovery remote, not a channel tuner or video player.

### Manually stamped, portable private passport

- Choose **Mark as explored** to declare you explored that *catalog entry*. This **does not verify watching, playback, live availability, or physical travel**. Undo any stamp, or remove it from the local trail.
- A counter reports distinct station IDs stamped and countries represented by those currently known catalog entries. The last eight stamps appear in the trail. Dates are UTC calendar days.
- Up to 250 stamps are kept only in your browser's `localStorage` as channel IDs and date strings under `rctv-world-tv-passport-v1`. No accounts, tracking, analytics, source URLs, media, watch duration, or IP-based location are stored.
- Export a JSON file with schema `RCTV_WORLD_TV_PASSPORT_V1` and explicit `USER_MARKED_DIRECTORY_EXPLORATION` provenance. Import a previously exported JSON file (64 KB limit), validate known current channel IDs, exact fields and calendar dates, and merge without replacing existing stamps. The import rejects untrusted URLs, unknown IDs, duplicate rows and malformed metadata.
- If local storage is blocked, stamps work for the current visit only. Passport imports do not promote any URL or metadata to the playable RCTV source allowlist.

### Checks and next steps

`src/worldTvPassport.test.ts` covers UTC date validity, export minimalism, strict portable import validation, bounded local state, stamp deduplication, country counting, CH+/CH− wraparound and excluding the selected station during World Hop. Existing CI also runs TypeScript, the production build and companion checks.

After merging, manually verify large/small screens, remote focus and arrow keys, filters affecting hop choices, publisher external links, offline/blocked storage, export/import and the manual stamp disclaimer. Program schedules and authorized inline playback remain separate future work.

## v2.1: World Broadcast Atlas · Global broadcaster discovery

**World Broadcast Atlas** is an opt-in, metadata-only directory under **Open Streams**, powered by the community-maintained [IPTV-org API](https://github.com/iptv-org/api) and [channel database](https://github.com/iptv-org/database). It extends global discovery without importing unreviewed streams into the 50-channel RCTV remote, Couch Mode, or trusted player allowlist.

### Explore worldwide official broadcaster websites

- Click **Load World TV Directory** to request `channels.json`, `countries.json`, `categories.json`, `feeds.json` and `languages.json` from `https://iptv-org.github.io/api/`. **No third-party request occurs on initial page load.**
- Browse active, non-adult channel records with valid public HTTPS broadcaster website URLs. Filter by country, category, language or text search, and expand the paginated results in groups of 24.
- Each card links **only to the broadcaster's indexed official website**. Links open in a separate tab; metadata may be out of date, and the broadcaster determines costs, geographic access, availability and viewing terms.
- Save up to 80 channel IDs in browser-local favorites. Storage is schema-checked against loaded catalog IDs; no tracking or server-side favorites are introduced.
- Click **Check EPG coverage** separately to load `guides.json`. This reports only whether guide *sources* are indexed for a channel, **not** what's on now, actual XMLTV schedule contents, current broadcasts, or permissions to republish schedules. The guide lookup can fail without blocking the main directory.

### Guardrails

The World Broadcast Atlas intentionally has **no media playback path**: it never retrieves `streams.json`, M3U/HLS playlists, audio/video, channel logos, or embedded players; it does not scrape publisher websites or cache program schedules. Country, language, and guide metadata come from the third-party directory, not a broadcast verification service. Source endpoints are fixed in code, payloads have size limits, and all browser links are HTTPS public hostnames with no credentials, local IPs or arbitrary ports. React text rendering escapes source-supplied names. Source metadata is memory-only per tab until the user leaves the page, with favorites stored locally as channel IDs.

The existing 50 curated RCTV station numbers, `playableUrl()` allowlist, Couch Mode, manual M3U inspector and camera/world-tour modules are unchanged. **Free to discover does not equal free to watch or free to rebroadcast.** IPTV-org's source-data license does not grant rights in the linked broadcasters' underlying videos or trademarks.

### Validation and follow-up

`src/worldBroadcast.test.ts` covers HTTPS and local-network rejection, adult/closed exclusion, duplicate and invalid metadata, language linking, search/filter/favorites, and guide-source provenance. Existing Vitest, TypeScript, build, and CI checks continue to apply. Post-merge manual QA should test browser CORS/network availability, responsive layout, keyboard navigation, search and dropdown filtering, favorites reload, channel website links, retry behavior, and optional guide-coverage lookup. Third-party site restrictions and geographic access cannot be proven by unit tests.

Future phases could add a carefully reviewed, per-broadcaster EPG *schedule* integration or explicitly authorized inline playback. Neither is implied or included in v2.1.

## v2.0: Couch Mode · Lean-back RCTV viewer

ReelCommons now offers a **Couch Mode** for its Open Streams Commons catalog. This is an original full-viewport theater-style *web overlay*, not a native television app or a claim of browser fullscreen privileges. Launch it from the new **RCTV 2.0 / Launch Couch Mode** station near the top of **Open Streams**. The existing Channel Surf Remote, World Atlas, ten starter World Tours, personal itinerary studio, M3U inspector, hardware/FTA labs and all 50 curated sources remain available.

### Big-screen navigation

- **16:9 viewing stage**, channel-number overlay, larger source title, visible source/provider status, and prominent official-player link.
- Dedicated **CH− / CH+** controls, numbered 0–9 keypad, Clear, Backspace, Tune, category selector, favorites-only surfing, and an optional searchable channel guide. The same fixed **CH 001–050** assignment and source metadata from v1.9 are reused. No new channel mapping.
- Keyboard shortcuts act only when the Couch Mode dialog itself has focus: arrows for channel surfing, digits to enter a channel, Enter to choose, Backspace to edit. **Escape closes the overlay from any focused control**. The dialog traps normal Tab focus within its own visible controls, restores the launch button focus when exiting, and scroll-locks the background while open.
- The browser-local last-channel record continues to work with all other RCTV channel selection UIs. The channel's on-page player is unloaded before entering Couch Mode and Couch Mode media unmounts when it closes or a new channel is selected.

### Media rights and actual behavior

**Changing a directory channel never autoplays third-party media.** For official-site-only channels (including EarthCam, SkylineWebcams, all park/beach/rail cameras, and SomaFM), the screen is a branded **standby panel**, with **Open official player** taking the visitor to the source's original website in a separate safe tab. No video files, stream URLs, externally hosted webcam images or authorization status are imported into RCTV.

For only the two earlier-reviewed paths, **NASA ISS YouTube** and **KEXP broadcaster-published AAC**, Couch Mode displays a separate **Load official player/audio** button. This requires an intentional click and uses the same exact `playableUrl()` allowlist as v1.9. KEXP native audio controls start with `preload="none"`; the user still presses Play. A platform can disable a YouTube embed or restrict listening, so the official-site link is always available. Media is not recorded, downloaded, proxied, retransmitted or automatically refreshed.

**Theater mode is a visual interface** and does not currently call the Fullscreen API or guarantee remote-device integration. An accessibility/real-TV QA pass still needs testing with screen readers, keyboard, touch and a gamepad or TV browser. Source owner advertising, availability and regional restrictions remain in effect.

### Trust checks

All browser-side channel switching uses `CHANNEL_LINEUP` and the existing vetted source IDs. `CouchMode.tsx` does not permit pasted URLs, IPTV playlist imports or runtime stream discovery. The session's loaded-media ID is local React state and resets on channel selection, exit, or component unmount. Tests check the default page markup has no automatic iframe/audio and that official-only providers always have just their own viewing links.
## v1.9: Channel Surf Remote · Numbered official destinations

RCTV's **Open Streams Commons** now includes a **Channel Surf Remote** immediately above the existing channel desk, bringing a virtual television interface to the 50 curated sources. These numbers are fixed catalog-directory positions, **not an RF tuner channel, broadcast schedule, frequency, media license, or proof that a broadcaster is currently live**.

### Numbered guide and keypad

- **CH 001–050** are explicit, stable catalog numbers in `src/channelSurf.ts`. Future additions should append slots instead of silently renumbering older destinations. Examples: CH 001 CBS News, CH 013 NASA ISS, CH 017 Bourbon Street, CH 050 Jackson Hole Mountain.
- Use the clickable **0–9 keypad** and **Tune channel**, or open the searchable **Channel Guide**. The guide shows the official source name, number, category and whether that destination is saved to favorites. Displayed categories reuse the existing channel taxonomy.
- Use **CH+ / CH−** for wraparound surfing among the remote's current category. Enable **Favorites only** to surf just the sources you already saved, with an explicit empty state when no channels match. **Last** switches to the previous source selected in the current tab session, including changes made through the map, cards and tours, provided it's in the selected remote lineup.
- Keyboard shortcuts work only while the remote *panel itself* has focus: **↑ / ↓** for next/previous, digits to enter a channel, **Enter** to tune, **Backspace** to delete and **Escape** to clear. Text fields, select menus, links and focused buttons keep their normal keyboard behavior. No global keyboard listener or unexpected shortcuts are introduced.
- The last selected known catalog source ID is saved in **browser localStorage** under `rctv-channel-surf-last-v1`. On returning to Open Streams it is restored. Unknown IDs, invalid versions and malformed storage are ignored; no history, source URLs, time-on-channel or user location is stored. Favorites continue using their existing separate storage key.

### Rights, playback and integration

Changing a channel via numbers, CH+/CH−, last, cards, favorites, World Atlas or World Tour **selects a source and unloads any previously loaded iframe/audio**. It never follows an arbitrary URL, starts playback, fetches media or grants broadcast permissions. For all official-site-only channels the **Official player** button opens the provider's site with `noopener noreferrer`. The only pre-existing opt-in player routes remain NASA ISS and broadcaster-listed KEXP audio in the separate channel desk.

No dependencies, third-party map services, tracking, backend, premium feed, recording, proxy or tuner hardware are needed. The remote makes the existing source directory easier to use; RCTV still cannot verify whether a third-party stream is online or watchable in a particular region.

### Automated coverage

`src/channelSurf.test.ts` covers one-to-one stable 50-slot numbering, input parsing, invalid channels, wraparound surfing, category/favorites-only selection, trusted local persistence and unchanged official-site-only playback rules. Existing Python, Vitest and production build CI apply. After merge, manually test the remote keyboard focus, numeric entry, CH+/CH−, Last, guide, remote filters, browser refresh and optional NASA/KEXP player unloading.
## v1.8: Build Your Own World Tour · A private, shareable itinerary studio

RCTV adds an original **Custom Tour Builder** to the **Open Streams → World Tour Mode** panel. Browse any of the **50 known RCTV official viewing destinations**, create a personal ordered journey, and use the existing manual-passport World Tour player to explore each official source in sequence. Ten published starter tours remain unchanged.

### Build, reorder and explore

1. Open World Tour Mode, then **Build a Custom Tour**. Enter a short title (3–64 characters) and add **3–10 distinct** destinations from the curated catalog. Duplicate entries and unknown providers are rejected.
2. Use ↑ and ↓ to reorder individual stops; remove individual entries with ×. **Save new local route** or edit an existing saved route (up to **12** saved tours per browser).
3. Choose **Explore** from your saved tours to view it through the existing World Tour navigation. Use **Preview channel desk** to select a source without autoplay, or **Open official camera** to visit the broadcaster's original player. Camera owners remain in control of availability and authorization.
4. Your existing World Tour **manual passport** counts shared sources across custom and published tours; a stamp is only a visitor declaration of explored, **never independently verified playback, live status or physical travel**.

### Safe, portable itinerary files

Use **Export** to download a portable, human-readable JSON itinerary. Files have schema **RCTV_CUSTOM_WORLD_TOUR_V1** and include **only the tour title and ordered IDs from our fixed curated catalog**. No raw media URLs, web embeds, provider credentials, visitor location, viewing history, passport stamps or video are exported.

Import is opt-in through a local file picker. The browser checks a **24 KB** limit, exact format identifier, allowed field names, safe title length, **3–10 unique existing catalog IDs**, and a **12-tour storage cap**. Unknown URLs, remote streams, HTML fields and arbitrary playlist files are rejected, rather than promoted into available RCTV media. Imported tours receive a fresh local identifier, avoiding overwriting an existing user's tour.

Tour titles and IDs remain in **browser localStorage** only under `rctv-custom-world-tours-v1`. No cloud account, API, background tasks, camera playback probes, or automatic tracking is introduced. Deleting a saved route does not remove existing manual passport stamps, and editing a tour preserves the same route ID. If browser storage is unavailable, changes persist only during that tab session.

### Tests, restrictions and next steps

New `src/customTours.ts`, `src/customTours.test.ts`, `src/CustomTourBuilder.tsx` and `src/custom-tours.css` contain all data validation, sharing and UI. Tests verify safe route IDs, bounds, title sanitization, local-storage normalization, import rejection, stop ordering, existing World Tour compatibility and explicit non-playback provenance.

This remains a **curated-source discovery tool**. Custom tours cannot embed any unapproved video, stream, audio, or bypass paywalls. After merging, manually smoke-test create/edit/reorder/explore/export/import/delete and reload persistence in a browser. CI cannot prove external webcam availability.
## v1.7: World Atlas · A schematic map of official camera destinations

**RCTV World Atlas** is an original, interactive, responsive, self-contained geographic browser built into **Open Streams Commons**. It reuses curated webcam source records from earlier releases instead of introducing new third-party streams or permissions. Visit **Open Streams → Open World Atlas** to start.

### Map and region clusters

- **16 broad, geographically labeled regions** connect mapped viewing destinations across the Americas, Europe, and Japan. Only camera entries with a meaningful fixed geographic association are plotted. Global radio/provider directories, venue-agnostic rail directories, and the orbital NASA ISS camera stay in the full directory but are deliberately **not assigned fake fixed positions**.
- Original SVG land silhouettes, latitude/longitude graticule and CSS positioning run fully in the browser, with **no map tiles, external API key, account, browser geolocation, IP lookup, or location tracking**.
- Pins are **schematic regional clusters**, not webcam-specific coordinates, and some are intentionally nudged to reduce overlap. The map is **not suitable for navigation or calculating distances**.
- Filter by geographical continent, existing RCTV channel category, or search names. Select an approximate pin or region-list item to see the corresponding curated source cards. Click **Preview in channel desk** to select an existing RCTV channel *without starting playback*, or **Official site** to watch via the broadcaster's own player.

### Regional local-time context

- Local times are formatted using the browser's `Intl.DateTimeFormat` and a named IANA timezone for each representative region. While the Atlas is open, its clock refreshes approximately once per minute using the local device clock. No server request is made.
- The **day/night** label uses a simple fixed 6 a.m.–6 p.m. civil-time window and is **not astronomical daylight** (sunrise/sunset vary with season and latitude). A regional clock isn't proof that any particular camera is live, well-lit or open.
- Las Vegas and Grand Canyon have **separate region pins** because Nevada and Arizona can observe different local times due to daylight-saving rules.

### Trust and privacy

The Atlas is a metadata-only visual browser. No new video/audio, satellite links, stream player policies, HTTP listeners or background telemetry are introduced. Provider playback stays on official pages, except the pre-existing separately reviewed **opt-in NASA ISS / KEXP** routes. Opening or moving a map pin never loads third-party media automatically. Camera availability remains unverified and may change.

World Tour, M3U Inspector, saved channel favorites, private tour passport, Windows hardware labs and existing source-ledger disclosures remain intact. The new `src/worldAtlas.test.ts` tests verify regional source mappings, allowed categories, geospatial bounds, nonexistent sources not pinned, time-zone interpretation and no source authorization changes. Automated CI cannot test real-world video uptime.
## v1.6: Coastlines & Rails · Beaches, harbors, trains and mountains

RCTV expands **Open Streams Commons from 34 to 50 curated official viewing destinations**, adding four new first-class categories: **Beaches, Harbors, Train Cams and Mountain Views** (four destinations each). All new cameras are publisher-site-only; no copied webcam media, embed, HLS hotlink, external feed probe, camera download, proxy, recording or retransmission.

### Beaches (4)

- **Santa Monica Beach & Pier**: original Explore.org Pacific Ocean view.
- **Huntington Beach Pier**: official Visit Huntington Beach surf camera.
- **Clearwater Beach / Pier 60**: original St. Pete–Clearwater visitor-bureau webcam directory.
- **Park Point Beach, Duluth**: Solglimt’s original Lake Superior beach camera hosted by Duluth Harbor Cam.

### Harbors (4)

- **Port of Los Angeles**: official port authority two-camera harbor viewer from San Pedro and Wilmington.
- **Duluth Harbor**: original Duluth Harbor Cam panorama of freighters and the aerial lift bridge.
- **Port San Luis**: original municipal Harbor District webcam links.
- **Duluth South Pier Lighthouse**: original lighthouse shipping-canal stream.

### Train cameras (4)

- **RailStream Free Railcams**: the provider’s ad-supported **Fireman** camera selection, not premium cameras or DVR.
- **Virtual Railfan Free Cameras**: public operator cameras; paid multi-view and premium PTZ cameras are excluded.
- **Ashland, Virginia Rail Cam**: official Virtual Railfan YouTube watch page, external viewing only.
- **Mount Washington Cog Railway**: the Observatory’s webcam directory, including Cog Waumbek Station and Up the Tracks views.

Virtual Railfan specifically prohibits recording, redistribution and restreaming without prior consent. RCTV respects that by linking only to its official watch pages. Not all features at free-and-paid railcam services are free.

### Mountains (4)

- **Mount Washington Observatory**: original summit, tower and surrounding weather cams.
- **Whistler Blackcomb**: Whistler Peak, Roundhouse, Blackcomb and village camera directory.
- **Mammoth Mountain Main Lodge**: original resort live player and snapshot view.
- **Jackson Hole Mountain Resort**: original mountain camera directory.

Mountain camera formats, seasonal operation, ice, obscuring clouds, daylight limitations and still frames differ by source. None of the labels in RCTV constitutes a live uptime check.

### Tours, privacy and trust

The four new five-stop World Tour routes are **Beach Day, Harbor Hopping, Rails Across America, and Above the Clouds**. Ten tours now coexist, and previous passport stamps continue to work. Stamps remain manual visitor self-reports in local browser storage. Browsing does not autoplay external camera media.

New category tabs, view-type scene filters and discovery shortcuts work with existing search, favorites and source information. Every new source has playback policy **official only**, so its media cannot automatically be embedded or streamed in the RCTV channel desk. NASA ISS and KEXP retain their earlier separate opt-in allowlists.

Source metadata and permission notes are in [src/coastRailCatalog.ts](src/coastRailCatalog.ts). Useful source references: [Santa Monica Explore.org](https://explore.org/livecams/oceans/santa-monica-beach-cam), [Huntington Beach](https://www.surfcityusa.com/things-to-do/surfing/live-surf-cam/), [Port of Los Angeles](https://www.portoflosangeles.org/news/livestream), [RailStream](https://www.railstream.net/camera-lineup), [Virtual Railfan](https://virtualrailfan.com/free-cameras), [Mount Washington Observatory](https://mountwashington.org/webcams/), [Whistler](https://www.whistlerblackcomb.com/the-mountain/mountain-conditions/mountain-cams.aspx), [Mammoth](https://www.mammothmountain.com/on-the-mountain/mammoth-webcam/main-lodge), [Jackson Hole](https://www.jacksonhole.com/live-mountain-cams).

Automated CI checks catalog integrity and source-only playback rules, but actual provider streaming, free-tier availability, embedding status and camera uptime require separate manual checking after deployment.
## v1.5: World Tour Mode · Camera Passport

**World Tour Mode** adds a guided, user-driven camera adventure to **Open Streams Commons**. It uses the 34 pre-existing, reviewed publisher destinations. There are no new third-party embeds, stream links, scrapers, camera rights claims, servers or external network requests.

### Six curated camera tours

| Route | Viewpoint itinerary |
| --- | --- |
| **Neon Nights** | Bourbon Street → Times Square → Las Vegas → Shibuya → Abbey Road |
| **Postcard Cities** | Abbey Road → Trevi Fountain → Venice Grand Canal → Shibuya → Times Square |
| **Parks & Peaks** | Yosemite → Grand Canyon → Glacier → Rocky Mountain → Yellowstone |
| **Wild Neighbors** | Cornell FeederWatch → Smithsonian pandas → Explore.org → Aquarium of the Pacific → Georgia Aquarium |
| **Earth Alive** | Kīlauea → Mauna Loa → Yellowstone → Grand Canyon → NASA ISS |
| **Ocean to Orbit** | Monterey Bay → Aquarium of the Pacific → Georgia Aquarium → NASA Live → NASA ISS |

Each tour has five curated stops, an original narrated prompt, previous/next navigation, stop dots, source/format caveats and a visible progress bar. Click **Open official camera** to visit the publisher's destination in a separate tab, or **Preview channel desk** to select that existing RCTV source without starting media playback.

**A tour does not open or autoplay any provider site or embed on its own.** NASA/KEXP pre-existing opt-in playback features work only in the existing channel desk, and only within the previously reviewed allowlist. All city, park, wildlife and aquarium cameras remain official-site-only. Source operators control live availability, ads, privacy policies and streaming permissions. A periodically refreshed National Park Service image should not be confused with continuous live video.

### Your local-only viewing passport

Use **Mark as explored** after choosing a stop. Its stamp means *you explicitly marked this catalog destination as explored*. The app **does not and cannot verify** whether the provider's stream loaded, played, was live, was watched or represented physical travel.

Stamps are kept **only in browser localStorage** under \`rctv-world-tour-passport-v1\` as catalog source IDs with UTC dates. No login, network upload, stream payload, tracking beacon or cross-site analytics integration is added. Shared stops can be credited across multiple tour itineraries. You can remove a stamp, **Clear stamps** with confirmation or **Export passport** as a JSON metadata-only receipt with explicit self-reported provenance and limits. The exported receipt includes only stamps for the currently selected tour. The route-copy button copies the public, official destination pages, not hidden stream endpoints.

Importing untrusted stored JSON is validated against known catalog IDs, ISO calendar dates and a bounded size; unexpected fields or unknown IDs are ignored. The passport is not an audit trail, certification of broadcast availability or assertion of personal location.

### Testing and next goals

The original \`worldTour.ts\` module and \`worldTour.test.ts\` exercise route integrity (30 curated stop references), bounds, no auto-playback claims, private stamp parsing, manual completion, cross-route stops and metadata-only exports. Existing Vitest, Python and TypeScript/build CI checks still apply.

The first on-device QA after merging should confirm that tour selection, previous/next, preview, manual stamp/undo, local persistence, copy/export/clear and small-screen layout all work. Testing the *actual* footage still requires visiting the third-party provider's official player.

## v1.4: City & Nature Cameras · The World Window

RCTV expands **Open Streams Commons** from **14 to 34 hand-reviewed, official destinations** with dedicated **City Cams** and **Nature Cams** wings. All 20 new entries are publisher-owned source links, not third-party re-hosts. The existing RCTV film library, FAST/live TV guides, radio, space, FTA lab, Signal Bridge and Tuner Scout are unchanged.

### City cams: seven places

- **New York City:** EarthCam's Times Square cameras.
- **London:** Abbey Road Studios' famous crossing webcam.
- **New Orleans:** EarthCam's Bourbon Street / French Quarter view.
- **Las Vegas:** EarthCam's Las Vegas/Strip skyline and desert backdrop.
- **Tokyo:** SkylineWebcams' streets of Shibuya.
- **Venice:** SkylineWebcams' Grand Canal.
- **Rome:** SkylineWebcams' Trevi Fountain.

### Nature cams: thirteen places and collections

- **National parks (5):** Yellowstone's Old Faithful webcam directory, Yosemite Valley/High Sierra cameras, Grand Canyon South Rim cameras, Glacier National Park, Rocky Mountain National Park.
- **Volcano observatories (2):** USGS Kīlauea summit and Mauna Loa thermal webcam images.
- **Wildlife (4):** Smithsonian National Zoo pandas and all-zoo cam directory, Cornell Lab's Bird Cam directory and FeederWatch camera.
- **Aquarium/ocean (2):** Aquarium of the Pacific and Georgia Aquarium official webcam directories.

Browse via **Open Streams → City Cams** or **Nature Cams**, or use the new **city/nature passport** shortcuts. The second-level filters support *City streets, Landmarks, National parks, Volcanoes, Wildlife, and Ocean life*. Search, Surprise Me, favorites, source details and existing opt-in NASA/KEXP playback continue to work. Saved IDs are recognized across all 34 items.

### What counts as a live camera?

The new catalog distinguishes provider-described types:

- **PROVIDER-LISTED VIDEO**: A publisher lists the destination as a live video camera; neither RCTV nor CI confirms it is online or broadcasting at this instant.
- **REFRESHED STILL IMAGES**: A park, weather or scientific webcam can publish periodically refreshed frames instead of continuous moving video. The Grand Canyon NPS page notes roughly one- or fifteen-minute refreshes depending on view; check each image timestamp.
- **VARIABLE / SCHEDULED**: A directory mixes different camera types, a feed may be seasonal, or video might switch to a replay. The Smithsonian giant panda camera explicitly uses a replay after 7 p.m. Eastern.

**Rights and source integrity:** Even publicly visible cameras can have strict terms. Yosemite National Park says that permission to *feature Yosemite Conservancy webcams* requires a usage agreement. RCTV **does not embed or copy** those images. Likewise, EarthCam, SkylineWebcams, Abbey Road, Smithsonian, Cornell and aquarium cameras stay in their **official provider players**. No new raw HLS endpoints, copied YouTube embeds, image hotlinks, scrapers, camera downloads, live-status claims or retransmissions are introduced.

Every entry has a named publisher, official HTTPS destination, geographical context, rights note, view type and uptime/seasonality caveat. The underlying curated metadata is independently written for RCTV. Third-party video, images, names and trademarks remain theirs. Public camera visibility is not a license to use their media elsewhere.

### Source review reference links

- Cities: [EarthCam Times Square](https://www.earthcam.com/usa/newyork/timessquare/), [Abbey Road Studios Crossing](https://www.abbeyroad.com/crossing), [EarthCam Bourbon Street](https://www.earthcam.com/usa/louisiana/neworleans/bourbonstreet/), [SkylineWebcams Venice](https://www.skylinewebcams.com/en/webcam/italia/veneto/venezia/canal-grande.html), [Shibuya](https://www.skylinewebcams.com/en/webcam/japan/kanto/tokyo/streets-of-shibuya.html) and [Rome](https://www.skylinewebcams.com/en/webcam/italia/lazio/roma/fontana-di-trevi.html).
- Parks: [Yellowstone NPS](https://www.nps.gov/yell/learn/photosmultimedia/webcams.htm), [Yosemite NPS and usage agreement note](https://www.nps.gov/yose/learn/photosmultimedia/webcams.htm), [Grand Canyon NPS](https://www.nps.gov/grca/learn/photosmultimedia/webcams.htm), [Glacier NPS](https://www.nps.gov/glac/learn/photosmultimedia/webcams.htm), and [Rocky Mountain NPS](https://www.nps.gov/romo/learn/photosmultimedia/webcams.htm).
- Wildlife/science: [USGS HVO webcams](https://volcanoes.usgs.gov/observatories/hvo/cams/panorama.php?cam=V3cam), [Smithsonian panda camera](https://nationalzoo.si.edu/webcams/panda-cam), [Cornell Bird Cams](https://www.allaboutbirds.org/cams/all-cams/), [Aquarium of the Pacific](https://www.aquariumofpacific.org/exhibits/webcams), and [Georgia Aquarium](https://www.georgiaaquarium.org/webcam/).

Tests in \`src/cameraCatalog.test.ts\` verify unique catalog IDs, safe HTTPS official domains, explicit non-embedding for all added cameras, type labels, scene categories and local favorite handling. **Provider playback is not checked automatically**; after GitHub Pages deploys, spot-check destinations in a real browser.

## v1.3: Open Streams Commons · Official internet TV, radio, nature and space

RCTV adds an original **Open Streams** tab, plus a launcher from **Live TV & FTA**. This is a manually curated starting point for **legitimate free internet viewing**, distinct from the **FTA satellite simulator**, **MPEG-TS local-file inspector**, **Windows hardware diagnostics** and **radio-frequency reception**. No tuner or receiver hardware is needed to use Open Streams.

### Four channel wings

- **Live TV:** CBS News 24/7, ABC News Live, U.S. House FloorCast, and PBS local live access (where offered).
- **Internet radio:** KEXP, SomaFM, Radio Garden, Radio Browser directory and Radio Paradise.
- **Live Earth:** official Monterey Bay Aquarium cams and Explore.org wildlife cameras.
- **Space & science:** official NASA events/NASA+, NASA's ISS official YouTube live-video destination, and ESA Web TV.

Each record includes source provenance, region/scheduling caveats, explicit playback policy and a fallback official destination. This is not a live electronic program guide; **RCTV does not monitor stream availability** or certify station rights.

### Playback trust ledger

Each curated record has a **hardcoded, reviewed** playback route:

1. **Official destination (default):** Open the broadcaster's own player in a new tab with \`noopener noreferrer\`. This covers CBS, ABC, PBS, government programs, the Aquarium, Explore.org, Radio Garden, Radio Paradise, ESA and **SomaFM**. Free to view does **not** imply a right to mirror or embed.
2. **Optional platform embed:** NASA's official ISS video has a **click-to-load** YouTube privacy-enhanced \`youtube-nocookie.com\` iframe, subject to YouTube/player embeddability and NASA broadcast availability. If unavailable, use the official YouTube watch link. No autoplay on channel selection.
3. **Optional publisher-listed audio:** KEXP provides an HTTPS AAC streaming URL publicly for third-party listening. The **click-to-load native HTML audio player** uses the exact published \`kexp160.aac\` URL without a proxy, recorder, restream or metadata scraper. The listener presses Play directly. If unsupported or unavailable, use KEXP's official listening page. Third-party audio is not licensed for rebroadcast.

**Important SomaFM exception:** SomaFM's September 2026 terms explicitly restrict third-party client embedding or stream use without prior written permission, including noncommercial web apps. RCTV therefore **does not embed SomaFM's audio** even though its published direct listening links are publicly accessible. Its channel card always links to the official SomaFM site. This is an intentional licensing boundary.

The app only loads media after an explicit user action. Changing channels or stopping unmounts the active iframe/audio element. No YouTube tracking or third-party player iframe is loaded before user action. RCTV does not host, store, proxy, decrypt, record, remix or retransmit third-party media. Real-time playback and external network availability require manual browser checks and are not guaranteed by CI.

### Original local M3U inspector

The **Open M3U inspector** allows **metadata-only preview** of a user-selected channel-index \`.m3u\` / \`.m3u8\` playlist (up to 96 KB and 100 entries). It parses \`#EXTINF\` labels and URLs locally in the browser, accepting only syntactically public HTTPS hosts for the *preview*. It rejects embedded credentials, localhost/private address targets and HLS **segment manifests**. It **never fetches, plays, follows, stores, exports or opens imported stream URLs**, and drops query strings, tokens and URL paths before displaying sanitized hostnames and format hints.

The goal is to learn the format and reason about provenance without promoting community playlist links to broadcaster-approved streams. Inclusion in a public M3U/IPTV directory, including open-source indexes, does not independently prove ownership, authorization, embed rights, current transmission or availability.

### Privacy and tests

- Favorites are saved **only in the current browser** under \`rctv-open-streams-favorites-v1\`; no login or account is used. The visitor can remove favorites or clear local browser storage.
- Searches, filters, source browsing, the demo M3U, file imports and media-panel selection require no server-side processing.
- New tests cover exact playback allowlists, prohibited SomaFM embedding, category filtering, favorites normalization, M3U injection/private-network rejection, import limits, and non-playback guarantees.
- Review [NASA Live](https://www.nasa.gov/live/), [Monterey Bay Aquarium Cams](https://www.montereybayaquarium.org/cams-videos/live-cams), [KEXP Streams](https://www.kexp.org/mobile/kexp-livestreams/), [SomaFM Terms](https://somafm.com/contact/tos.html), [YouTube's Embed Instructions](https://support.google.com/youtube/answer/171780?hl=en), and [ESA Web TV](https://www.esa.int/ESA_Multimedia/ESA_Web_TV) before expanding playback coverage.

## v1.2: Hardware Readiness Gate · Research before receiver commands

RCTV adds an **evidence-first hardware readiness worksheet** within **Tuner Scout → Read the device ledger**, reusing the v1.1 current Windows diagnostic JSON import. No additional OS scan, USB interaction, driver install, local server, software dependency or automated connection is introduced.

### How to use

1. Import a current RCTV v1.1 device diagnostic JSON report, preferably from running the opt-in `py .\companion\device_diagnostics.py --scan --out .\rctv-device-diagnostics.json` on your Windows PC. The browser treats this as **user-supplied, unverified JSON** even when it claims a Windows source.
2. Select a possible tuner/SDR device by its reported **display name and device class**. Windows `OK` and ConfigManager code 0 are operating-system reports only, not proof of a working tuner. Synthetic fixtures, absent candidates and Windows-reported issues cannot produce the adapter-review state.
3. From independently reviewed manufacturer documentation, optionally fill a **model label**, **proposed interface** (BDA, SAT>IP, vendor SDK, SDR or other), **broadcast standard** (ATSC, DVB or SDR) and a **public documentation reference**. These are **operator-provided claims**, never automatically detected or verified by RCTV.
4. Confirm that you can physically access the equipment and intend to test only broadcasts/media you're permitted to receive/use. Acknowledging does not independently establish rights or authorization.
5. The gate displays a checklist distinguishing **imported OS claims**, **operator-reported details**, **missing evidence**, and **blocks**. If every planning requirement is entered, the highest attainable state is **REVIEW_PACKET_PREPARED**, meaning *ready for a human to plan an adapter*, not that hardware was validated.
6. **Export research packet** creates a local JSON record of the selected candidate, inputs, gate decisions and explicit nonverification labels. No media, device serials, driver access, remote upload or background persistence. Review entered text for personal information before sharing.

### Deliberate authority ceiling

- `verifiedTuner`, `verifiedRfLock`, and `verifiedPlayback` remain **false** in every evaluation, including `REVIEW_PACKET_PREPARED`.
- `SYNTHETIC_DEMO` cannot qualify as real Windows hardware evidence.
- Windows device issue/ambiguous state blocks the review state even when someone fills all manual fields.
- Importing JSON cannot authenticate the physical origin of the data; both Windows and operator fields can be edited externally.
- Device matching is name + class only and is **not** stable identity. Never use this exported packet to authorize automatic device access.

### Next gate

With a genuine Windows diagnostic report and verified manufacturer documentation, design a **specific driver/API adapter** in a separate opt-in change. Real signal quality, lock, service decoding and any playback need new observation schemas and their own tests. Nothing in v1.2 operates a receiver.
## v1.1: Device Diagnostics · Windows PnP telemetry without tuner control

RCTV v1.1 extends the **Tuner Scout** page with an optional **read-only Windows device-diagnostics report** and before/after comparison. This is **operating-system Plug-and-Play metadata only**, *not* live DVB/ATSC demodulator telemetry, signal lock or TV playback. The v1.0 candidate scanner and all earlier RCTV features remain intact.

### Run explicitly on Windows

Use Python 3.10+ from the ReelCommons repository root:

```powershell
py .\companion\device_diagnostics.py --demo --out .\rctv-device-diagnostics-demo.json
py .\companion\device_diagnostics.py --scan --out .\rctv-device-diagnostics.json
```

`--demo` produces two **entirely invented** diagnostic candidates, one illustrative working-Windows-code-0 state and one code-28 driver issue. `--scan` queries the `Win32_PnPEntity` Windows CIM/WMI class, requesting **only present** device entries and **only** `Name`, `PNPClass`, `Status`, `ConfigManagerErrorCode` properties. The companion matches possible TV tuners and SDRs by **display-name pattern**, emits at most **32 candidates**, and writes an **explicitly specified local JSON file**. No instance IDs, serial numbers, IP addresses, MACs, RF telemetry or stream payloads are requested or exported as separate fields. *Friendly names themselves may include identifying details; review before sharing.*

Existing output is protected; pass `--force` only if you intentionally want to overwrite a previous report. No administrator privilege is requested, but device-query permissions and installed PowerShell/CIM support vary across Windows machines. No automatic background scan, scheduled polling, network connections or local HTTP service.

### View and compare

Open **Tuner Scout → Read the device ledger**. Load a current JSON diagnostic report, and optionally an older **baseline** from before plugging in a tuner or making a driver change. Comparison matches normalized **display name + class**, not a stable serial identity. It highlights names appearing/disappearing and classifications changing; it can miss renames, duplicate names, driver changes that do not change status, and data altered in either JSON file.

Codes are interpreted narrowly: `ConfigManagerErrorCode = 0` with Windows status `OK` → `WINDOWS_REPORTS_OK`; nonzero reported error → `WINDOWS_REPORTS_DEVICE_ISSUE`; missing code or ambiguous status → `WINDOWS_STATUS_UNCERTAIN`. These classifications describe **Windows's PnP report**, not compatibility, broadcast reception or genuine hardware readiness. In particular, Windows reporting `OK` doesn't prove the DVB/ATSC standard, usable LNB, antenna, frequency, measured signal or decoded program.

Import is bounded to **80 KB**, canonicalizes supported fields, rejects unsupported identifying properties or any report that claims RF lock/measurement/decoding. All imports are **user-supplied** and **not authenticated** even when their `source` field says `WINDOWS_CIM_SNAPSHOT`. Synthetic examples and unverified Windows files are always labeled as such. Exporting the diagnostics evidence receipt preserves this lack of authority.

### Testing

```powershell
py -m unittest discover -s companion -p 'test_*.py'
npm test
npm run build
```

Python companion tests, browser schema tests and TypeScript build are included in GitHub CI. The **real Windows scan must be validated on a Windows computer**, not inferred from Linux GitHub Actions. For Microsoft-specified field semantics, see [Win32_PnPEntity](https://learn.microsoft.com/en-us/windows/win32/cimwin32prov/win32-pnpentity).

**Future gate:** Any hardware-specific RF or tuning telemetry requires independently reviewed opt-in adapters and a proven trust boundary. This release neither reads nor changes a tuner.
## v1.0: Local Tuner Scout · Companion foundation

**RCTV v1.0** introduces an explicit, opt-in Windows companion script and an RCTV **Tuner Scout** evidence screen. This is the first *local hardware inventory* rung; it is **not** a receiver driver, tuner controller, RF signal probe, satellite scan, video player, or SAT>IP server.

### Quick start on Windows

Install Python 3.10+ if necessary and clone or download this repository. From PowerShell in the repo root:

```powershell
py .\companion\tuner_scout.py --demo --out .\rctv-tuner-inventory-demo.json
py .\companion\tuner_scout.py --scan --out .\rctv-tuner-inventory.json
```

The **demo** only writes two clearly fictional candidate devices. The **scan** explicitly invokes a fixed, read-only Windows PowerShell `Get-PnpDevice -PresentOnly` query, selecting only `FriendlyName`, `Class`, and `Status`. It attempts to identify potential broadcast tuners or SDR devices from display names, without connecting to them. No administrator privileges requested; no commands that install drivers or change hardware. **No localhost HTTP listener or network port is opened in v1.0.**

The output JSON is written only to the local path supplied with `--out`. Existing output files are **not overwritten** unless `--force` is explicitly supplied. The report has at most 32 candidate records and contains **no instance IDs, serials, MAC addresses, IP addresses, username, machine name, channel streams or RF observations**. It does include the sanitized PnP display name/class/status and generation timestamp; review these before sharing.

Open the **Tuner Scout** tab on ReelCommons GitHub Pages and import the generated JSON. Parsing is local to the browser and constrained to 80 KB, 32 candidates and the `RCTV_TUNER_SCOUT_V1` schema. No upload, tracking account, background scanner, external API or local-storage persistence.

### Interpretation

- `POSSIBLE_BROADCAST_TUNER` and `POSSIBLE_SDR` are **name-based guesses**, not proof of working tuners. SDR devices often cannot decode DVB/ATSC TV without specialized software or hardware.
- Windows PnP status `OK` doesn't verify a compatible driver for RCTV, aerial/dish connection, successful RF lock, frequency tuning, demodulation, a decoded MPEG-TS stream, broadcasting rights, or live television.
- The web app treats **all imported files as untrusted user-supplied evidence**, including ones labeling their source `WINDOWS_PNP_ENUMERATION`; imports cannot cryptographically authenticate their origin.
- Import rejects any report asserting `hardwareLockObserved: true`, `signalMeasurementsAvailable: true` or `transportStreamDecoded: true`. Those authority levels need a different protocol and independent validation in a later hardware rung.
- Reports use schema version 1 and remain separate from simulator calculations, MPEG-TS file results, RCTV provider catalogs, TMDB credentials, and watchlists.

### Test and development

```powershell
py -m unittest discover -s companion -p 'test_*.py'
npm test
npm run build
```

CI runs the Python stdlib tests alongside the existing Vitest, TypeScript and Vite build. A future adapter might accept explicitly opted-in device-specific diagnostics with a fixed loopback-only endpoint after threat modeling, but v1.0 deliberately avoids any listeners, local service, automatic polling, and device commands.
## v0.9: Signal Bridge · Local Transport Inspector

RCTV now includes a **Signal Bridge** tab, plus an entry from the FTA Simulator. It is a safe, bounded, **read-only local MPEG-TS file inspector**, the first practical phase of the future hardware Signal Bridge. It does **not** open a tuner, port, network socket or streaming player and does **not** upload user media.

### How to use

1. Open **Signal Bridge** and choose **Load synthetic demo** to examine a generated 188-byte MPEG transport-stream fixture containing a CRC-valid PAT and PMT for fake Program 42, or choose a local `.ts` recording. The demo isn't broadcast evidence.
2. The browser reads **at most 8 MiB** from the selected file, reports the observed sample size, and ignores any later bytes. It checks transport packet alignment, per-PID packet counts, scrambling-control flags, transport-error bits, adaptation-field validity, and continuity anomalies.
3. Inspect the CRC-checked **Program Association Table (PAT)** and **Program Map Table (PMT)** results. They map declared program numbers to PMT PIDs, PCR PIDs, and elementary stream type identifiers. Stream type names are **metadata hints**, not successful codec decoding or playable video.
4. Expand **Inspect top packet IDs** for the local sample's most frequent PIDs, or export a **JSON inspection receipt**. The receipt contains metadata and counts, not media payloads.
5. Clear the report to discard it from this page. No local copies, uploads or server accounts are created.

### Scope and integrity

- **Two distinct provenance states:** `GENERATED_DEMO_BYTES` and `OBSERVED_LOCAL_FILE_BYTES`. User-selected files show **local file bytes observed**, not verified satellite reception, broadcaster authenticity, correct hardware tuning, legal ownership, actual decoder lock or valid playback.
- File-type support is limited to **188-byte MPEG-TS** packets. 192-byte M2TS and 204-byte variants, comprehensive tables (EPG/SDT), fragmented multi-section edge cases, encryption systems, channel playback, live tuner control, and full-file analysis are outside this release.
- PAT/PMT sections are accepted only with the **MPEG-2 CRC32** check. A missing table in the small sample doesn't prove one is absent from the original stream.
- Continuity-counter anomalies are **diagnostic estimates** on a bounded file sample. They can be affected by duplicate packets, discontinuity events, truncation, remuxing or adaptation details and aren't a calibrated measurement of physical packet loss.
- The app does not extract video, unscramble content, circumvent encryption, retransmit copyrighted material, or connect to physical tuners. Browser input remains opt-in.
- **Hardware plan:** A separately installed, opt-in, read-only, loopback-only tuner companion could eventually provide independently sourced tuner observations and captured transport bytes. An arbitrary imported JSON receipt must never upgrade itself to verified hardware status.

Existing virtual FTA calculations, TMDB credentials, movie metadata, FAST sources, Living Room Mode, favorites and watchlists are unchanged.
## v0.8: Virtual FTA Receiver

RCTV now includes an original **FTA Simulator** tab plus a launch entry from **Live TV & FTA**. This is a deterministic, browser-local educational **geostationary Ku-band link model**, not a real RF receiver, MPEG-TS decoder, dish controller, live channel scanner or service authorization system. No actual signal or program is received.

### How to explore

1. Open **FTA Simulator**. Built-in sample Galaxy 19 (97°W) and Eutelsat 9B (9°E) records are deliberately **illustrative and unverified**.
2. Adjust the sample site (default **38°N, 121°W**; this is *not* your detected location), dish diameter, efficiency, rain fade, pointing loss, cable loss, LNB noise figure, assumed antenna noise temperature and roll-off.
3. Select a transponder to see calculated elevation, GEO slant range, dish gain, free-space path loss, received carrier (dBW), thermal noise (dBW), calculated C/N and **signed margin** relative to an illustrative threshold.
4. Optional: **Import Gemini/Grok JSON** from a local file. Supports the flat sample map keyed by satellite and a nested `satellites` map, including Grok-style `Symbol_Rate`, `FEC`, and `EIRP_dBW`. Imported `Status: LOCKED` is preserved as **unverified source metadata** and ignored by the model.
5. **Fill in missing parameters explicitly** for imported records. If symbol rate, EIRP, MODCOD, orbit or other required inputs are missing, the simulator displays **INPUT INCOMPLETE** instead of inventing numbers.
6. Use **Copy evidence receipt** or **Export model JSON** to save all assumptions, calculations and warnings locally. This export is **not** a receiver-compatible channel file and has no transport streams.

### Modeling ledger

- Satellite range and elevation: simple spherical-Earth geometry for a GEO orbit of approximately **42,164 km** from Earth's center and **6,378.137 km** reference Earth radius. Satellites below the geometric horizon return **BELOW HORIZON** before any C/N calculation.
- Antenna gain: `10 log10(η (π D / λ)²)` dBi. Free-space loss: `20 log10(4πr/λ)` dB.
- Received carrier: assumed satellite EIRP + modeled dish gain − FSPL − manually assumed rain, pointing and cable losses.
- Receiver equivalent temperature: `290 (10^(NF/10) − 1)` kelvin; system temperature adds user-assumed antenna temperature. Noise power: `10 log10(k Tsys B)` dBW, using a bandwidth of `symbolRate × (1 + rolloff)`.
- **C/N = received carrier − noise power**. **Margin = C/N − assumed required C/N**, with no clamping or random jitter. **SIMULATED LOCK** denotes 3+ dB margin; **MARGINAL MODEL** denotes 0–3 dB; negative margin means **NO MODEL LOCK**.
- The threshold lookup supports selected illustrative DVB-S/S2, QPSK/8PSK and FEC pairs only. It is **not** a normative DVB-S2 MODCOD performance reference and does not predict a real demodulator. The model omits beam footprint, practical pointing geometry, polarization mismatch details, interference, decoder margin, rain-region propagation and equipment calibration.

### Data integrity and privacy

- All fixtures and imported channels are labeled **illustrative/unverified listing names**, never received program IDs or confirmed free availability. Real broadcast parameters and encryption status must be checked with an authorized source and receiver.
- Import is handled inside the browser, limited to **200 KB, 16 satellites and 120 transponders**, with explicit missing-field warnings; there is no scraping, backend, cloud upload, account, password, or tuner access.
- The demo has **no relation to the TMDB credential**, film metadata, free internet TV links, or RCTV Living Room playback. The new lab is entirely separate.
- This tool cannot decrypt broadcasts, bypass entitlements, serve external programs or prove real hardware signal lock. A separate local device adapter would be needed for observed RF measurements.
## v0.7: Living Room Mode

**RCTV now has a ten-foot, remote-friendly browsing mode**, opened from the **Live TV & FTA** tab. It displays large destination panels, a scrollable directory rail, and readable access/region disclosures.

- **Keyboard remote:** `←`/`→` or `↑`/`↓` switch official directory destinations; `Home` and `End` jump to first/last; `1`–`9` select visible directory slots; `F` toggles that source as a local favorite; `Esc` closes the mode. On-screen Previous, Next, Surprise Me, Favorite and Exit controls work with mouse, keyboard and touch.
- **Selected lineup:** The mode starts with the sources matching your current Live TV filters, in their original order. The lineup is held steady for that viewing session even if you toggle a favorite. Exit and reopen to apply changed filters.
- **Official handoff:** Each entry has a clear, focusable link to its original streaming service or reception guide, opening a new tab. This app is an independent directory, **not** a player, electronic program guide, or proof that an individual channel is live.
- **No new accounts or secrets:** The mode uses the existing static official-source directory and browser-local favorites; movie metadata, watchlists, and TMDB refresh are unchanged.
- **Accessibility:** Dialog focus containment, restore of previous keyboard focus after closing, an accessible exit button, large targets, and a motion-reduction preference.

**Important:** The `01`–`09` numbers are **ReelCommons directory slots**, not terrestrial TV channels, satellite frequencies, cable channel numbers, or broadcaster schedules. FAST services, PBS/NASA programming, and real antenna reception remain distinct.

RCTV's Living Room Mode occupies the browser viewport; if opened within an external iframe such as Field Atlas, its visual space is limited by that iframe. Visitors can open ReelCommons in a standalone tab for a fuller view. The interface does not request browser fullscreen or permission to play third-party streams.
## v0.6: RCTV Live TV & FTA

The new **Live TV & FTA** tab introduces a visually rich, original, keyboard-friendly guide to legitimate free **internet television** and **free-to-air broadcast reception**.

### Curated official destinations

- **FAST internet streaming:** Pluto TV, Tubi Live TV, Plex Live TV, Sling Freestream, The Roku Channel, and Xumo Play.
- **Public-service live:** PBS Local Livestream (restricted to participating local service areas), NASA Live / NASA+ (events and free programming).
- **Over-the-air (FTA/OTA):** The U.S. FCC digital television reception map. Antenna broadcasts are **not** internet streams and require an antenna and compatible tuner. Free-to-air satellite reception is a separate equipment and reception problem, not a promise that satellite channels will play in the browser.

The guide provides **source type / interest / text filters**, optional browser-local **favorite destinations**, and a **Surprise Me** picker among currently visible official sources. It has large focusable actions plus left/right/up/down arrow navigation between provider links, useful when visiting from TV-style interfaces such as Field Atlas. No registration is needed for ReelCommons itself.

### Integrity and limitations

ReelCommons **does not host, proxy, scrape, restream, embed, or intercept TV streams**. A destination link opens the provider's official website, not a guaranteed current channel or a verified playable stream. The app does not claim to know what's playing now, display an EPG, or circumvent geographic restrictions, login requirements, DRM, copyright protections, or advertisements. Actual service lineups, access requirements, and reception depend on provider policies and location.

Favorites are stored locally under `reelcommons.live-tv.favorites.v1` and checked against our fixed directory. They can be lost when site data is cleared. Neither the TMDB API token nor movie watchlist is changed by this release.

### Source references

- FCC signal predictions: https://transition.fcc.gov/mb/engineering/dtvmaps/
- Tubi official live guide: https://tubitv.com/live
- Plex official live TV guide: https://watch.plex.tv/live-tv/channel
- Sling Freestream: https://www.sling.com/freestream
- Roku Channel: https://therokuchannel.roku.com/
- Xumo Play: https://play.xumo.com/live-guide
- PBS local live stream: https://help.pbs.org/support/solutions/articles/12000069454-pbs-live-streaming-faq-and-troubleshooting
- NASA Live: https://www.nasa.gov/live/

## v0.5: The Evidence Desk

**Accessibility and reliability upgrade:** A keyboard-accessible **Skip to main content** link, manual **Check for new snapshot** action, clear error and retry states, and explicit published snapshot age labels. Movie details include a readable evidence explanation and a **Copy evidence receipt** button.

### What the receipt proves

The text receipt names the title, viewing region, original TMDB title page, published timestamp, provider report timestamp, reported free and ad-supported provider names/IDs, and whether the copy is from the published site or a previous browser-session fallback. It states that ReelCommons has **not** independently tested playback or verified a direct service URL. Provider information is attributed to **JustWatch via TMDB**. No new API credentials or accounts are needed.

### Failure behavior

On successful retrieval, a **bounded public-data-only snapshot** is retained in browser **sessionStorage**. It excludes personal watchlists and API keys. If a later request fails, the app can display the last usable session copy with an obvious **BROWSER SESSION FALLBACK** warning. This is *not* presented as fresh streaming availability. Cached copies older than seven days, malformed documents, or suspicious external links are rejected. Browser storage may be disabled or wiped when the tab closes. Empty placeholders never overwrite a useful cached copy. The public provider directory and original watchlist continue to work independently.

The **Check for new snapshot** button refetches the latest published static JSON; it does **not** request a new upstream TMDB scan. The automated GitHub Actions job still controls the refresh schedule. All earlier provider filtering and watchlist behavior is preserved.
## v0.4: The Trust Layer

**Provider names now appear on the public catalog cards**, along with each title's region-specific report date. Visitors can filter the cached catalog by viewing region, movie/TV, reported access (free vs with ads), and individual streaming provider. Movie Night Roulette respects the active filters and still prefers unsaved titles.

**Evidence interpretation:** All availability and named providers are **reported by JustWatch through TMDB**. ReelCommons does **not** independently verify actual playback, entitlement, prices, geographic restrictions, or direct streaming URLs. The TMDB availability link is an information/checking link, not a verified provider deep link. A dated snapshot may be stale, and no result never proves a title is unavailable.

Provider choices are derived directly from the current snapshot, per region, title type, and access category; no independent provider ID list is manufactured. The public catalog remains token-free for visitors. Nothing changes about secret handling, static generation, existing watchlist, or scheduled refresh.
## v0.3: A public catalog, no visitor API token required

**Film catalog → Public catalog** is now the default. It reads a small curated **static snapshot** generated during our GitHub Pages deploy by GitHub Actions. Visitors do not need any token, login or account. The former personal TMDB mode remains under **Advanced live search** for the broader live catalog.

### One-time site-owner setup

1. In the repo open **Settings → Secrets and variables → Actions → New repository secret**.
2. Set **Name** exactly to `TMDB_READ_ACCESS_TOKEN`; set **Secret** to **your own TMDB API Read Access Token** from https://www.themoviedb.org/settings/api . Never commit it or paste it into a public issue.
3. Open **Actions → Deploy GitHub Pages → Run workflow**, choose `main`, and click **Run workflow**.
4. Wait for the Pages job to pass. Then open https://michaelwave369.github.io/ReelCommons/ → **Film catalog → Public catalog**.
5. The same deployment workflow refreshes the snapshot **daily at 10:19 UTC**. Merges into `main` also refresh it.

Without this owner secret, Pages remains deployable and the public view clearly states that it is awaiting its first snapshot. No fabricated movie catalog will be shown. The **Free sources** directory, watchlist, and guide remain functional. If a configured refresh fails, the deployment job fails before replacing the previous published Pages artifact.

### What is published

- A **small, bounded selection** gathered from `movie` and `tv` discover results for **US, CA, GB, and AU**; no unrestricted copies of the TMDB database.
- A title is only shown after a region-specific **free** or **ads** provider report is returned by TMDB (sourced from JustWatch).
- The published file includes its generation timestamp, provider lists, title metadata, poster paths, cast, runtime and **official** YouTube trailers when available.
- Visitors can filter by region or media type, search **within the small snapshot**, inspect provider information, or randomly pick a currently visible title.
- The "View links on TMDB" destination is the official TMDB regional link. It does **not** guarantee that a particular title is playable or link straight into every service.
- A **last-checked timestamp and stale-warning (48+ hours)** help visitors assess dated reports. Prices, rights and availability must be confirmed at the provider before watching.

The workflow constructs the file in `public/data/catalog.json` only on the Actions runner during deployment. It is not committed to the repo. The checked-in placeholder has an empty `records` array so anonymous local development and initial deployment work safely. For a local populated snapshot run the generator with a session-only environment variable; **do not add the token to a committed file.**

### Rights and responsible use

TMDB provides data and artwork for noncommercial use subject to its API terms and attribution. JustWatch must be credited for availability through TMDB. The snapshot is limited, refreshed daily and only used for ordinary film browsing. **Do not feed TMDB API content into AI/ML training or AI-based apps without suitable permission.** This release does not use any AI to process TMDB data. Commercial use may require a separate TMDB license.

## v0.2: Optional live film catalog

**Film catalog** is a new tab with live **movie and TV** posters, synopses, ratings, genres, years, cast, runtime, official YouTube trailers (when returned), regional reported free/ad-supported provider lists, and title-level local watchlist saving.

- **No shared API secret:** This GitHub Pages app is static. Each person may enter their *own* TMDB **API Read Access Token** at https://www.themoviedb.org/settings/api . The token stays in React memory for that page visit, is never stored by ReelCommons, and is sent directly to TMDB. Refreshing loses the token. As with any browser-supplied token, browser extensions and dev tools may still observe it. Do **not** publish a token in the repo, Vite env variables, or GitHub Pages build.
- **Free-focused discovery:** Browse TMDB's discover endpoints with watch_region and free/ads monetization filters, including a genre filter. Browse results are *reported* available, not independently verified. **Title searches span all catalog entries**, including paid-only titles; check details before assuming availability.
- **Regional provider lookup:** Each detail view requests TMDB watch-provider data (sourced from JustWatch), shows free and ad-supported lists separately, captures the checked timestamp, and links to the URL TMDB supplies for viewing-link details. TMDB does **not** supply direct per-provider playback deep links. Missing/failed reports are clearly distinguished and do not prove unavailability. Confirm actual conditions on the source service.
- **Film-night roulette:** Selects randomly among the current page's actual catalog results, opening a detail view. The original watchlist roulette remains available.
- **Watchlist compatibility:** Previously saved local items stay as-is. Saving TMDB titles uses stable IDs (such as tmdb-movie-123) to avoid duplicate additions.
- **Attribution:** ReelCommons displays an official TMDB logo and the required disclaimer in the catalog credits. Provider data is attributed to JustWatch.
- **Privacy:** The original free provider directory and manual watchlist remain fully usable **without** connecting TMDB.

TMDB data/API licensing may require a separate commercial agreement if the app is monetized. See https://developer.themoviedb.org/docs/faq and https://www.themoviedb.org/about/logos-attribution .

## v0.1 features

- A responsive, cinema-inspired React interface
- Eight curated official service entry points with access-type and mood filters
- Search by provider name and descriptive tags
- A personal watchlist with notes, watched/unwatched state, and simple text export via copy
- An unwatched-title random picker for movie night
- Browser-local storage without sign-in, tracking, or backend
- A clear explainer for ad-supported, library, and public-media services
- GitHub Actions checks and GitHub Pages build/deploy workflow
- No pirated sources, hosted video content, credentials collection, or ad/paywall bypass

## Local development

Requires Node.js 22+ and npm.

```bash
npm install
npm run dev
npm test
npm run build
```

The application will show the local Vite address in the terminal.

## GitHub Pages

The repository includes `.github/workflows/deploy.yml` for a project page at:

**https://michaelwave369.github.io/ReelCommons/**

After merging to `main`, visit **Settings → Pages** and select **GitHub Actions** as the build/deployment source if it isn't already selected. The workflow builds with `GITHUB_PAGES=true`, setting Vite's base to `/ReelCommons/`. Deployment status must pass before the page is considered live.

## Privacy and content integrity

Your saved watchlist lives only in your browser's `localStorage`. Clearing site data or changing devices can remove it. Use **Copy list** to keep a portable text backup. ReelCommons does not collect account credentials or host movies.

The names of external providers identify their services; ReelCommons is not affiliated with or endorsed by them. Their offerings and policies may change. The Internet Archive may contain items with differing reuse rights; free access does not imply public-domain status.

## Next steps

1. Add optional, clearly attributed film metadata from a permitted API.
2. Build a trusted region-aware availability adapter with caching and last-checked timestamps.
3. Add an accessible, optional local recommendation engine and subtitle guidance.
4. Create an opt-in connector for the Infinite Porch entertainment room, preserving user consent and separation between apps.

## License

MIT © 2026 MichaelWave369.
