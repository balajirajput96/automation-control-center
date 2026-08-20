#!/usr/bin/env python3
"""Create a local metadata-only inventory of shell history files without reading them."""

from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime
from pathlib import Path


DEFAULT_HISTORY_PATHS = (
    Path.home() / ".bash_history",
    Path.home() / ".zsh_history",
    Path.home() / ".local/share/fish/fish_history",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Record metadata for shell history files without reading command content."
    )
    parser.add_argument(
        "--history-path",
        action="append",
        default=[],
        help="Optional shell history path. May be repeated.",
    )
    parser.add_argument(
        "--output",
        default="reports/private/terminal-history-metadata.json",
        help="Ignored local metadata output path.",
    )
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def entry_for(path: Path) -> dict[str, object]:
    if not path.exists():
        return {"path": str(path), "exists": False}
    stat_result = path.stat()
    return {
        "path": str(path),
        "exists": True,
        "size_bytes": stat_result.st_size,
        "modified_at": datetime.fromtimestamp(stat_result.st_mtime, UTC)
        .isoformat()
        .replace("+00:00", "Z"),
    }


def build_record(paths: list[Path]) -> dict[str, object]:
    return {
        "schema_version": 1,
        "generated_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "collection_policy": "metadata-only; command content is never read",
        "history_files": [entry_for(path) for path in paths],
    }


def main() -> int:
    args = parse_args()
    paths = [Path(path).expanduser() for path in args.history_path] or list(
        DEFAULT_HISTORY_PATHS
    )
    record = build_record(paths)
    serialized = json.dumps(record, sort_keys=True, separators=(",", ":"))
    if args.dry_run:
        print(serialized)
        return 0

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(f"{serialized}\n", encoding="utf-8")
    print(f"Recorded terminal-history metadata at {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
