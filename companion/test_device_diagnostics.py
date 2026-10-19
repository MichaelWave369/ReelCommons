"""Run with: python -m unittest discover -s companion -p 'test_*.py'"""
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import device_diagnostics as diag


class DeviceDiagnosticsTests(unittest.TestCase):
    def test_windows_code_zero_is_only_windows_reported_ok(self):
        self.assertEqual(diag.diagnosis("OK", 0), "WINDOWS_REPORTS_OK")
        self.assertEqual(diag.diagnosis("OK", None), "WINDOWS_STATUS_UNCERTAIN")
        self.assertEqual(diag.diagnosis("Unknown", 0), "WINDOWS_STATUS_UNCERTAIN")
        self.assertEqual(diag.diagnosis("OK", 28), "WINDOWS_REPORTS_DEVICE_ISSUE")

    def test_rejects_coerced_codes(self):
        for entry in [False, True, -1, "0", 1.5, 2 ** 32]:
            self.assertIsNone(diag.error_code(entry))

    def test_candidate_only_report_drops_identifiers_and_caps(self):
        raw = [
            {"Name": f"Example DVB-S2 Tuner {n}", "PNPClass": "Media",
             "Status": "OK", "ConfigManagerErrorCode": 0,
             "PNPDeviceID": "SECRET-SERIAL-012", "HardwareID": ["PRIVATE"], "IPAddress": "10.0.0.1"}
            for n in range(40)
        ]
        report = diag.create_report("WINDOWS_CIM_SNAPSHOT", raw, "2026-10-18T23:00:00Z")
        self.assertEqual(len(report["devices"]), 32)
        self.assertTrue(report["truncated"])
        self.assertNotIn("SECRET", json.dumps(report))
        self.assertNotIn("10.0.0.1", json.dumps(report))
        self.assertTrue(report["candidateOnly"])
        self.assertFalse(report["observations"]["rfLockObserved"])

    def test_report_is_synthetic_when_demo_selected(self):
        with tempfile.TemporaryDirectory() as td:
            target = Path(td) / "demo.json"
            self.assertEqual(diag.main(["--demo", "--out", str(target)]), 0)
            data = json.loads(target.read_text(encoding="utf-8"))
            self.assertEqual(data["source"], "SYNTHETIC_DEMO")
            self.assertEqual(data["devices"][0]["diagnostic"], "WINDOWS_REPORTS_OK")
            self.assertEqual(data["devices"][1]["diagnostic"], "WINDOWS_REPORTS_DEVICE_ISSUE")
            self.assertFalse(data["observations"]["programDecoded"])

    def test_no_misleading_nothing_detected_claim(self):
        empty = diag.create_report("WINDOWS_CIM_SNAPSHOT", [])
        self.assertEqual(empty["devices"], [])
        self.assertFalse(empty["truncated"])

    def test_fail_safe_file_overwrite(self):
        with tempfile.TemporaryDirectory() as td:
            target = Path(td) / "demo.json"
            self.assertEqual(diag.main(["--demo", "--out", str(target)]), 0)
            self.assertEqual(diag.main(["--demo", "--out", str(target)]), 1)
            self.assertEqual(diag.main(["--demo", "--out", str(target), "--force"]), 0)

    def test_invalid_source_and_result(self):
        with self.assertRaises(ValueError):
            diag.create_report("REMOTE_SCAN", [])
        with self.assertRaises(ValueError):
            diag.normalize("not a CIM result")


if __name__ == "__main__":
    unittest.main()
