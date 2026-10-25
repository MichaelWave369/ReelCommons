# REEL Network · CineSwarm and interoffice foundation

**Public-facing identity:** **REEL Network**, an original-programming division and creator network hosted inside **ReelCommons**. ReelCommons remains the existing repository, public website, film/TV directory, and RCTV source catalog. The **REEL** programming floor is intentionally separate from the third-party official destination guide. **Public naming is a working brand concept, not trademark/domain clearance.**

**Historical technical lineage:** The original [parallax-network](https://github.com/MichaelWave369/parallax-network) repo and its Parallax Creative / interoffice plans remain intact; do not rename protocol keys, native package names, historical receipts, published DOIs, service roots, or existing integrations. No redirects or migrations are claimed. A separate Web3/crypto project uses the name “Parallax Network,” making REEL a useful distinct public brand.

## Recovered intended system

The original architecture was more than a video generator:

```text
Creator / PixelForgeStudio World Packet / original show idea
    ↓ Explicit owner permission and Rights & Provenance Office
Development / Showrunner → Writers' Room → Research / Claim Audit
    ↓ Creative direction, style/canon and source constraints
CineSwarm engine / approved model-provider execution
    ↓ Actual media artifacts + evidence and human shot review
ParaCut editing → WaveForgeStudio validated postproduction reference
    ↓ Final media file and human editorial, rights, claim, consent gates
REEL Network Programming Desk → publisher-approved originals channel
    ↓ Viewer-facing episode / sources / AI disclosures / content receipt
ReelCommons audience → optional "Play the Original" link to creator
```

**North Star:** *One idea, many forms, shared intent.* The source world's creator retains ownership; adaptation or licensing terms, credit and participation require a real independently reviewed agreement rather than relying on a model-generated contract.

## Verified source projects (2026-10-25)

| Existing project | Current publicly observed boundary | How REEL uses it |
|---|---|---|
| [parallax-network](https://github.com/MichaelWave369/parallax-network) | Own creator-swarm architecture, showrunner/research/claim-audit/writer/director/audio/editor/receipt agent role definitions, human publisher gates, content classification, rights policy, subscription/content catalogs; `packages/cineswarm-bridge/package.json` reports `0.4.0` and `UNLICENSED`. | **Design lineage only** in this release. Do not copy or treat its package as a freely redistributable browser dependency. Preserve its authority boundaries and human editorial requirements. |
| [CineSwarm](https://github.com/MichaelWave369/CineSwarm) | Public native Python engine v0.2.0, MIT, local coordinator/node, VRAM scheduler, Wan command adapters, SHA-based asset registry, ffprobe QC, exact-artifact human review and hash-chained receipts. No automatic public release and no Internet-approved coordinator. | **Named downstream production engine.** REEL currently produces only a locally downloaded planning packet, not a native CineSwarm job. Do not expose the CineSwarm local endpoint to a public browser or treat a simulation as a rendered shot. |
| [ParaCut](https://github.com/MichaelWave369/paracut) | Browser editing and native RenderPlans, title looks, local exports. | Human-approved editing and media assembly after actual asset generation. |
| [WaveForgeStudio](https://github.com/MichaelWave369/WaveForgeStudio) | Verified ParaCut RenderPlan intake and reference-only release evidence. Receiver ratification does not grant content publishing authority. | Release-package lineage without assuming media has been rendered. |
| [PhiBox](https://github.com/MichaelWave369/PhiBox) | Local-first Web Audio instruments, synth, mic capture, FX and loop export. | Original soundbeds / music and optional future stem handoffs with user consent and rights. |
| [ReelCommons v3.2 Creator Studio](../src/CreatorStudio.tsx) | Browser-local microphone/video recording and download-only episode metadata sidecar. | Human-recorded source clips or podcast sessions; no public broadcast and no automatic CineSwarm import. |

## What the new REEL v3.3 UI actually does

1. Introduces a **REEL** public network identity and programming slate: Originals, Cinema, Games, Music, Voices, Docs, Comedy, After Hours. All are clearly labeled **development concepts**; **no current episodes or broadcast slots are invented**.
2. Renders the **11 historical interoffice production roles** and their intended outputs. The cards explicitly say **planned roles**, not running AI agents. They can be filtered by creative, production, review or release phase.
3. The **Build a show pitch packet** form accepts original show/creator identity, claim class, format, source-world label and a short creative brief. An explicit click produces deterministic work orders from the checked-in role roster and downloads optional `REEL_NETWORK_PITCH_PACKET_V1` JSON.
4. All packet work orders have `state: not_started` and `executionAuthorized: false`. Rights, consent and claims are **unverified**. `humanAccepted` / `humanReleaseAuthorized` / `networkPublishingAuthorized` / `broadcastAuthorized` / `videoRendered` are all `false`. No channel is assigned, and no token, URL or media file is created.
5. REEL is linked from the **Unified TV Home** fifth action and appears as its own section within Open Streams. The original 50 curated RCTV channel numbers and v2.7 playback trust gate remain unchanged.

### Explicit no-op boundaries

- This React app has no autonomous agent runner, dedicated video-generating GPU cloud, secrets broker, ingest host, publishing server, or exposed local CineSwarm coordinator.
- The REEL pitch JSON is **not** a native CineSwarm production-plan schema; it cannot be uploaded and automatically interpreted as an accepted media plan or authority certificate.
- The UI does **not** call CineSwarm, ParaCut, WaveForge, PHIAudio, PHIVid, PhiBox, GitHub write APIs, or any publication service. It does not pass media URLs to the RCTV player.
- The proposal is local React state only; browser export is opt-in. As a design document the JSON is user-editable and cannot serve as cryptographically signed proof of rights, consent, or model operation.
- An accepted CineSwarm render or reviewed candidate is **not** evidence that a human approved a public REEL episode.
- The REEL public name's trademark, handle, and domain availability have **not** been cleared. Avoid claiming legal exclusivity.

## Next implementation milestones

### v3.4 · CineSwarm intake adapter, owned by the native receiver

Design a **CineSwarm-owned**, independently tested converter from `REEL_NETWORK_PITCH_PACKET_V1` (creative intent only) to an actual permitted production plan. Include explicit local user acceptance, specific asset manifests, model/provider capability proof, budgets, and the correct adapter schema. Distinguish proposed shots from rendered media. No web-to-LAN networking without a dedicated authenticated, reviewed bridge.

### v3.5 · Original programs and creator rights

Complete Creator Studio / ParaCut media handoff and original-media hosting. Introduce human-reviewed program manifests, visible synthetic-media disclosures, credit/participation terms and content-receipt profiles. The first REEL-owned source may be appended **after CH 050** once its publisher destination and inline playback method are explicitly reviewed. Never let an uploaded JSON, generated script, guessed RSS feed or IPTV listing promote itself to an on-air source.

### v3.6+ · REEL schedule, pilots and full network

Launch a verifiable REEL Originals pilot, creator-facing show pages, episode pages and newsroom-style programming schedules based on actually hosted, authorized media. Historical **PN-0001 Cold Open** can be migrated as a *candidate title/lineage*, not marked completed until real rendered files and release receipts are verified. Extend to game reviews, music, podcasts, serialized adaptations, and later livestream delivery through a real user-owned broadcasting backend.

## Regression checks

`src/reelNetwork.test.tsx` enforces unverified status, the 11 unexecuted roles, the eight proposal lanes, local packet validation, exact original RCTV 50-slot numbering, no new playable REEL source, and no media/autoplay on the network home or new fifth navigation entry. Existing Python companion, source-policy gate, full React test suite and TypeScript/Vite build remain mandatory.

**Manual:** Review desktop/mobile slate styling, screen reader text, keyboard navigation, form sanitization, JSON download, no blocked popup interactions, and the unchanged source-controlled RCTV media routes. Browser CI does not execute CineSwarm, create films, or verify publish rights.
