"""Stdlib unit tests. Run: python -m unittest discover -s companion -p 'test_*.py'."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

module_path = Path(__file__).with_name("tuner_scout.py")
spec = importlib.util.spec_from_file_location("tuner_scout", module_path)
assert spec and spec.loader
scout = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scout)


class ScoutTests(unittest.TestCase):
    def test_candidate_matching_is_conservative(self):
        self.assertEqual(scout.candidate_type("Hauppauge WinTV DVB-T2"), "POSSIBLE_BROADCAST_TUNER")
        self.assertEqual(scout.candidate_type("RTL2832 USB"), "POSSIBLE_SDR")
        self.assertIsNone(scout.candidate_type("NVIDIA RTX 5070 GPU"))
        self.assertIsNone(scout.candidate_type("USB Audio Device"))

    def test_metadata_is_minimal_and_deduplicated(self):
        devices = [
            {"FriendlyName": "Example ATSC TV Tuner", "Class": "Media", "Status": "OK",
             "InstanceId": "SECRET-SERIAL-123", "IP": "192.168.1.1"},
            {"FriendlyName": "Example ATSC TV Tuner", "Class": "Media", "Status": "OK"},
            {"FriendlyName": "Desktop speaker", "Class": "Audio", "Status": "OK"},
        ]
        data = scout.create_report("WINDOWS_PNP_ENUMERATION", devices, "2026-10-18T00:00:00Z")
        self.assertEqual(len(data["devices"]), 1)
        self.assertEqual(data["devices"][0]["candidateType"], "POSSIBLE_BROADCAST_TUNER")
        self.assertNotIn("InstanceId", str(data))
        self.assertNotIn("SECRET-SERIAL", str(data))
        self.assertNotIn("192.168.", str(data))
        self.assertFalse(data["rf"]["hardwareLockObserved"])

    def test_no_device_name_is_not_a_verified_no_hardware_claim(self):
        report = scout.create_report("WINDOWS_PNP_ENUMERATION", [])
        self.assertEqual(report["scanResult"], "NO_MATCHING_DEVICE_NAMES")
        self.assertEqual(report["devices"], [])
        self.assertTrue(report["candidateOnly"])

    def test_limit_is_bounded_and_report_truncated(self):
        records = [{"FriendlyName": f"TEST DVB-S2 Receiver {n}", "Class": "Media", "Status": "OK"} for n in range(45)]
        candidates, limited = scout.normalize_candidates(records)
        self.assertEqual(len(candidates), 32)
        self.assertTrue(limited)

    def test_demo_has_explicitly_fake_provenance(self):
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / "demo.json"
            self.assertEqual(scout.main(["--demo", "--out", str(target)]), 0)
            import json
            report = json.loads(target.read_text(encoding="utf-8"))
            self.assertEqual(report["source"], "SYNTHETIC_DEMO")
            self.assertEqual(len(report["devices"]), 2)
            self.assertIn("unverified", report["disclosure"])

    def test_refuses_to_overwrite_unless_explicit(self):
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / "inventory.json"
            self.assertEqual(scout.main(["--demo", "--out", str(target)]), 0)
            self.assertEqual(scout.main(["--demo", "--out", str(target)]), 1)
            self.assertEqual(scout.main(["--demo", "--out", str(target), "--force"]), 0)

    def test_rejects_unrecognized_source_and_unsafe_structures(self):
        with self.assertRaises(ValueError):
            scout.create_report("REMOTE_NETWORK_SCAN", [])
        with self.assertRaises(ValueError):
            scout.normalize_candidates("not a list")


if __name__ == "__main__":
    unittest.main()
