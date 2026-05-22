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
import json
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
    ID_MAP_PATH,
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
        self._id_map: Dict[str, Dict[str, str]] = {"movies": {}, "profiles": {}}
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

        print("[Recommender] Loading models...")

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
        if ID_MAP_PATH.exists():
            self._id_map = json.loads(ID_MAP_PATH.read_text(encoding="utf-8"))

        self._is_loaded = True
        print(f"[Recommender] Load complete. Total movies: {len(self._movies_df)}")

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

    def resolve_numeric_movie_id(self, movie_id: str) -> Optional[int]:
        if str(movie_id).isdigit():
            return int(movie_id)
        if self._movies_df is not None and "mongoMovieId" in self._movies_df.columns:
            matches = self._movies_df[self._movies_df["mongoMovieId"].astype(str) == str(movie_id)]
            if not matches.empty:
                return int(matches.iloc[0]["movieId"])
        for numeric_id, mongo_id in self._id_map.get("movies", {}).items():
            if mongo_id == str(movie_id):
                return int(numeric_id)
        return None

    def resolve_numeric_profile_id(self, profile_id: str) -> Optional[int]:
        if str(profile_id).isdigit():
            return int(profile_id)
        for numeric_id, mongo_id in self._id_map.get("profiles", {}).items():
            if mongo_id == str(profile_id):
                return int(numeric_id)
        return None

    def movie_object_id(self, movie_id: int) -> Optional[str]:
        if self._movies_df is not None and "mongoMovieId" in self._movies_df.columns:
            matches = self._movies_df[self._movies_df["movieId"] == int(movie_id)]
            if not matches.empty:
                return str(matches.iloc[0].get("mongoMovieId"))
        return self._id_map.get("movies", {}).get(str(movie_id))

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

    def build_rf_features_batch(self, user_profile: Dict[str, str], movies_df: pd.DataFrame) -> np.ndarray:
        """Tạo ma trận đặc trưng cho nhiều phim cùng lúc."""
        le_gender = self._encoders["le_gender"]
        le_occupation = self._encoders["le_occupation"]
        mlb = self._encoders["mlb"]
        tfidf = self._encoders["tfidf"]
        feature_columns = self._encoders["feature_columns"]

        gender = user_profile.get("gender", "M")
        if gender not in le_gender.classes_:
            gender = le_gender.classes_[0]
        gender_enc = le_gender.transform([gender])[0]

        occupation = user_profile.get("occupation", "other")
        if occupation not in le_occupation.classes_:
            occupation = le_occupation.classes_[0]
        occ_enc = le_occupation.transform([occupation])[0]

        tag = user_profile.get("tag", "")
        tag_enc = tfidf.transform([tag]).toarray()[0]

        known_genres = set(mlb.classes_)
        def process_genres(genres_str):
            if not isinstance(genres_str, str): return ["(no genres listed)"]
            g_list = [g for g in genres_str.split("|") if g in known_genres]
            return g_list if g_list else ["(no genres listed)"]
            
        genres_lists = movies_df["genres"].apply(process_genres).tolist()
        genres_enc_matrix = mlb.transform(genres_lists)

        n_movies = len(movies_df)
        gender_occ_matrix = np.tile([gender_enc, occ_enc], (n_movies, 1))
        tag_matrix = np.tile(tag_enc, (n_movies, 1))
        
        raw_matrix = np.hstack([gender_occ_matrix, genres_enc_matrix, tag_matrix])
        
        # Ensure column alignment matches training
        # If feature_columns matches raw_matrix columns exactly, this is fast.
        # Otherwise, we construct a DataFrame and align it.
        if len(feature_columns) == raw_matrix.shape[1]:
            return raw_matrix
        
        df = pd.DataFrame(raw_matrix, columns=feature_columns[:raw_matrix.shape[1]])
        for col in feature_columns:
            if col not in df.columns:
                df[col] = 0.0
        return df[feature_columns].values

    def recommend_for_user(
        self,
        user_id: int,
        user_profile: Dict[str, str],
        top_k: int = 10,
        alpha: float = 0.7,
    ) -> List[Dict]:
        """
        Gợi ý top_k phim cho user dùng mô hình Hybrid bằng Vectorization.
        """
        if not self.is_existing_user(user_id):
            print(f"[Recommender] User {user_id} has no training data; fallback to popular")
            return self.recommend_popular(top_k=top_k)

        watched_ids = self.get_watched_movie_ids(user_id)
        candidate_movies = self._movies_df[~self._movies_df["movieId"].isin(watched_ids)].copy()

        if candidate_movies.empty:
            return self.recommend_popular(top_k=top_k)

        # 1. Batch predict SVD
        # Surprise SVD est. prediction is not naturally vectorized, but list comprehension is fast enough.
        svd_scores = np.array([self.predict_svd_score(user_id, int(m_id)) for m_id in candidate_movies["movieId"]])

        # 2. Batch predict RF
        features_matrix = self.build_rf_features_batch(user_profile, candidate_movies)
        content_scores = self._rf.predict(features_matrix)

        # 3. Hybrid scoring
        hybrid_scores = alpha * svd_scores + (1 - alpha) * content_scores

        candidate_movies["svd_score"] = svd_scores
        candidate_movies["content_score"] = content_scores
        candidate_movies["hybrid_score"] = hybrid_scores

        # Sắp xếp và lấy top K
        top_candidates = candidate_movies.nlargest(top_k, "hybrid_score")

        results = []
        for _, row in top_candidates.iterrows():
            results.append({
                "movieId": int(row["movieId"]),
                "movieObjectId": self.movie_object_id(int(row["movieId"])),
                "title": str(row.get("title", "")),
                "genres": str(row.get("genres", "")),
                "svd_score": round(float(row["svd_score"]), 4),
                "content_score": round(float(row["content_score"]), 4),
                "hybrid_score": round(float(row["hybrid_score"]), 4),
            })
        return results

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
                "movieObjectId": self.movie_object_id(int(row["movieId"])),
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
                "movieObjectId": self.movie_object_id(int(row["movieId"])),
                "title": str(row.get("title", "")),
                "genres": str(row.get("genres", "")),
                "svd_score": score,
                "content_score": score,
                "hybrid_score": score,
            })
        return results
