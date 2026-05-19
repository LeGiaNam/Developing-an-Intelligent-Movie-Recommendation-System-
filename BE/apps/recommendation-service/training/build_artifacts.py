#!/usr/bin/env python3
import argparse
import csv
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATA_DIR = PROJECT_ROOT / "data"
DEFAULT_MODEL_DIR = PROJECT_ROOT / "models"


def read_csv(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    parser = argparse.ArgumentParser(description="Build lightweight production artifacts from exported Atlas data.")
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--models", type=Path, default=DEFAULT_MODEL_DIR)
    args = parser.parse_args()

    movies = read_csv(args.data / "movies.csv")
    ratings = read_csv(args.data / "ratings.csv")
    args.models.mkdir(parents=True, exist_ok=True)

    if (args.data / "id_map.json").exists():
        shutil.copyfile(args.data / "id_map.json", args.models / "id_map.json")

    manifest = {
        "model_version": f"mongo-heuristic-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "algorithm": "mongo_heuristic",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source": "atlas_export",
        "dataset": {
            "movies": len(movies),
            "ratings": len(ratings),
        },
        "serving_strategy": "runtime_atlas_queries_with_redis_cache",
        "ml_artifacts_required_for_hybrid_model": [
            "svd_model.pkl",
            "rf_model.joblib",
            "encoders.joblib",
            "movies.pkl",
            "ratings.pkl",
        ],
    }
    (args.models / "model_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
