#!/usr/bin/env python3
"""
train.py - Script huấn luyện Hybrid Recommendation Model
=========================================================
Đọc dữ liệu từ data/ → train model → lưu vào models/

Chạy từ thư mục gốc project:
    python training/train.py

Sau khi train xong, thư mục models/ sẽ có:
    - svd_model.pkl
    - rf_model.joblib
    - encoders.joblib
    - movies.pkl
    - ratings.pkl
"""

import pickle
import sys
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer

# Thêm thư mục gốc project vào sys.path để import được module app
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from training.preprocess import load_data, merge_data, build_features

# Kiểm tra surprise
try:
    from surprise import Dataset, Reader, SVD
    from surprise.model_selection import cross_validate
    SURPRISE_AVAILABLE = True
except ImportError:
    SURPRISE_AVAILABLE = False
    print("[train] ⚠️  scikit-surprise chưa được cài!")
    print("  Chạy: conda install -c conda-forge scikit-surprise -y")
    print("  Hoặc:  pip install scikit-surprise")
    sys.exit(1)


DATA_DIR = PROJECT_ROOT / "data"
MODEL_DIR = PROJECT_ROOT / "models"


def train_random_forest(X_train: pd.DataFrame, y_train: pd.Series) -> RandomForestRegressor:
    """Train RandomForestRegressor."""
    print("\n[train] 🌲 Training RandomForest (Content-Based)...")
    print(f"  Input shape: {X_train.shape}")

    rf = RandomForestRegressor(
        n_estimators=100,
        max_depth=15,
        random_state=42,
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)
    print("  ✅ RandomForest đã train xong!")
    return rf


def evaluate_rf(rf: RandomForestRegressor, X_test: pd.DataFrame, y_test: pd.Series) -> None:
    """In kết quả đánh giá RandomForest."""
    y_pred = rf.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    print(f"  RandomForest - MAE: {mae:.4f} | RMSE: {rmse:.4f}")


def train_svd(ratings_df: pd.DataFrame) -> SVD:
    """Train SVD bằng scikit-surprise."""
    print("\n[train] 🧠 Training SVD (Collaborative Filtering)...")

    # Surprise cần userId và movieId là string
    ratings_surprise = ratings_df[["userId", "movieId", "rating"]].copy()
    ratings_surprise["userId"] = ratings_surprise["userId"].astype(str)
    ratings_surprise["movieId"] = ratings_surprise["movieId"].astype(str)

    reader = Reader(rating_scale=(0.5, 5.0))
    data = Dataset.load_from_df(ratings_surprise, reader)

    # Cross-validate để log kết quả
    print("  Đang cross-validate SVD (5 folds)...")
    cv_results = cross_validate(SVD(random_state=42), data, measures=["RMSE", "MAE"], cv=5, verbose=False)
    print(f"  SVD - RMSE trung bình: {cv_results['test_rmse'].mean():.4f}")
    print(f"  SVD - MAE trung bình:  {cv_results['test_mae'].mean():.4f}")

    # Train trên toàn bộ dữ liệu
    print("  Train SVD trên toàn bộ dữ liệu...")
    trainset = data.build_full_trainset()
    svd = SVD(random_state=42)
    svd.fit(trainset)
    print("  ✅ SVD đã train xong!")
    return svd


def save_models(
    svd: SVD,
    rf: RandomForestRegressor,
    encoders: dict,
    movies_df: pd.DataFrame,
    ratings_df: pd.DataFrame,
) -> None:
    """Lưu tất cả model và dữ liệu vào thư mục models/."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    print(f"\n[train] 💾 Đang lưu models vào {MODEL_DIR}...")

    # SVD dùng pickle (surprise không tương thích joblib)
    svd_path = MODEL_DIR / "svd_model.pkl"
    with open(svd_path, "wb") as f:
        pickle.dump(svd, f)
    print(f"  ✅ Lưu {svd_path.name}")

    # RandomForest dùng joblib
    rf_path = MODEL_DIR / "rf_model.joblib"
    joblib.dump(rf, rf_path)
    print(f"  ✅ Lưu {rf_path.name}")

    # Encoders
    enc_path = MODEL_DIR / "encoders.joblib"
    joblib.dump(encoders, enc_path)
    print(f"  ✅ Lưu {enc_path.name}")

    # DataFrames
    movies_path = MODEL_DIR / "movies.pkl"
    movies_df.to_pickle(movies_path)
    print(f"  ✅ Lưu {movies_path.name}")

    ratings_path = MODEL_DIR / "ratings.pkl"
    ratings_df.to_pickle(ratings_path)
    print(f"  ✅ Lưu {ratings_path.name}")


def main():
    start = time.time()
    print("=" * 60)
    print("  MOVIE RECOMMENDER - TRAINING PIPELINE")
    print("=" * 60)

    # ----------------------------------------------------------------
    # 1. Đọc dữ liệu
    # ----------------------------------------------------------------
    print("\n[train] 📂 Bước 1: Đọc dữ liệu từ data/...")
    movies_df, ratings_df, tags_df, users_df = load_data(DATA_DIR)

    # ----------------------------------------------------------------
    # 2. Merge
    # ----------------------------------------------------------------
    print("\n[train] 🔀 Bước 2: Merge dữ liệu...")
    final_data = merge_data(movies_df, ratings_df, tags_df, users_df)
    print(f"  final_data shape: {final_data.shape}")
    print(f"  Mẫu dữ liệu:\n{final_data.head(3).to_string()}")

    # ----------------------------------------------------------------
    # 3. Feature engineering
    # ----------------------------------------------------------------
    print("\n[train] 🔧 Bước 3: Feature engineering...")

    le_gender = LabelEncoder()
    le_occupation = LabelEncoder()
    mlb = MultiLabelBinarizer()
    tfidf = TfidfVectorizer(max_features=100)

    X, feature_columns = build_features(
        final_data, le_gender, le_occupation, mlb, tfidf, fit=True
    )
    y = final_data["rating"]

    print(f"  Số features: {len(feature_columns)}")
    print(f"  Phân phối rating:\n{y.value_counts().sort_index().to_string()}")

    # ----------------------------------------------------------------
    # 4. Train/Test split
    # ----------------------------------------------------------------
    print("\n[train] ✂️  Bước 4: Chia train/test (85/15)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42
    )
    print(f"  Train: {len(X_train)} | Test: {len(X_test)}")

    # ----------------------------------------------------------------
    # 5. Train RandomForest
    # ----------------------------------------------------------------
    rf = train_random_forest(X_train, y_train)
    evaluate_rf(rf, X_test, y_test)

    # ----------------------------------------------------------------
    # 6. Train SVD
    # ----------------------------------------------------------------
    svd = train_svd(ratings_df)

    # ----------------------------------------------------------------
    # 7. Lưu model
    # ----------------------------------------------------------------
    encoders = {
        "le_gender": le_gender,
        "le_occupation": le_occupation,
        "mlb": mlb,
        "tfidf": tfidf,
        "feature_columns": feature_columns,
    }

    # Chỉ lưu các cột cần thiết từ movies_df
    movies_to_save = movies_df[["movieId", "title", "genres"]].drop_duplicates()
    save_models(svd, rf, encoders, movies_to_save, ratings_df)

    elapsed = time.time() - start
    print(f"\n{'=' * 60}")
    print(f"  ✅ TRAINING HOÀN TẤT! Thời gian: {elapsed:.1f}s")
    print(f"  Models đã lưu tại: {MODEL_DIR}")
    print(f"{'=' * 60}")
    print("\n  Bước tiếp theo:")
    print("  1. Test thư viện:  python tests/test_recommender.py")
    print("  2. Chạy API:       uvicorn app.main:app --reload")
    print("  3. Swagger UI:     http://127.0.0.1:8000/docs")


if __name__ == "__main__":
    main()
