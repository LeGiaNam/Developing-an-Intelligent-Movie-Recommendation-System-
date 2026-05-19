# IPANMOVIE Recommendation Service

FastAPI service dung cho goi y phim cua backend IPANMOVIE.

Service nay gom hai lop:

- API noi bo cho Node.js backend: `/v1/recommendations/*` va `/v1/cache/*`.
- API truc tiep cho model Hybrid cu: `/v1/recommend`, `/v1/popular`, `/v1/recommend/genres`.

Neu chua co model trong `models/`, service van tra fallback nhe de moi truong dev cua BE/FE khong bi vo. Sau khi train, cac endpoint se dung `HybridMovieRecommender` trong `app/ml/recommender.py`.

## Chay local

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Docs: `http://127.0.0.1:8001/docs`

## Train model

Dat cac file CSV vao `data/`:

- `movies.csv`
- `ratings.csv`
- `tags.csv`
- `users.csv`

Sau do chay:

```bash
python training/train.py
```

Model se duoc luu vao `models/`.

Co the override duong dan bang bien moi truong:

- `RECOMMENDATION_DATA_DIR`
- `RECOMMENDATION_MODEL_DIR`
- `REDIS_URL`
- `RECOMMENDATION_CACHE_TTL_SECONDS`
