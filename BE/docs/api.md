# API cơ bản

Base path: `/api/v1`

## Auth
- `POST /auth/register`
- `POST /auth/verify-otp`
- `POST /auth/resend-otp`
- `POST /auth/login`
- `GET /auth/me`
- `GET /auth/google/mock`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/google`
- `GET /auth/google/callback`

## Profiles
- `GET /profiles`
- `POST /profiles`
- `PATCH /profiles/:profileId`
- `DELETE /profiles/:profileId`
- `POST /profiles/:profileId/verify-pin`
- `GET /profiles/:profileId/recommendations`

## Movies & Search
- `GET /movies`
- `GET /movies/:movieId`
- `GET /movies/:movieId/episodes`
- `GET /movies/:movieId/similar`
- `GET /movies/discovery/trending`
- `GET /search/suggest?q=`
- `GET /search/movies?q=&genres=&year=&country=&minRating=`

## Interaction
- `GET /profiles/:profileId/watchlist`
- `POST /profiles/:profileId/watchlist/:movieId`
- `DELETE /profiles/:profileId/watchlist/:movieId`
- `PUT /profiles/:profileId/ratings/:movieId`
- `GET /profiles/:profileId/history`
- `PUT /profiles/:profileId/history/:movieId`
- `GET /movies/:movieId/comments`
- `POST /movies/:movieId/comments`
- `POST /comments/:commentId/replies`

## Admin
- `POST /admin/movies`
- `PATCH /admin/movies/:movieId`
- `DELETE /admin/movies/:movieId`
- `POST /admin/movies/:movieId/episodes`
- `GET /admin/users`
- `PATCH /admin/users/:userId/status`

## Chuẩn response

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": []
  }
}
```
