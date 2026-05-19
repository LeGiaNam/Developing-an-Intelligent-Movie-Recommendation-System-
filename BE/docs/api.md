# API Reference

Base path: `/api/v1`

Responses follow:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Errors follow:

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

## Auth

- `POST /auth/register` - create an email/password account, create a default profile, and return an access token.
- `POST /auth/login` - sign in with email/password and return an access token.
- `GET /auth/me` - return the current user and profiles.

The current auth flow is limited to email/password sign-in plus JWT session handling.

## Profiles

- `GET /profiles`
- `POST /profiles`
- `PATCH /profiles/:profileId`
- `DELETE /profiles/:profileId`
- `POST /profiles/:profileId/verify-pin`
- `GET /profiles/:profileId/recommendations`

## Movies And Search

- `GET /movies`
- `GET /movies/:movieId`
- `GET /movies/:movieId/episodes`
- `GET /movies/:movieId/similar`
- `GET /movies/discovery/trending`
- `GET /search/suggest?q=`
- `GET /search/movies?q=&genres=&year=&country=&minRating=`

## User Interaction

- `GET /profiles/:profileId/watchlist`
- `POST /profiles/:profileId/watchlist/:movieId`
- `DELETE /profiles/:profileId/watchlist/:movieId`
- `PUT /profiles/:profileId/ratings/:movieId`
- `GET /profiles/:profileId/history`
- `PUT /profiles/:profileId/history/:movieId`
- `GET /movies/:movieId/comments`
- `POST /movies/:movieId/comments`
- `POST /comments/:commentId/replies`
- `POST /recommendation-events`
- `GET /recommendation-events/summary`

## Admin

- `POST /admin/movies`
- `PATCH /admin/movies/:movieId`
- `DELETE /admin/movies/:movieId`
- `POST /admin/movies/:movieId/episodes`
- `GET /admin/users`
- `PATCH /admin/users/:userId/status`
