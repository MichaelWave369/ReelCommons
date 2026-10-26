# REEL Originals — Pilot 001: The First Transmission

**Status:** PREPRODUCTION DRAFT. **No animation, voiceover, score, rendered clips, rights clearance, release receipt, hosted episode or television channel has been verified.**

**Creative lineage:** The historical `MichaelWave369/parallax-network/docs/mvp-roadmap.md` identifies the original network pilot as **“Welcome to Parallax Network.”** The v3.3 REEL pitch already used **“The First Transmission.”** This new script is a **new REEL reinterpretation of that pilot concept**, not a recovered screenplay or completed historical episode.

## Creative brief

**Format:** Eight-scene, original, 74-second cinematic identity trailer for **REEL Originals**.

**Class:** Fictional / symbolic imagery with a human-voiced mission statement, avoiding speculative factual claims about tools or consciousness. Visuals are entirely proposed. The trailer can be made without real faces, real-person impersonation, licensed film footage, branded DAW screenshots, existing characters, gameplay capture, or copied soundtrack.

**Audience promise:** REEL is a creator-controlled space for new stories, films, podcasts, game reviews and music. AI can contribute to production; humans decide what is made, credited, reviewed, and published.

**Sound identity:** Original three-note synth motif, evolving into a soft rhythmic pulse and a modest final swell. The musical reference is a direction to compose fresh original music, **not** permission to use an existing track or sample.

**Visual identity:** Film-black / evergreen backgrounds, ocean-teal volumetrics and luminous warm points of light. A human editor should add final REEL text in ParaCut rather than relying on a text-to-video model to render brand typography reliably.

**Final voiceover / duration:** Eight separately timed passages, each spoken in its allocated shot window with pauses. Human narration must be timed against actual audio during editorial review. The final edit duration of 74 seconds is **proposed**, not proven by production.

## Scene summary

| Timecode | Shot | Original creative purpose |
|---|---|---|
| 00:00–00:08 | P001-S01 · The Unlit Screen | A single luminous question emerges from darkness |
| 00:08–00:17 | P001-S02 · Many Doors | Several unborrowed fictional worlds invite the viewer |
| 00:17–00:27 | P001-S03 · The Writers’ Room | Human story development begins the process |
| 00:27–00:36 | P001-S04 · Give It a Pulse | Original music and maker tools give the scene life |
| 00:36–00:47 | P001-S05 · The Helpful Machine | AI assists while humans remain accountable |
| 00:47–00:57 | P001-S06 · Receipts in the Light | Sources and credits stay visible without false certification |
| 00:57–01:06 | P001-S07 · The Commons Opens | Creative worlds gather without appropriating third-party IP |
| 01:06–01:14 | P001-S08 · The First Transmission | Human-composited REEL identity and final spoken invitation |

The **canonical line-by-line voiceover, shot prompts, sound notes, camera instructions, edit transitions and per-shot rights notes** live in [`src/reelPilot.ts`](../src/reelPilot.ts), and render in the interactive [`ReelPilotDesk`](../src/ReelPilotDesk.tsx). The React desk exports four forms derived from that same data:

- `reel-p001-script.md`: human-readable screenplay, creative/technical direction, eight-point review checklist
- `reel-p001-captions.srt`: basic proposed subtitle timing, **not yet synchronized to recorded narration**
- `reel-p001-shots.csv`: quoted shot list for editorial planning, **not a CineSwarm production plan**
- `reel-p001-preproduction.json`: complete `REEL_ORIGINAL_PILOT_PREPRODUCTION_V1` storyboard and producer notes with immutable **denied** authority flags

A **Send concept to REEL Pitch Desk** button populates the preexisting `REEL_NETWORK_PITCH_PACKET_V1` form as an unreviewed creative idea. The existing [REEL → CineSwarm native bridge](https://github.com/MichaelWave369/CineSwarm/blob/main/docs/REEL_DRYRUN_INTAKE.md) still compiles just **one deterministic 1-second test fixture** from such a pitch. It does **not** render the eight cinematic storyboards or approve a model.

## Required production gates

1. **Human showrunner:** approve the narrative, identity and duration.
2. **World/IP and image reviewer:** clear all generated assets and adaptation terms.
3. **Voice consent reviewer:** secure permission for narration/voices and record their actual origin.
4. **Music rights reviewer:** confirm original stems, sound effects and licenses.
5. **Claim/editorial reviewer:** distinguish symbolic fiction from factual statements.
6. **CineSwarm operator:** qualify actual model, hardware availability, local license, VRAM profile, pinned hashes, shot budget and native plan. Do not promote dry-run fixture output.
7. **Human editor/QC:** inspect actual rendered files, subtitles, frame continuity, audio quality, file hashes and ParaCut output.
8. **Authorized publisher:** approve distribution, media URL, disclosures and content receipt independently of generation or acceptance.

The checkboxes in the browser are **session-only reminders**, not an approval ledger. Exported `reviewGates` remain `not_reviewed`. If a future operator claims approval, that must be supported by a separate, authenticated evidence record in the appropriate owning tool.

## REEL channel launch criteria

An original creator channel at proposed **CH 051+** must wait for hosted **original or explicitly licensed** media, a documented official publisher destination and reviewed playback method, source-controlled publication manifest, public content receipt/AI disclosure, and explicit publisher authorization. The frozen RCTV CH 001–050 guide and reviewed NASA/KEXP player routes must remain unchanged.

A static React site is not a live broadcast server. No episode is “on air” just because its script or graphic is visible.

## Verification

Tests `src/reelPilot.test.tsx` prove eight consecutive exact-range shots, consistent 74-second timecodes, SRT script and CSV exports, fail-closed rights flags, and no fabricated playable media. Existing unit, Python companion, source policy gate and TypeScript/Vite build remain part of CI.

**Practical first human production session:** download the script and shot CSV, approve one shot's prompt and rights provenance, configure an appropriately qualified native CineSwarm backend separately, render and QC one **real** shot, then revise the project plan before committing to all eight scenes.
