"""
recommender.py
==============
Thư viện chính của Hybrid Recommendation System.
Có thể import và dùng độc lập mà không cần chạy FastAPI.

Ví dụ sử dụng:
    from app.ml.recommender import HybridMovieRecommender

    rec = HybridMovieRecommender()
    results = rec.recommend_for_user(
        user_id=1,
        user_profile={"gender": "M", "occupation": "student", "tag": "action"},
        top_k=10,
        alpha=0.7
    )
"""

import pickle
import warnings
from pathlib import Path
from typing import List, Dict, Optional, Any

import joblib
import numpy as np
import pandas as pd

from app.core.config import (
    SVD_MODEL_PATH,
    RF_MODEL_PATH,
    ENCODERS_PATH,
    MOVIES_PKL_PATH,
    RATINGS_PKL_PATH,
)

warnings.filterwarnings("ignore")


class HybridMovieRecommender:
    """
    Hybrid Recommendation System kết hợp:
    - SVD (Collaborative Filtering) từ scikit-surprise
    - RandomForestRegressor (Content-Based Filtering)

    Công thức: hybrid_score = alpha * svd_score + (1 - alpha) * content_score
    """

    def __init__(self, model_dir: Optional[Path] = None):
        """
        Khởi tạo và load toàn bộ model từ thư mục models/.
        Gọi hàm này 1 lần khi khởi động server.
        """
        # Cho phép override model_dir nếu cần
        if model_dir is not None:
            global SVD_MODEL_PATH, RF_MODEL_PATH, ENCODERS_PATH, MOVIES_PKL_PATH, RATINGS_PKL_PATH
            SVD_MODEL_PATH = model_dir / "svd_model.pkl"
            RF_MODEL_PATH = model_dir / "rf_model.joblib"
            ENCODERS_PATH = model_dir / "encoders.joblib"
            MOVIES_PKL_PATH = model_dir / "movies.pkl"
            RATINGS_PKL_PATH = model_dir / "ratings.pkl"

        self._svd = None
        self._rf = None
        self._encoders: Dict[str, Any] = {}
        self._movies_df: Optional[pd.DataFrame] = None
        self._ratings_df: Optional[pd.DataFrame] = None
        self._is_loaded = False
        self._load_models()

    # ------------------------------------------------------------------
    # LOAD
    # ------------------------------------------------------------------

    def _load_models(self) -> None:
        """Load tất cả model và dữ liệu vào RAM."""
        missing = []
        for path in [SVD_MODEL_PATH, RF_MODEL_PATH, ENCODERS_PATH, MOVIES_PKL_PATH, RATINGS_PKL_PATH]:
            if not path.exists():
                missing.append(str(path))

        if missing:
            raise FileNotFoundError(
                f"Thiếu các file model sau, vui lòng chạy training/train.py trước:\n"
                + "\n".join(f"  - {p}" for p in missing)
            )

        print("[Recommender] Đang load models...")

        # Load SVD (scikit-surprise dùng pickle)
        with open(SVD_MODEL_PATH, "rb") as f:
            self._svd = pickle.load(f)

        # Load RandomForest
        self._rf = joblib.load(RF_MODEL_PATH)

        # Load encoders: le_gender, le_occupation, mlb, tfidf, feature_columns
        self._encoders = joblib.load(ENCODERS_PATH)

        # Load DataFrames
        self._movies_df = pd.read_pickle(MOVIES_PKL_PATH)
        self._ratings_df = pd.read_pickle(RATINGS_PKL_PATH)

        self._is_loaded = True
        print(f"[Recommender] ✅ Load xong! Tổng số phim: {len(self._movies_df)}")

    # ------------------------------------------------------------------
    # HELPER
    # ------------------------------------------------------------------

    def is_existing_user(self, user_id: int) -> bool:
        """Kiểm tra user có tồn tại trong tập dữ liệu ratings hay không."""
        return user_id in self._ratings_df["userId"].values

    def get_watched_movie_ids(self, user_id: int) -> set:
        """Trả về tập hợp các movieId mà user đã xem (đã rating)."""
        watched = self._ratings_df[self._ratings_df["userId"] == user_id]["movieId"]
        return set(watched.tolist())

    def predict_svd_score(self, user_id: int, movie_id: int) -> float:
        """
        Dự đoán điểm của user cho movie bằng SVD.
        Trả về giá trị mặc định nếu user/movie chưa có trong tập train.
        """
        try:
            pred = self._svd.predict(str(user_id), str(movie_id))
            return float(pred.est)
        except Exception:
            return 3.0  # fallback: điểm trung bình

    def build_rf_features(self, user_profile: Dict[str, str], movie_row: pd.Series) -> np.ndarray:
        """
        Tạo vector đặc trưng cho RandomForest từ thông tin user và phim.

        Args:
            user_profile: {"gender": "M", "occupation": "student", "tag": "action comedy"}
            movie_row: 1 dòng của movies_df (có cột genres)

        Returns:
            numpy array shape (1, n_features)
        """
        le_gender = self._encoders["le_gender"]
        le_occupation = self._encoders["le_occupation"]
        mlb = self._encoders["mlb"]
        tfidf = self._encoders["tfidf"]
        feature_columns = self._encoders["feature_columns"]

        # ---- Encode gender (xử lý giá trị mới chưa thấy khi train) ----
        gender = user_profile.get("gender", "M")
        if gender not in le_gender.classes_:
            gender = le_gender.classes_[0]  # fallback về class đầu tiên
        gender_enc = le_gender.transform([gender])[0]

        # ---- Encode occupation ----
        occupation = user_profile.get("occupation", "other")
        if occupation not in le_occupation.classes_:
            occupation = le_occupation.classes_[0]
        occ_enc = le_occupation.transform([occupation])[0]

        # ---- Encode genres (MultiLabelBinarizer) ----
        genres_str = movie_row.get("genres", "(no genres listed)")
        genres_list = [genres_str.split("|")]
        # Lọc bỏ các genre chưa thấy khi train
        known_genres = set(mlb.classes_)
        genres_list = [[g for g in genres_list[0] if g in known_genres]]
        if not genres_list[0]:
            genres_list = [["(no genres listed)"]]
        genres_enc = mlb.transform(genres_list)[0]

        # ---- Encode tag (TF-IDF) ----
        tag = user_profile.get("tag", "")
        tag_enc = tfidf.transform([tag]).toarray()[0]

        # ---- Ghép thành vector ----
        raw = np.concatenate([[gender_enc, occ_enc], genres_enc, tag_enc])

        # ---- Đảm bảo đúng thứ tự cột như lúc train ----
        row_dict = dict(zip(feature_columns, raw))
        features = np.array([row_dict.get(col, 0.0) for col in feature_columns])
        return features.reshape(1, -1)

    def predict_content_score(self, user_profile: Dict[str, str], movie_row: pd.Series) -> float:
        """Dự đoán điểm bằng RandomForest (Content-Based)."""
        try:
            features = self.build_rf_features(user_profile, movie_row)
            return float(self._rf.predict(features)[0])
        except Exception:
            return 3.0

    # ------------------------------------------------------------------
    # RECOMMEND
    # ------------------------------------------------------------------

    def recommend_for_user(
        self,
        user_id: int,
        user_profile: Dict[str, str],
        top_k: int = 10,
        alpha: float = 0.7,
    ) -> List[Dict]:
        """
        Gợi ý top_k phim cho user dùng mô hình Hybrid.

        Args:
            user_id: ID người dùng
            user_profile: {"gender": "M", "occupation": "student", "tag": "action"}
            top_k: Số phim trả về
            alpha: Trọng số SVD (0.0 = thuần Content, 1.0 = thuần CF)

        Returns:
            List[dict] với keys: movieId, title, genres, svd_score, content_score, hybrid_score
        """
        # Nếu user chưa tồn tại trong hệ thống → fallback sang popular
        if not self.is_existing_user(user_id):
            print(f"[Recommender] User {user_id} chưa có dữ liệu → fallback sang popular")
            return self.recommend_popular(top_k=top_k)

        # Lấy danh sách phim chưa xem
        watched_ids = self.get_watched_movie_ids(user_id)
        candidate_movies = self._movies_df[~self._movies_df["movieId"].isin(watched_ids)].copy()

        if candidate_movies.empty:
            print(f"[Recommender] User {user_id} đã xem hết phim → trả về popular")
            return self.recommend_popular(top_k=top_k)

        # Tính điểm cho từng phim
        results = []
        for _, movie_row in candidate_movies.iterrows():
            movie_id = int(movie_row["movieId"])

            svd_score = self.predict_svd_score(user_id, movie_id)
            content_score = self.predict_content_score(user_profile, movie_row)
            hybrid_score = alpha * svd_score + (1 - alpha) * content_score

            results.append({
                "movieId": movie_id,
                "title": str(movie_row.get("title", "")),
                "genres": str(movie_row.get("genres", "")),
                "svd_score": round(svd_score, 4),
                "content_score": round(content_score, 4),
                "hybrid_score": round(hybrid_score, 4),
            })

        # Sắp xếp theo hybrid_score giảm dần
        results.sort(key=lambda x: x["hybrid_score"], reverse=True)
        return results[:top_k]

    def recommend_popular(self, top_k: int = 10) -> List[Dict]:
        """
        Gợi ý phim phổ biến nhất dựa trên số lượt đánh giá
        và điểm rating trung bình (Bayesian average).
        """
        # Tính mean và count theo movieId
        stats = (
            self._ratings_df.groupby("movieId")["rating"]
            .agg(["mean", "count"])
            .reset_index()
        )
        stats.columns = ["movieId", "avg_rating", "num_ratings"]

        # Bayesian average: tránh phim ít vote có điểm cao ảo
        C = stats["avg_rating"].mean()
        m = stats["num_ratings"].quantile(0.7)  # ngưỡng 70th percentile
        stats["bayesian_score"] = (
            (stats["num_ratings"] * stats["avg_rating"] + m * C)
            / (stats["num_ratings"] + m)
        )

        # Merge với movies để có title và genres
        merged = stats.merge(self._movies_df, on="movieId", how="inner")
        merged = merged.sort_values("bayesian_score", ascending=False).head(top_k)

        results = []
        for _, row in merged.iterrows():
            score = round(float(row["bayesian_score"]), 4)
            results.append({
                "movieId": int(row["movieId"]),
                "title": str(row.get("title", "")),
                "genres": str(row.get("genres", "")),
                "svd_score": score,
                "content_score": score,
                "hybrid_score": score,
            })
        return results

    def recommend_by_genres(self, genres: List[str], top_k: int = 10) -> List[Dict]:
        """
        Gợi ý phim theo thể loại.

        Args:
            genres: Danh sách thể loại, VD: ["Action", "Comedy"]
            top_k: Số phim trả về
        """
        # Lọc phim có ít nhất 1 genre khớp
        pattern = "|".join(genres)
        mask = self._movies_df["genres"].str.contains(pattern, case=False, na=False)
        filtered = self._movies_df[mask].copy()

        if filtered.empty:
            return self.recommend_popular(top_k=top_k)

        # Tính Bayesian score cho phim trong filtered
        stats = (
            self._ratings_df[self._ratings_df["movieId"].isin(filtered["movieId"])]
            .groupby("movieId")["rating"]
            .agg(["mean", "count"])
            .reset_index()
        )
        stats.columns = ["movieId", "avg_rating", "num_ratings"]
        if stats.empty:
            return self.recommend_popular(top_k=top_k)

        C = stats["avg_rating"].mean()
        m = max(stats["num_ratings"].quantile(0.5), 1)
        stats["bayesian_score"] = (
            (stats["num_ratings"] * stats["avg_rating"] + m * C)
            / (stats["num_ratings"] + m)
        )

        merged = stats.merge(self._movies_df, on="movieId", how="inner")
        merged = merged.sort_values("bayesian_score", ascending=False).head(top_k)

        results = []
        for _, row in merged.iterrows():
            score = round(float(row["bayesian_score"]), 4)
            results.append({
                "movieId": int(row["movieId"]),
                "title": str(row.get("title", "")),
                "genres": str(row.get("genres", "")),
                "svd_score": score,
                "content_score": score,
                "hybrid_score": score,
            })
        return results
