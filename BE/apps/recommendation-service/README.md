# IPANMOVIE Recommendation Service

FastAPI service dung cho goi y phim cua backend IPANMOVIE.

Service nay gom hai lop:

- API noi bo cho Node.js backend: `/v1/recommendations/*` va `/v1/cache/*`.
- API truc tiep cho model Hybrid cu: `/v1/recommend`, `/v1/popular`, `/v1/recommend/genres`.

Neu chua co model trong `models/`, service van tra fallback nhe de moi truong dev cua BE/FE khong bi vo. Sau khi train, cac endpoint se dung `HybridMovieRecommender` trong `app/ml/recommender.py`.

## Chay local

File `requirements.txt` chi gom dependency can de chay API. Cach nay tuong thich Python 3.12 va service van co fallback neu chua co model ML trong `models/`.

```bash
python -m pip install -U pip setuptools wheel
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Docs: `http://127.0.0.1:8001/docs`

## Train model

Phan train model dung `requirements-ml.txt`. Tren Python 3.12 can giu `numpy<2`; neu de pip cai `numpy 2.x` thi `scikit-surprise` se loi binary compatibility.

```powershell
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -U pip setuptools wheel
pip install -r requirements-ml.txt
```

Khong chay `pip freeze > requirements.txt` trong service nay. `requirements.txt` chi danh cho runtime API; dependency train/model nam trong `requirements-ml.txt`.

Dat cac file CSV vao `data/` hoac export tu Atlas:

- `movies.csv`
- `ratings.csv`
- `tags.csv`
- `users.csv`

Sau do chay:

```bash
python training/export_atlas_dataset.py --out data
python training/evaluate.py --data data --out reports/offline_evaluation.json
python training/train.py
```

Model se duoc luu vao `models/`.

Neu `scikit-surprise` van fail khi install tren Windows, cai Microsoft C++ Build Tools hoac train bang Docker/WSL.

Co the override duong dan bang bien moi truong:

- `RECOMMENDATION_DATA_DIR`
- `RECOMMENDATION_MODEL_DIR`
- `REDIS_URL`
- `RECOMMENDATION_CACHE_TTL_SECONDS`
