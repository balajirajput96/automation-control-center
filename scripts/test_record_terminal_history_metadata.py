#!/usr/bin/env python3
"""Regression checks for terminal history metadata collection without content access."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "record_terminal_history_metadata.py"


def run(*arguments: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT), *arguments],
        check=False,
        capture_output=True,
        text=True,
        cwd=ROOT,
    )


def test_dry_run_never_returns_history_content() -> None:
    with tempfile.TemporaryDirectory() as directory:
        history = Path(directory) / "history"
        secret_like_content = "API_KEY=must-not-appear\nprivate command\n"
        history.write_text(secret_like_content, encoding="utf-8")
        process = run("--history-path", str(history), "--dry-run")
    assert process.returncode == 0, process.stderr
    assert secret_like_content not in process.stdout
    record = json.loads(process.stdout)
    entry = record["history_files"][0]
    assert entry["exists"] is True
    assert entry["size_bytes"] == len(secret_like_content.encode("utf-8"))
    assert "contents" not in entry


def test_write_creates_metadata_only_file() -> None:
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        history = root / "history"
        output = root / "metadata.json"
        history.write_text("do-not-read\n", encoding="utf-8")
        process = run("--history-path", str(history), "--output", str(output))
        assert process.returncode == 0, process.stderr
        content = output.read_text(encoding="utf-8")
    record = json.loads(content)
    assert record["collection_policy"] == "metadata-only; command content is never read"
    assert "do-not-read" not in content


def main() -> int:
    test_dry_run_never_returns_history_content()
    test_write_creates_metadata_only_file()
    print("record_terminal_history_metadata tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
