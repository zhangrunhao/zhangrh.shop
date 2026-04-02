#!/usr/bin/env python3
"""Minimal track log ingest entry point."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Read track logs and prepare them for future database ingestion."
    )
    parser.add_argument(
        "--source",
        type=Path,
        required=True,
        help="Path to a JSONL track log file.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Reserved for future database writes. Default mode is preview only.",
    )
    return parser.parse_args()


def load_records(source: Path) -> list[dict]:
    records: list[dict] = []
    with source.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            raw = line.strip()
            if not raw:
                continue
            payload = json.loads(raw)
            if not isinstance(payload, dict):
                raise ValueError(f"line {line_number}: expected JSON object")
            records.append(payload)
    return records


def main() -> int:
    args = parse_args()
    records = load_records(args.source)

    print(f"source: {args.source}")
    print(f"records: {len(records)}")

    if not args.apply:
        print("preview only: database write is not implemented yet")
        return 0

    print("apply requested, but database write is not implemented yet")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
