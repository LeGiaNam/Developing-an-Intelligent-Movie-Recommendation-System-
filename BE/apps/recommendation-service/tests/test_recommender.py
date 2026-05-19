"""
test_recommender.py - Test thư viện HybridMovieRecommender
==========================================================
Chạy từ thư mục gốc project:
    python tests/test_recommender.py
"""

import sys
from pathlib import Path

# Thêm project root vào path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def test_import():
    print("\n[test] 📦 Test import HybridMovieRecommender...")
    from app.ml.recommender import HybridMovieRecommender
    print("  ✅ Import thành công!")
    return HybridMovieRecommender


def test_load_model(HybridMovieRecommender):
    print("\n[test] 🔄 Test load model...")
    try:
        rec = HybridMovieRecommender()
        print(f"  ✅ Load model thành công!")
        print(f"  Tổng phim: {len(rec._movies_df)}")
        print(f"  Tổng ratings: {len(rec._ratings_df)}")
        return rec
    except FileNotFoundError as e:
        print(f"  ❌ Chưa có model: {e}")
        print("  → Chạy: python training/train.py")
        sys.exit(1)


def test_popular(rec):
    print("\n[test] 🔥 Test recommend_popular(top_k=10)...")
    results = rec.recommend_popular(top_k=10)
    assert len(results) > 0, "Kết quả popular rỗng!"
    print(f"  ✅ Trả về {len(results)} phim phổ biến:")
    for i, r in enumerate(results, 1):
        print(f"  {i:2}. [{r['movieId']:5}] {r['title'][:45]:<45} score={r['hybrid_score']:.3f}")


def test_recommend_user(rec, user_id: int = 1):
    print(f"\n[test] 👤 Test recommend_for_user(user_id={user_id})...")
    user_profile = {
        "gender": "M",
        "occupation": "student",
        "tag": "action comedy",
    }
    results = rec.recommend_for_user(
        user_id=user_id,
        user_profile=user_profile,
        top_k=10,
        alpha=0.7,
    )
    assert len(results) > 0, "Kết quả recommend rỗng!"
    print(f"  ✅ Trả về {len(results)} phim đề xuất cho user {user_id}:")
    for i, r in enumerate(results, 1):
        print(
            f"  {i:2}. [{r['movieId']:5}] {r['title'][:40]:<40} "
            f"svd={r['svd_score']:.3f} rf={r['content_score']:.3f} hybrid={r['hybrid_score']:.3f}"
        )


def test_cold_start(rec, new_user_id: int = 99999):
    print(f"\n[test] 🧊 Test cold-start user (userId={new_user_id} - chưa có dữ liệu)...")
    user_profile = {"gender": "F", "occupation": "artist", "tag": "drama"}
    results = rec.recommend_for_user(
        user_id=new_user_id,
        user_profile=user_profile,
        top_k=5,
        alpha=0.7,
    )
    assert len(results) > 0, "Kết quả cold-start rỗng!"
    print(f"  ✅ Fallback sang popular thành công! Trả về {len(results)} phim.")


def test_genres(rec):
    print("\n[test] 🎭 Test recommend_by_genres(['Action', 'Adventure'])...")
    results = rec.recommend_by_genres(genres=["Action", "Adventure"], top_k=5)
    assert len(results) > 0, "Kết quả genre rỗng!"
    print(f"  ✅ Trả về {len(results)} phim Action/Adventure:")
    for r in results:
        print(f"    [{r['movieId']:5}] {r['title'][:40]:<40} | {r['genres'][:30]}")


if __name__ == "__main__":
    print("=" * 60)
    print("  MOVIE RECOMMENDER - LIBRARY TEST")
    print("=" * 60)

    Cls = test_import()
    rec = test_load_model(Cls)
    test_popular(rec)
    test_recommend_user(rec, user_id=1)
    test_cold_start(rec)
    test_genres(rec)

    print("\n" + "=" * 60)
    print("  ✅ TẤT CẢ TEST PASS!")
    print("=" * 60)
