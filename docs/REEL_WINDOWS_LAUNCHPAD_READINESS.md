# REEL Originals v3.8 · Windows GPU Launchpad Readiness Desk

**Status: local diagnostic reader, no media produced or rendered by the website.** This milestone bridges the existing CineSwarm Windows Launchpad (merged PR #8) to REEL's actual Pilot 001 webpage. The website never accesses your PC's GPU or localhost, installs packages, starts a coordinator or authorizes publication.

## Your first real render: see precisely what's missing

1. Open **REEL Network → The First Transmission → Pilot 001**, and click **Download preproduction JSON**. This exports the original eight-shot, 74-second story, including its eight-second first shot.
2. In a **separately downloaded/extracted local CineSwarm checkout** on your intended Windows GPU workstation, open PowerShell from its repo root:

   ```powershell
   .\tools\REEL-Launchpad.ps1 -SaveReport
   ```

   If the pilot isn't in the default Downloads path, pass it explicitly:

   ```powershell
   .\tools\REEL-Launchpad.ps1 -PilotPath "$HOME\Downloads\reel-p001-preproduction.json" -SaveReport
   ```

   The script uses an installed Python 3.11+ interpreter, examines local availability, never installs packages or triggers video inference and writes a **new timestamped diagnostic JSON** to Downloads.

3. Optionally inspect checkpoint-byte SHA-256 and PyTorch CUDA visibility in an isolated subprocess:

   ```powershell
   .\tools\REEL-Launchpad.ps1 -PilotPath "$HOME\Downloads\reel-p001-preproduction.json" -CheckModelHash -ProbeTorch -SaveReport
   ```

   Model hashing may read many gigabytes. PyTorch CUDA probing is not video-model inference. Missing installed Wan source/checkpoint or PyTorch remains blocked.

4. Back in **REEL → Pilot 001 → Windows Launchpad**, explicitly select that local JSON. REEL checks its exact shape, no-render/no-release flags and coherent model, checksum, disk, RAM and **per-GPU** VRAM status. It shows nine prioritized readiness checks and a practical first action.

If the same pilot kit was exported in the same browser visit, REEL correlates the diagnostic source hash to its canonical preproduction packet. Without it, the report is labelled **UNLINKED_UNSIGNED_REPORT**, not origin-verified. A mismatching active kit is rejected.

## What this does and does not prove

An imported diagnostic JSON is **editable and unsigned**. Even the status TECHNICAL_PROBES_PASSED_NEEDS_HUMAN_REVIEW reports *claimed* local technical observations, **not** cryptographic proof of real NVIDIA hardware, authentic model checkpoints, signed receipts, valid licenses or a completed film. The browser never contacts the workstation or initiates downloads, background checks, or rendering.

The site displays resource summary and prescribed repair steps but hides local executable and checkpoint paths (they remain in the imported JSON, which should be reviewed before sharing).

CineSwarm's expected Wan2.1 profile requires **9216 MiB currently free VRAM on ONE GPU**, **16384 MiB free RAM** and **20480 MiB free disk**, the authentic official T2V 1.3B checkpoint and pinned hash, installed upstream source with generate.py, compatible PyTorch/CUDA and local ffmpeg+ffprobe. Mere checkpoint bytes or digest consistency do not independently certify provenance or permitted use.

## Actual rendering still needs your authorization

After independently verifying the model license and technical state, use CineSwarm's [one-shot native render guide](https://github.com/MichaelWave369/CineSwarm/blob/main/docs/REEL_FIRST_SHOT_LOCAL_RENDER_SESSION.md). It requires explicit render, license, GPU consent, **full current plan hash**, and a fresh persistent session folder. The REEL browser and diagnostic **never invoke that command**.

On a genuinely completed render, CineSwarm preserves native 832×480/16fps video, a separately scaled delivery master 1280×720/24fps and the real unsigned MP4 evidence sidecar. The REEL Evidence Desk and ParaCut R8.9 can then inspect the actual selected files. Human QC, music/voice rights, credits and separate publisher release remain outstanding.

## CI scope

The new src/reelLaunchpadReport.test.tsx tests a blocked Windows diagnostic, simulated all-green technical observations with **no authority promotion**, forged publication/download/model activity, summed-GPU arithmetic, changing source hashes, inconsistent checkpoint claims, malformed/oversized JSON, no automatic video/audio and unchanged RCTV 50-channel policy. GitHub Actions cannot prove a real Wan model was run on the owner's GPU.

This bridge helps creators **remove uncertainty before the first real render**. It is not a finished episode or a new RCTV channel.
