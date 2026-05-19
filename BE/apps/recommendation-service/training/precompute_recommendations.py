#!/usr/bin/env python3
import argparse
import json
import os
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Precompute recommendation snapshots into Atlas.")
    parser.add_argument("--env-file", type=Path, default=PROJECT_ROOT.parent / "api" / ".env")
    parser.add_argument("--limit", type=int, default=12)
    args = parser.parse_args()

    load_env_file(args.env_file)
    from app.services.mongo_recommendation_service import precompute_all

    result = precompute_all(limit=args.limit)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
