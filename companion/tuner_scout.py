#!/usr/bin/env python3
"""RCTV Tuner Scout v1.0: opt-in Windows device-name inventory, NOT tuner control.

Standard library only. Reads present PnP display names/classes/status through a
fixed PowerShell query. Exports candidate metadata without PnP IDs, serials, IPs,
machine names, driver modifications, or RF observations. Nothing listens on a port.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from typing import Any

SCHEMA = "RCTV_TUNER_SCOUT_V1"
MAX_CANDIDATES = 32
MAX_STDOUT_BYTES = 2_000_000
SCAN_COMMAND = (
    "Get-PnpDevice -PresentOnly -ErrorAction Stop | "
    "Select-Object -Property FriendlyName,Class,Status | "
    "ConvertTo-Json -Compress -Depth 2"
)
BROADCAST_PATTERN = re.compile(
    r"\b(?:dvb(?:[- /\w]*?)(?:s2?|t2?|c)|atsc(?: ?3\.0)?|tv[- ]?tuner|"
    r"hdhomerun|hauppauge|silicondust|digital[- ]?tv|sat>ip|"
    r"television[- ]?tuner)\b", re.IGNORECASE
)
SDR_PATTERN = re.compile(
    r"\b(?:rtl[- ]?sdr|rtl2832|sdrplay|airspy|hackrf|"
    r"limesdr|lime[- ]?sdr|software[- ]defined[- ]radio)\b", re.IGNORECASE
)


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def safe_label(value: Any, limit: int = 105) -> str:
    if not isinstance(value, str):
        return ""
    value = "".join(c if c.isprintable() else " " for c in value).strip()
    return " ".join(value.split())[:limit]


def candidate_type(name: str) -> str | None:
    if BROADCAST_PATTERN.search(name):
        return "POSSIBLE_BROADCAST_TUNER"
    if SDR_PATTERN.search(name):
        return "POSSIBLE_SDR"
    return None


def normalize_candidates(entries: Any) -> tuple[list[dict[str, str]], bool]:
    """Accept only selected PnP display fields, dedupe and cap returned devices."""
    if entries is None:
        entries = []
    if isinstance(entries, dict):
        entries = [entries]
    if not isinstance(entries, list):
        raise ValueError("Windows PnP output was not a JSON object or list")
    output: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()
    limited = False
    for item in entries:
        if not isinstance(item, dict):
            continue
        name = safe_label(item.get("FriendlyName"))
        cls = safe_label(item.get("Class"), 55)
        status = safe_label(item.get("Status"), 35)
        kind = candidate_type(name)
        if not kind:
            continue
        key = (name.casefold(), cls.casefold())
        if key in seen:
            continue
        seen.add(key)
        if len(output) == MAX_CANDIDATES:
            limited = True
            break
        output.append({"name": name, "deviceClass": cls or "Unreported",
                       "pnpStatus": status or "Unreported", "candidateType": kind})
    return output, limited


def read_windows_devices() -> Any:
    if sys.platform != "win32":
        raise RuntimeError("Windows PnP scan works only on Windows. Use --demo anywhere.")
    result = subprocess.run(
        ["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive",
         "-Command", SCAN_COMMAND],
        capture_output=True, timeout=25, check=False,
    )
    if result.returncode:
        raise RuntimeError(
            "Windows PnP inventory could not be read (PowerShell exit code "
            + str(result.returncode) + "). No report was written."
        )
    if len(result.stdout) > MAX_STDOUT_BYTES:
        raise RuntimeError("Device inventory response exceeded the safe size limit.")
    try:
        return json.loads(result.stdout.decode("utf-8-sig"))
    except (UnicodeError, ValueError) as exc:
        raise RuntimeError("Windows PnP returned invalid JSON.") from exc


def create_report(source: str, entries: Any, timestamp: str | None = None) -> dict[str, Any]:
    if source not in ("WINDOWS_PNP_ENUMERATION", "SYNTHETIC_DEMO"):
        raise ValueError("Unsupported source kind")
    candidates, truncated = normalize_candidates(entries)
    return {
        "schema": SCHEMA,
        "source": source,
        "generatedAt": timestamp or utc_now(),
        "platform": "Windows" if source == "WINDOWS_PNP_ENUMERATION" else "Synthetic",
        "candidateOnly": True,
        "scanResult": "CANDIDATES_LISTED" if candidates else "NO_MATCHING_DEVICE_NAMES",
        "truncated": truncated,
        "devices": candidates,
        "rf": {
            "hardwareLockObserved": False,
            "signalMeasurementsAvailable": False,
            "transportStreamDecoded": False,
        },
        "disclosure": (
            "PnP device names are unverified candidates, not verified tuners. "
            "User-supplied JSON cannot authenticate a physical machine. "
            "No RF lock, frequency scan, service decode or playback was performed."
        ),
    }


def write_report(destination: Path, report: dict[str, Any], force: bool = False) -> None:
    destination = destination.expanduser().resolve()
    if destination.exists() and not force:
        raise FileExistsError(f"Refusing to replace {destination}; pass --force to overwrite.")
    if not destination.parent.is_dir():
        raise FileNotFoundError(f"Output folder does not exist: {destination.parent}")
    data = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
    fd, temporary = tempfile.mkstemp(prefix=".rctv-tuner-", suffix=".tmp", dir=str(destination.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(data)
        if destination.exists() and not force:
            raise FileExistsError(f"Refusing to replace {destination}; pass --force to overwrite.")
        os.replace(temporary, destination)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="RCTV read-only Windows tuner candidate scout")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--scan", action="store_true", help="Explicitly query present Windows PnP display names")
    mode.add_argument("--demo", action="store_true", help="Write clearly labeled synthetic demo (no PnP access)")
    parser.add_argument("--out", type=Path, required=True, help="Local JSON output path")
    parser.add_argument("--force", action="store_true", help="Explicitly allow replacing an existing report")
    args = parser.parse_args(argv)
    try:
        data = [
            {"FriendlyName": "RCTV DEMO DVB-S2 Receiver", "Class": "Media", "Status": "OK"},
            {"FriendlyName": "RCTV DEMO RTL-SDR", "Class": "USB", "Status": "OK"},
        ] if args.demo else read_windows_devices()
        report = create_report("SYNTHETIC_DEMO" if args.demo else "WINDOWS_PNP_ENUMERATION", data)
        write_report(args.out, report, args.force)
    except (OSError, RuntimeError, ValueError, subprocess.TimeoutExpired) as exc:
        print("RCTV Tuner Scout: " + str(exc), file=sys.stderr)
        return 1
    print(f"Saved {len(report['devices'])} potential device(s) to {args.out}")
    print("No tuner was opened, no RF was measured, and no network port was used.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
