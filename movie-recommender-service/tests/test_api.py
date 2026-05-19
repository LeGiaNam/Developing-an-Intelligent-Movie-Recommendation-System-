"""
test_api.py - Test FastAPI endpoints
=====================================
Yêu cầu: Server phải đang chạy tại http://127.0.0.1:8000

Chạy server trước:
    uvicorn app.main:app --reload

Sau đó test:
    python tests/test_api.py
"""

import sys

try:
    import requests
except ImportError:
    print("Cài requests trước: pip install requests")
    sys.exit(1)

BASE_URL = "http://127.0.0.1:8000"


def test_health():
    print("\n[api-test] GET /health")
    resp = requests.get(f"{BASE_URL}/health", timeout=5)
    assert resp.status_code == 200, f"Status: {resp.status_code}"
    data = resp.json()
    print(f"  ✅ {data}")
    return data


def test_popular(top_k: int = 10):
    print(f"\n[api-test] GET /popular?topK={top_k}")
    resp = requests.get(f"{BASE_URL}/popular", params={"topK": top_k}, timeout=30)
    assert resp.status_code == 200, f"Status: {resp.status_code} | Body: {resp.text[:200]}"
    data = resp.json()
    items = data.get("recommendations", [])
    print(f"  ✅ Trả về {len(items)} phim phổ biến")
    for i, m in enumerate(items[:5], 1):
        print(f"  {i}. [{m['movieId']}] {m['title'][:40]} score={m['hybrid_score']:.3f}")


def test_recommend(user_id: int = 1):
    print(f"\n[api-test] POST /recommend (userId={user_id})")
    payload = {
        "userId": user_id,
        "gender": "M",
        "occupation": "student",
        "tag": "action comedy",
        "topK": 10,
        "alpha": 0.7,
    }
    resp = requests.post(f"{BASE_URL}/recommend", json=payload, timeout=60)
    assert resp.status_code == 200, f"Status: {resp.status_code} | Body: {resp.text[:300]}"
    data = resp.json()
    items = data.get("recommendations", [])
    print(f"  ✅ Trả về {len(items)} phim cho userId={user_id}")
    for i, m in enumerate(items[:5], 1):
        print(
            f"  {i}. [{m['movieId']}] {m['title'][:35]:<35} "
            f"hybrid={m['hybrid_score']:.3f}"
        )


def test_recommend_cold_start(user_id: int = 99999):
    print(f"\n[api-test] POST /recommend - Cold-start (userId={user_id})")
    payload = {
        "userId": user_id,
        "gender": "F",
        "occupation": "artist",
        "tag": "drama",
        "topK": 5,
        "alpha": 0.7,
    }
    resp = requests.post(f"{BASE_URL}/recommend", json=payload, timeout=30)
    assert resp.status_code == 200, f"Status: {resp.status_code} | Body: {resp.text[:200]}"
    data = resp.json()
    items = data.get("recommendations", [])
    print(f"  ✅ Cold-start fallback trả về {len(items)} phim")


def test_recommend_genres():
    print("\n[api-test] POST /recommend/genres")
    payload = {
        "genres": ["Action", "Adventure"],
        "topK": 5,
    }
    resp = requests.post(f"{BASE_URL}/recommend/genres", json=payload, timeout=30)
    assert resp.status_code == 200, f"Status: {resp.status_code} | Body: {resp.text[:200]}"
    data = resp.json()
    items = data.get("recommendations", [])
    print(f"  ✅ Trả về {len(items)} phim Action/Adventure")
    for m in items[:3]:
        print(f"    [{m['movieId']}] {m['title'][:40]}")


if __name__ == "__main__":
    print("=" * 60)
    print("  MOVIE RECOMMENDER - API TEST")
    print("  Server: " + BASE_URL)
    print("=" * 60)

    try:
        health_data = test_health()
    except requests.exceptions.ConnectionError:
        print(f"\n❌ Không kết nối được server tại {BASE_URL}")
        print("  Chạy server trước: uvicorn app.main:app --reload")
        sys.exit(1)

    if not health_data.get("model_loaded"):
        print("\n⚠️  Model chưa load. Chạy: python training/train.py")
        sys.exit(1)

    test_popular()
    test_recommend(user_id=1)
    test_recommend_cold_start()
    test_recommend_genres()

    print("\n" + "=" * 60)
    print("  ✅ TẤT CẢ API TEST PASS!")
    print("=" * 60)
