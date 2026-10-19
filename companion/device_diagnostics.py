#!/usr/bin/env python3
"""RCTV Windows Device Diagnostics v1.1.

Explicit read-only WMI/CIM snapshot of *potential* tuners/SDRs, no RF readings.
Exports bounded display-name, device class, Windows status and ConfigManager error
codes. Does NOT change drivers, operate devices, monitor in background, use a
network listener, or export device IDs. Results are not receiver compatibility.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path
import re
import subprocess
import sys
from typing import Any

from tuner_scout import (
    MAX_CANDIDATES, MAX_STDOUT_BYTES, candidate_type, safe_label, write_report,
)

SCHEMA = "RCTV_DEVICE_DIAGNOSTICS_V1"
# Explicit fixed-property query. No dynamic device IDs or user-supplied commands.
CIM_COMMAND = (
    "[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); "
    "Get-CimInstance -ClassName Win32_PnPEntity -ErrorAction Stop | "
    "Where-Object { $_.Present -eq $true } | "
    "Select-Object -Property Name,PNPClass,Status,ConfigManagerErrorCode | "
    "ConvertTo-Json -Compress -Depth 2"
)

def timestamp() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def error_code(value: Any) -> int | None:
    """WMI ConfigManagerErrorCode is UInt32; do not coerce booleans or strings."""
    return value if type(value) is int and 0 <= value <= 0xffffffff else None


def diagnosis(status: str, code: int | None) -> str:
    if code is not None and code != 0:
        return "WINDOWS_REPORTS_DEVICE_ISSUE"
    if code == 0 and status.strip().upper() == "OK":
        return "WINDOWS_REPORTS_OK"
    return "WINDOWS_STATUS_UNCERTAIN"


def normalize(entries: Any) -> tuple[list[dict[str, Any]], bool]:
    if entries is None:
        entries = []
    if isinstance(entries, dict):
        entries = [entries]
    if not isinstance(entries, list):
        raise ValueError("Unexpected Windows CIM response; expected a list of PnP objects.")
    result: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    limited = False
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        name = safe_label(entry.get("Name"))
        cls = safe_label(entry.get("PNPClass"), 55)
        status = safe_label(entry.get("Status"), 35) or "Unknown"
        kind = candidate_type(name)
        if not kind:
            continue
        key = (name.casefold(), cls.casefold())
        if key in seen:
            continue
        seen.add(key)
        if len(result) >= MAX_CANDIDATES:
            limited = True
            break
        cm = error_code(entry.get("ConfigManagerErrorCode"))
        result.append({
            "name": name, "deviceClass": cls or "Unreported",
            "windowsStatus": status, "configManagerErrorCode": cm,
            "candidateType": kind, "diagnostic": diagnosis(status, cm),
        })
    return result, limited


def create_report(source: str, entries: Any, now: str | None = None) -> dict[str, Any]:
    if source not in ("WINDOWS_CIM_SNAPSHOT", "SYNTHETIC_DEMO"):
        raise ValueError("Unsupported source")
    devices, truncated = normalize(entries)
    return {
        "schema": SCHEMA, "source": source, "generatedAt": now or timestamp(),
        "platform": "Windows" if source == "WINDOWS_CIM_SNAPSHOT" else "Synthetic",
        "candidateOnly": True, "truncated": truncated, "devices": devices,
        "observations": {"rfLockObserved": False, "signalMeasured": False, "programDecoded": False},
        "disclosure": (
            "Only Windows-reported PnP candidate properties were requested. "
            "Names are heuristics and Windows reports cannot prove TV reception. "
            "This user-supplied JSON does not authenticate its claimed origin."
        ),
    }


def read_cim_snapshot() -> Any:
    if sys.platform != "win32":
        raise RuntimeError("A real CIM scan requires Windows; use --demo elsewhere.")
    try:
        proc = subprocess.run(
            ["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive", "-Command", CIM_COMMAND],
            capture_output=True, check=False, timeout=30,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError("Windows CIM inventory timed out without writing a report.") from exc
    if proc.returncode:
        raise RuntimeError("Windows CIM inventory failed (exit code " + str(proc.returncode) + ").")
    if len(proc.stdout) > MAX_STDOUT_BYTES:
        raise RuntimeError("Windows CIM response exceeds size limit.")
    try:
        return json.loads(proc.stdout.decode("utf-8-sig"))
    except (UnicodeError, ValueError) as exc:
        raise RuntimeError("Windows CIM returned invalid UTF-8 JSON.") from exc


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="RCTV opt-in read-only Windows device diagnostics")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--scan", action="store_true", help="Explicitly read present Windows PnP state")
    mode.add_argument("--demo", action="store_true", help="Synthetic example without device access")
    parser.add_argument("--out", type=Path, required=True, help="Local report destination")
    parser.add_argument("--force", action="store_true", help="Allow overwriting an existing report")
    args = parser.parse_args(argv)
    try:
        raw = [
            {"Name": "RCTV DEMO DVB-S2 Receiver", "PNPClass": "Media", "Status": "OK", "ConfigManagerErrorCode": 0},
            {"Name": "RCTV DEMO RTL-SDR", "PNPClass": "USB", "Status": "Error", "ConfigManagerErrorCode": 28},
        ] if args.demo else read_cim_snapshot()
        report = create_report("SYNTHETIC_DEMO" if args.demo else "WINDOWS_CIM_SNAPSHOT", raw)
        write_report(args.out, report, args.force)
    except (OSError, RuntimeError, ValueError) as exc:
        print("RCTV Device Diagnostics: " + str(exc), file=sys.stderr)
        return 1
    print(f"Saved {len(report['devices'])} possible device(s) to {args.out}")
    print("No RF was observed; no driver configuration or tuner control occurred.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
