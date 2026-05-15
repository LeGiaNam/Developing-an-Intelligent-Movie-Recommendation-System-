# IPANMOVIE Backend

Backend được tổ chức theo hướng **modular backend + recommendation service riêng**:

- `apps/api`: Node.js/Fastify API phục vụ auth, profile, movie catalog, search, watchlist, rating, comment, admin.
- `apps/recommendation-service`: FastAPI service độc lập để tích hợp code Recommendation System hiện có về sau.
- `Redis`: cache kết quả recommendation để giảm thời gian phản hồi cho các truy vấn lặp lại.
- `docs`: tài liệu kiến trúc, database và API.

## Chạy local

```bash
docker compose up --build
```

Hoặc chạy từng service:

```bash
cd apps/api
npm install
npm run dev
```

```bash
cd apps/recommendation-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Redis local mặc định:

```bash
redis://localhost:6379/0
```

Các cache RS hiện có:

- `similar`: theo `movieId`
- `personalized`: theo `profileId`
- `trending`: toàn hệ thống

Khi user `rating` hoặc cập nhật `watch history`, backend sẽ gọi sang RS để xóa cache liên quan trước khi lần đọc tiếp theo được tính lại.

## Seed dữ liệu demo

```bash
cd apps/api
npm run seed
```

Tài khoản demo:

- Admin: `admin@ipanmovie.local` / `Password@123`
- User: `user@ipanmovie.local` / `Password@123`

Mock Google login:

- `GET /api/v1/auth/google/mock`

## Cổng mặc định

- API backend: `http://localhost:4000`
- Recommendation service: `http://localhost:8001`
- MongoDB: `mongodb://localhost:27017/ipanmovie`
- Redis: `redis://localhost:6379/0`
