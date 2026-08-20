#!/usr/bin/env python3
"""Append a secret-safe JSONL record for a local automation maintenance run."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import UTC, datetime
from pathlib import Path


SENSITIVE_VALUE_PATTERN = re.compile(
    r"(?i)(api[_-]?key\s*(?:=|:)|(?:access|refresh|id)?[_-]?token\s*(?:=|:)|password\s*(?:=|:)|secret\s*(?:=|:)|bearer\s+[a-z0-9._-]+)"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Append a secret-safe JSONL automation execution record."
    )
    parser.add_argument("--repository", required=True)
    parser.add_argument("--task", required=True)
    parser.add_argument("--action", required=True)
    parser.add_argument(
        "--used",
        action="append",
        default=[],
        metavar="KIND:NAME",
        help="Repeat for each CLI, connector, API, script, schedule, or GitHub Action used.",
    )
    parser.add_argument(
        "--result", required=True, choices=("success", "partial", "failure", "skipped")
    )
    parser.add_argument(
        "--failure-category", default="none", help="Use none when no failure occurred."
    )
    parser.add_argument("--recovery-attempt", default="none")
    parser.add_argument(
        "--validation-status",
        required=True,
        choices=("passed", "failed", "partial", "not-run"),
    )
    parser.add_argument("--remaining-blocker", default="none")
    parser.add_argument(
        "--timestamp",
        help="ISO-8601 UTC timestamp. Defaults to the current UTC time.",
    )
    parser.add_argument(
        "--record-file",
        default="reports/private/automation-execution.jsonl",
        help="Ignored local JSONL destination for the execution history.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the validated record without writing it.",
    )
    return parser.parse_args()


def reject_sensitive_values(values: list[str]) -> None:
    for value in values:
        if SENSITIVE_VALUE_PATTERN.search(value):
            raise ValueError("Refusing to record a value that appears to contain a secret.")


def validate_used_entries(entries: list[str]) -> list[str]:
    allowed_kinds = {"api", "cli", "connector", "github-action", "schedule", "script"}
    normalized: list[str] = []
    for entry in entries:
        kind, separator, name = entry.partition(":")
        if not separator or not name or kind not in allowed_kinds:
            raise ValueError(
                "Each --used entry must use an allowed KIND:NAME value, such as cli:gh."
            )
        normalized.append(entry)
    return normalized


def normalized_timestamp(value: str | None) -> str:
    if value is None:
        return datetime.now(UTC).isoformat().replace("+00:00", "Z")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("The timestamp must include a UTC offset or trailing Z.")
    return parsed.astimezone(UTC).isoformat().replace("+00:00", "Z")


def build_record(args: argparse.Namespace) -> dict[str, object]:
    scalar_values = [
        args.repository,
        args.task,
        args.action,
        args.failure_category,
        args.recovery_attempt,
        args.remaining_blocker,
    ]
    reject_sensitive_values(scalar_values + args.used)
    return {
        "schema_version": 1,
        "timestamp": normalized_timestamp(args.timestamp),
        "repository": args.repository,
        "task": args.task,
        "used": validate_used_entries(args.used),
        "action": args.action,
        "result": args.result,
        "failure_category": args.failure_category,
        "recovery_attempt": args.recovery_attempt,
        "validation_status": args.validation_status,
        "remaining_blocker": args.remaining_blocker,
    }


def main() -> int:
    try:
        args = parse_args()
        record = build_record(args)
    except ValueError as error:
        print(f"record_automation_run: {error}", file=sys.stderr)
        return 2

    serialized = json.dumps(record, sort_keys=True, separators=(",", ":"))
    if args.dry_run:
        print(serialized)
        return 0

    destination = Path(args.record_file)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("a", encoding="utf-8") as record_file:
        record_file.write(f"{serialized}\n")
    print(f"Recorded secret-safe execution event at {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
