# 🎬 Movie Recommender Service

Hệ thống gợi ý phim thông minh sử dụng **Hybrid Model** kết hợp:
- **SVD** (Collaborative Filtering) — học thói quen từ lịch sử đánh giá
- **Random Forest** (Content-Based Filtering) — dựa vào thể loại, tag, nhân khẩu học
- **Hybrid score** = `alpha × SVD + (1 - alpha) × RF`

---

## 📁 Cấu trúc thư mục

```
movie-recommender-service/
│
├── app/
│   ├── __init__.py         # Package marker
│   ├── main.py             # FastAPI application
│   ├── recommender.py      # ⭐ Thư viện chính (import được độc lập)
│   ├── schemas.py          # Pydantic request/response models
│   └── config.py           # Đường dẫn BASE_DIR, DATA_DIR, MODEL_DIR
│
├── training/
│   ├── train.py            # Script huấn luyện model
│   ├── preprocess.py       # Hàm đọc & xử lý dữ liệu
│   └── convert_users.py    # Convert u.user → users.csv
│
├── data/                   # ← Đặt các file CSV vào đây
│   ├── movies.csv
│   ├── ratings.csv
│   ├── tags.csv
│   └── users.csv
│
├── models/                 # ← Tự động tạo sau khi train
│   ├── svd_model.pkl
│   ├── rf_model.joblib
│   ├── encoders.joblib
│   ├── movies.pkl
│   └── ratings.pkl
│
├── tests/
│   ├── test_recommender.py # Test thư viện
│   └── test_api.py         # Test API (cần server đang chạy)
│
├── requirements.txt
├── README.md
└── .gitignore
```

---

## ⚙️ Cài đặt môi trường

### Bước 1 — Tạo môi trường ảo với Python 3.10

> ⚠️ **Bắt buộc dùng Python 3.10** để tránh lỗi biên dịch `scikit-surprise` trên macOS.

```bash
conda create -n movie-rec python=3.10 -y
conda activate movie-rec
```

### Bước 2 — Cài thư viện Python cơ bản

```bash
pip install numpy==1.24.3 pandas scikit-learn joblib fastapi "uvicorn[standard]" pydantic pytest requests
```

### Bước 3 — Cài scikit-surprise (quan trọng trên macOS)

```bash
# Cách ổn định nhất trên macOS (tránh lỗi Cython)
conda install -c conda-forge scikit-surprise -y
```

> Nếu không dùng conda, có thể thử:
> ```bash
> pip install numpy==1.24.3 && pip install scikit-surprise
> ```
> Nhưng có thể gặp lỗi `CompileError` trên Python 3.13+.

---

## 📊 Chuẩn bị dữ liệu

### Bước 4 — Đặt file CSV vào thư mục `data/`

Bạn cần 4 file sau (chuẩn MovieLens 100K hoặc ML-latest-small):

| File | Cột bắt buộc |
|------|-------------|
| `movies.csv` | `movieId`, `title`, `genres` |
| `ratings.csv` | `userId`, `movieId`, `rating`, `timestamp` |
| `tags.csv` | `userId`, `movieId`, `tag`, `timestamp` |
| `users.csv` | `userId`, `age`, `gender`, `occupation`, `zip_code` |

### Bước 5 — Nếu chỉ có file `u.user` (MovieLens 100K gốc)

```bash
# Đặt file u.user vào data/ rồi chạy:
python training/convert_users.py

# Nếu users.csv đã tồn tại và muốn ghi đè:
python training/convert_users.py --force
```

---

## 🏋️ Train Model

### Bước 6 — Chạy pipeline train

```bash
# Đứng tại thư mục gốc movie-recommender-service/
python training/train.py
```

Output mẫu:
```
============================================================
  MOVIE RECOMMENDER - TRAINING PIPELINE
============================================================
[train] 📂 Bước 1: Đọc dữ liệu từ data/...
  Đọc movies.csv...  → 9742 phim
  Đọc ratings.csv... → 100836 đánh giá
  ...
[train] 🌲 Training RandomForest... ✅
[train] 🧠 Training SVD... SVD - RMSE: 0.8764 ✅
[train] 💾 Lưu models vào models/ ✅
  ✅ TRAINING HOÀN TẤT! Thời gian: 45.2s
```

### Bước 7 — Kiểm tra file models đã sinh ra

```bash
ls -lh models/
# Kết quả mong đợi:
# svd_model.pkl     (~1MB)
# rf_model.joblib   (~50MB)
# encoders.joblib   (~500KB)
# movies.pkl        (~300KB)
# ratings.pkl       (~5MB)
```

---

## 🧪 Test Thư Viện Recommender

### Bước 8 — Test module Python trực tiếp

```bash
python tests/test_recommender.py
```

Hoặc import trong code của bạn:

```python
from app.recommender import HybridMovieRecommender

rec = HybridMovieRecommender()

# Gợi ý cho user hiện có
results = rec.recommend_for_user(
    user_id=1,
    user_profile={"gender": "M", "occupation": "student", "tag": "action"},
    top_k=10,
    alpha=0.7,
)
print(results[0])
# {
#   "movieId": 318,
#   "title": "Shawshank Redemption, The (1994)",
#   "genres": "Crime|Drama",
#   "svd_score": 4.2341,
#   "content_score": 3.9871,
#   "hybrid_score": 4.1034
# }

# Phim phổ biến (không cần userId)
popular = rec.recommend_popular(top_k=10)

# Phim theo thể loại
action = rec.recommend_by_genres(genres=["Action", "Adventure"], top_k=5)
```

---

## 🚀 Chạy FastAPI Server

### Bước 9 — Khởi động server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Bước 10 — Kiểm tra Swagger UI

Mở trình duyệt: **http://127.0.0.1:8000/docs**

---

## 🔌 Gọi API

### Từ Terminal (curl)

```bash
# Kiểm tra health
curl http://127.0.0.1:8000/health

# Phim phổ biến
curl "http://127.0.0.1:8000/popular?topK=5"

# Gợi ý cho user
curl -X POST http://127.0.0.1:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "gender": "M", "occupation": "student", "tag": "action", "topK": 10, "alpha": 0.7}'

# Gợi ý theo thể loại
curl -X POST http://127.0.0.1:8000/recommend/genres \
  -H "Content-Type: application/json" \
  -d '{"genres": ["Action", "Comedy"], "topK": 5}'
```

### Từ Node.js / Express (Axios)

```javascript
const axios = require('axios');

const RECOMMENDER_URL = 'http://localhost:8000';

// Gợi ý cho user
async function getRecommendations(userId, gender, occupation) {
  const response = await axios.post(`${RECOMMENDER_URL}/recommend`, {
    userId,
    gender,
    occupation,
    tag: '',
    topK: 10,
    alpha: 0.7,
  });
  return response.data.recommendations;
}

// Phim phổ biến
async function getPopular(topK = 10) {
  const response = await axios.get(`${RECOMMENDER_URL}/popular`, {
    params: { topK },
  });
  return response.data.recommendations;
}

// Sử dụng
const recs = await getRecommendations(userId=1, gender='M', occupation='student');
console.log(recs);
```

### Từ React (fetch)

```jsx
// hooks/useRecommendations.js
import { useState, useEffect } from 'react';

const RECOMMENDER_URL = process.env.REACT_APP_RECOMMENDER_URL || 'http://localhost:8000';

export function useRecommendations(userId, userProfile) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`${RECOMMENDER_URL}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        gender: userProfile.gender || 'M',
        occupation: userProfile.occupation || 'other',
        tag: userProfile.favoriteTag || '',
        topK: 10,
        alpha: 0.7,
      }),
    })
      .then(res => res.json())
      .then(data => setMovies(data.recommendations))
      .finally(() => setLoading(false));
  }, [userId]);

  return { movies, loading };
}
```

---

## 🗄️ Mapping MovieLens ID với MongoDB

Trong database MongoDB của bạn, mỗi document phim nên có thêm field `movieLensId`:

```json
// MongoDB document
{
  "_id": "ObjectId('...')",
  "title": "Toy Story",
  "poster": "https://...",
  "description": "...",
  "movieLensId": 1        // ← ID từ MovieLens (movieId trong ratings.csv)
}
```

Trong Node.js backend, sau khi gọi API gợi ý, map kết quả với MongoDB:

```javascript
async function getEnrichedRecommendations(userId) {
  // 1. Lấy gợi ý từ Python service
  const recs = await axios.post('http://localhost:8000/recommend', {
    userId, gender: 'M', occupation: 'student', topK: 10, alpha: 0.7
  });
  
  const movieLensIds = recs.data.recommendations.map(r => r.movieId);

  // 2. Tìm thông tin chi tiết từ MongoDB theo movieLensId
  const movies = await Movie.find({ movieLensId: { $in: movieLensIds } });

  // 3. Giữ thứ tự theo score
  return movieLensIds.map(id => movies.find(m => m.movieLensId === id)).filter(Boolean);
}
```

---

## 🧪 Test API bằng script

```bash
# Server phải đang chạy trước
python tests/test_api.py
```

---

## ❓ Troubleshooting

| Lỗi | Giải pháp |
|-----|-----------|
| `ModuleNotFoundError: No module named 'surprise'` | `conda install -c conda-forge scikit-surprise -y` |
| `FileNotFoundError: Thiếu file model` | Chạy `python training/train.py` trước |
| `CompileError: co_clustering.pyx` | Dùng Python 3.10 + numpy 1.24.3 |
| `503 Service Unavailable` từ API | Model chưa load, kiểm tra file `models/` |
| `FileNotFoundError: data/users.csv` | Chạy `python training/convert_users.py` |
