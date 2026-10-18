# ReelCommons

**Good stories. Open doors.**

ReelCommons is an original, independent, open-source directory for **legitimate free streaming**. It helps you discover official streaming destinations, build a personal watchlist, and choose what to watch next.

> **Scope honesty:** v0.1 is a curated **service directory**, not a live title-availability search engine. Provider links go to official homepages. Verify a specific title, ad load, cost, geographic restrictions, and accessibility features on the provider's site.

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
