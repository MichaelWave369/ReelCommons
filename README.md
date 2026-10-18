# ReelCommons

**Good stories. Open doors.**

ReelCommons is an original, independent, open-source directory for **legitimate free streaming**. It helps you discover official streaming destinations, build a personal watchlist, and choose what to watch next.

> **Scope honesty:** v0.1 is a curated **service directory**, not a live title-availability search engine. Provider links go to official homepages. Verify a specific title, ad load, cost, geographic restrictions, and accessibility features on the provider's site.

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
