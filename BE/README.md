# IPANMOVIE Backend

Backend is organized as a modular Node.js API plus a separate FastAPI Recommendation Service.

- `apps/api`: Fastify API for auth, profiles, movie catalog, search, watchlist, rating, comments, admin, and recommendation integration.
- `apps/recommendation-service`: FastAPI service for the recommendation model and ranking logic.
- `docs`: architecture, database, and API notes.

## Local Run

Run all backend services:

```bash
docker compose up --build
```

Run the Node API only:

```bash
cd apps/api
npm install
npm run dev
```

Run the Recommendation Service only:

```bash
cd apps/recommendation-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Seed Demo Data

```bash
cd apps/api
npm run seed
```

Demo accounts:

- Admin: `admin@gmail.com` / `Admin@123`
- User: `user@ipanmovie.local` / `Password@123`

## Auth

Auth currently uses email/password only.

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

Register creates an active user and a default profile, then returns an access token. External provider sign-in and separate email confirmation flows are intentionally not part of the current flow.

## Default Ports

- API backend: `http://localhost:4000`
- Recommendation service: `http://localhost:8001`
- Redis: `redis://localhost:6379/0`

MongoDB is configured through `MONGODB_URI`. For this project, use the Atlas connection string from the environment instead of a hardcoded local MongoDB URL.
