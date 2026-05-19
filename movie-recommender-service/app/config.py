import os
from pathlib import Path

# Thư mục gốc của project (chứa file này)
BASE_DIR = Path(__file__).resolve().parent.parent

# Thư mục data (chứa các file CSV)
DATA_DIR = BASE_DIR / "data"

# Thư mục models (chứa file .pkl, .joblib sau khi train)
MODEL_DIR = BASE_DIR / "models"

# Đường dẫn từng file model
SVD_MODEL_PATH = MODEL_DIR / "svd_model.pkl"
RF_MODEL_PATH = MODEL_DIR / "rf_model.joblib"
ENCODERS_PATH = MODEL_DIR / "encoders.joblib"
MOVIES_PKL_PATH = MODEL_DIR / "movies.pkl"
RATINGS_PKL_PATH = MODEL_DIR / "ratings.pkl"

# Đường dẫn từng file data
MOVIES_CSV = DATA_DIR / "movies.csv"
RATINGS_CSV = DATA_DIR / "ratings.csv"
TAGS_CSV = DATA_DIR / "tags.csv"
USERS_CSV = DATA_DIR / "users.csv"
