#!/usr/bin/env python3
"""Regression checks for the local secret-safe automation execution record script."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "record_automation_run.py"
BASE_ARGUMENTS = [
    sys.executable,
    str(SCRIPT),
    "--repository",
    "balajirajput96/automation-control-center",
    "--task",
    "daily-maintenance",
    "--action",
    "validate-local-contracts",
    "--used",
    "cli:gh",
    "--used",
    "script:validate_n8n_template",
    "--result",
    "success",
    "--validation-status",
    "passed",
    "--timestamp",
    "2026-08-20T00:00:00Z",
]


def run(*arguments: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [*BASE_ARGUMENTS, *arguments],
        check=False,
        capture_output=True,
        text=True,
        cwd=ROOT,
    )


def test_dry_run() -> None:
    process = run("--dry-run")
    assert process.returncode == 0, process.stderr
    record = json.loads(process.stdout)
    assert record["timestamp"] == "2026-08-20T00:00:00Z"
    assert record["used"] == ["cli:gh", "script:validate_n8n_template"]
    assert record["validation_status"] == "passed"


def test_local_jsonl_write() -> None:
    with tempfile.TemporaryDirectory() as directory:
        destination = Path(directory) / "execution.jsonl"
        process = run("--record-file", str(destination))
        assert process.returncode == 0, process.stderr
        records = destination.read_text(encoding="utf-8").splitlines()
    assert len(records) == 1
    assert json.loads(records[0])["result"] == "success"


def test_rejects_secret_like_content() -> None:
    process = run("--remaining-blocker", "token=should-not-be-recorded", "--dry-run")
    assert process.returncode == 2
    assert "appears to contain a secret" in process.stderr


def main() -> int:
    test_dry_run()
    test_local_jsonl_write()
    test_rejects_secret_like_content()
    print("record_automation_run tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
