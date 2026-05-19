import os
from pathlib import Path
from urllib.parse import quote_plus


def build_mongo_uri() -> str:
    direct_uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
    if direct_uri:
        return direct_uri

    cluster = os.getenv("MONGODB_CLUSTER")
    user = os.getenv("MONGODB_USER")
    password = os.getenv("MONGODB_PASSWORD")
    database = os.getenv("MONGODB_DATABASE")
    if cluster and user and password and database:
        app_name = os.getenv("MONGODB_APPNAME")
        query = f"?appName={quote_plus(app_name)}" if app_name else ""
        return f"mongodb+srv://{quote_plus(user)}:{quote_plus(password)}@{cluster}/{database}{query}"

    return "mongodb://localhost:27017/ipanmovie"


REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
RECOMMENDATION_CACHE_TTL_SECONDS = int(os.getenv("RECOMMENDATION_CACHE_TTL_SECONDS", "300"))
MONGO_URI = build_mongo_uri()
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "")

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = Path(os.getenv("RECOMMENDATION_DATA_DIR", BASE_DIR / "data"))
MODEL_DIR = Path(os.getenv("RECOMMENDATION_MODEL_DIR", BASE_DIR / "models"))

SVD_MODEL_PATH = MODEL_DIR / "svd_model.pkl"
RF_MODEL_PATH = MODEL_DIR / "rf_model.joblib"
ENCODERS_PATH = MODEL_DIR / "encoders.joblib"
MOVIES_PKL_PATH = MODEL_DIR / "movies.pkl"
RATINGS_PKL_PATH = MODEL_DIR / "ratings.pkl"
ID_MAP_PATH = MODEL_DIR / "id_map.json"
MODEL_MANIFEST_PATH = MODEL_DIR / "model_manifest.json"

MOVIES_CSV = DATA_DIR / "movies.csv"
RATINGS_CSV = DATA_DIR / "ratings.csv"
TAGS_CSV = DATA_DIR / "tags.csv"
USERS_CSV = DATA_DIR / "users.csv"

