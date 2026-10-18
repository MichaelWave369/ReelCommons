# ReelCommons

**Good stories. Open doors.**

ReelCommons is an original, independent, open-source directory for **legitimate free streaming**. It helps you discover official streaming destinations, build a personal watchlist, and choose what to watch next.

> **Scope honesty:** v0.1 is a curated **service directory**, not a live title-availability search engine. Provider links go to official homepages. Verify a specific title, ad load, cost, geographic restrictions, and accessibility features on the provider's site.

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
