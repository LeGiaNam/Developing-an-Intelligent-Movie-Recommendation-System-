"""
preprocess.py - Các hàm hỗ trợ đọc và xử lý dữ liệu
"""

from pathlib import Path
from typing import Tuple

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer


def load_data(data_dir: Path) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Đọc 4 file CSV từ thư mục data/.

    Returns:
        (movies_df, ratings_df, tags_df, users_df)
    """
    movies_path = data_dir / "movies.csv"
    ratings_path = data_dir / "ratings.csv"
    tags_path = data_dir / "tags.csv"
    users_path = data_dir / "users.csv"

    # Kiểm tra file tồn tại
    for path in [movies_path, ratings_path, tags_path, users_path]:
        if not path.exists():
            raise FileNotFoundError(
                f"Không tìm thấy file: {path}\n"
                "Vui lòng đặt các file CSV vào thư mục data/"
            )

    print(f"  Đọc movies.csv...")
    movies_df = pd.read_csv(movies_path)
    print(f"    → {len(movies_df)} phim | Cột: {list(movies_df.columns)}")

    print(f"  Đọc ratings.csv...")
    ratings_df = pd.read_csv(ratings_path)
    print(f"    → {len(ratings_df)} đánh giá | Cột: {list(ratings_df.columns)}")

    print(f"  Đọc tags.csv...")
    tags_df = pd.read_csv(tags_path)
    print(f"    → {len(tags_df)} tags | Cột: {list(tags_df.columns)}")

    print(f"  Đọc users.csv...")
    users_df = pd.read_csv(users_path)
    print(f"    → {len(users_df)} users | Cột: {list(users_df.columns)}")

    return movies_df, ratings_df, tags_df, users_df


def merge_data(
    movies_df: pd.DataFrame,
    ratings_df: pd.DataFrame,
    tags_df: pd.DataFrame,
    users_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Gộp 4 DataFrame thành final_data.

    Kết quả có các cột:
        userId, movieId, title, rating, genres, gender, age, occupation, tag
    """
    # Chuẩn hóa tên cột tags (xử lý cả 2 tên: timestamp và timestamp_y)
    if "timestamp" in tags_df.columns:
        tags_df = tags_df.drop(columns=["timestamp"])

    # Gộp ratings + tags (left join để giữ tất cả ratings)
    df = ratings_df.merge(tags_df, on=["userId", "movieId"], how="left")

    # Gộp với movies
    df = df.merge(movies_df[["movieId", "title", "genres"]], on="movieId", how="inner")

    # Gộp với users
    if "userId" in users_df.columns:
        df = df.merge(
            users_df[["userId", "gender", "age", "occupation"]],
            on="userId",
            how="inner"
        )

    # Chọn các cột cần thiết
    cols_needed = ["userId", "movieId", "title", "rating", "genres", "gender", "age", "occupation", "tag"]
    available_cols = [c for c in cols_needed if c in df.columns]
    df = df[available_cols].copy()

    # Xóa cột timestamp nếu còn sót
    for col in ["timestamp_x", "timestamp_y", "timestamp"]:
        if col in df.columns:
            df.drop(columns=[col], inplace=True)

    return df


def build_features(
    df: pd.DataFrame,
    le_gender: LabelEncoder,
    le_occupation: LabelEncoder,
    mlb: MultiLabelBinarizer,
    tfidf: TfidfVectorizer,
    fit: bool = True,
) -> Tuple[pd.DataFrame, list]:
    """
    Mã hóa các đặc trưng để train RandomForest.

    Args:
        df: DataFrame chứa final_data đã merge
        le_gender, le_occupation, mlb, tfidf: Các encoder
        fit: True khi train (fit_transform), False khi test (transform)

    Returns:
        (X_features: DataFrame, feature_columns: list)
    """
    df = df.copy()

    # Fill missing values
    df["tag"] = df["tag"].fillna("")
    df["genres"] = df["genres"].fillna("(no genres listed)")
    df["gender"] = df["gender"].fillna("unknown")
    df["occupation"] = df["occupation"].fillna("unknown")

    # Encode gender
    if fit:
        df["gender_enc"] = le_gender.fit_transform(df["gender"])
    else:
        known = set(le_gender.classes_)
        df["gender"] = df["gender"].apply(lambda x: x if x in known else le_gender.classes_[0])
        df["gender_enc"] = le_gender.transform(df["gender"])

    # Encode occupation
    if fit:
        df["occupation_enc"] = le_occupation.fit_transform(df["occupation"])
    else:
        known = set(le_occupation.classes_)
        df["occupation"] = df["occupation"].apply(lambda x: x if x in known else le_occupation.classes_[0])
        df["occupation_enc"] = le_occupation.transform(df["occupation"])

    # Encode genres (MultiLabelBinarizer)
    df["genres_list"] = df["genres"].str.split("|")
    if fit:
        genres_enc = mlb.fit_transform(df["genres_list"])
    else:
        genres_enc = mlb.transform(df["genres_list"])
    genres_df = pd.DataFrame(genres_enc, columns=mlb.classes_, index=df.index)

    # Encode tag (TF-IDF)
    if fit:
        tag_enc = tfidf.fit_transform(df["tag"]).toarray()
    else:
        tag_enc = tfidf.transform(df["tag"]).toarray()
    tag_df = pd.DataFrame(tag_enc, columns=tfidf.get_feature_names_out(), index=df.index)

    # Gộp đặc trưng
    X = pd.concat([
        df[["gender_enc", "occupation_enc"]],
        genres_df,
        tag_df,
    ], axis=1)

    feature_columns = list(X.columns)
    return X, feature_columns
