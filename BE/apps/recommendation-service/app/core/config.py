import os
from pathlib import Path


REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
RECOMMENDATION_CACHE_TTL_SECONDS = int(os.getenv("RECOMMENDATION_CACHE_TTL_SECONDS", "300"))

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = Path(os.getenv("RECOMMENDATION_DATA_DIR", BASE_DIR / "data"))
MODEL_DIR = Path(os.getenv("RECOMMENDATION_MODEL_DIR", BASE_DIR / "models"))

SVD_MODEL_PATH = MODEL_DIR / "svd_model.pkl"
RF_MODEL_PATH = MODEL_DIR / "rf_model.joblib"
ENCODERS_PATH = MODEL_DIR / "encoders.joblib"
MOVIES_PKL_PATH = MODEL_DIR / "movies.pkl"
RATINGS_PKL_PATH = MODEL_DIR / "ratings.pkl"

MOVIES_CSV = DATA_DIR / "movies.csv"
RATINGS_CSV = DATA_DIR / "ratings.csv"
TAGS_CSV = DATA_DIR / "tags.csv"
USERS_CSV = DATA_DIR / "users.csv"

