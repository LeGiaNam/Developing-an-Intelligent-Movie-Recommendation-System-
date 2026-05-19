import json
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import (
    ENCODERS_PATH,
    ID_MAP_PATH,
    MODEL_MANIFEST_PATH,
    MOVIES_PKL_PATH,
    RATINGS_PKL_PATH,
    RF_MODEL_PATH,
    SVD_MODEL_PATH,
)


REQUIRED_ML_FILES = [
    SVD_MODEL_PATH,
    RF_MODEL_PATH,
    ENCODERS_PATH,
    MOVIES_PKL_PATH,
    RATINGS_PKL_PATH,
]


def file_status(path: Path) -> dict:
    exists = path.exists()
    return {
        "path": str(path),
        "exists": exists,
        "size_bytes": path.stat().st_size if exists else 0,
        "modified_at": datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat() if exists else None,
    }


def load_model_manifest() -> dict:
    if not MODEL_MANIFEST_PATH.exists():
        return {
            "model_version": "mongo-heuristic-dev",
            "algorithm": "mongo_heuristic",
            "created_at": None,
            "source": "runtime_atlas_queries",
            "notes": "ML artifacts are missing; RS uses Atlas-based heuristic recommendations.",
        }
    return json.loads(MODEL_MANIFEST_PATH.read_text(encoding="utf-8"))


def model_readiness() -> dict:
    files = {path.name: file_status(path) for path in REQUIRED_ML_FILES}
    ml_ready = all(item["exists"] for item in files.values())
    return {
        "ml_ready": ml_ready,
        "manifest": load_model_manifest(),
        "files": files,
        "id_map": file_status(ID_MAP_PATH),
    }
