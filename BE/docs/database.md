# MongoDB Design

MongoDB Atlas is the source database for the application.

## Collections

### `users`

- `_id`
- `email`
- `passwordHash`
- `status`: `active | suspended`
- `role`: `user | admin`
- `createdAt`, `updatedAt`

Indexes:

- unique `{ email: 1 }`

### `profiles`

- `_id`
- `userId`
- `name`
- `avatarUrl`
- `pinHash`
- `isKids`
- `createdAt`, `updatedAt`

Indexes:

- `{ userId: 1 }`

### `movies`

- `_id`
- `title`
- `slug`
- `normalizedTitle`
- `description`
- `type`: `movie | series`
- `genres`
- `countries`
- `releaseYear`
- `cast`
- `directors`
- `ageRating`
- `posterUrl`
- `backdropUrl`
- `trailerUrl`
- `videoSources`
- `averageRating`
- `ratingCount`
- `isDeleted`
- `createdAt`, `updatedAt`

Indexes:

- unique `{ slug: 1 }`
- text index `{ title: "text", cast: "text", directors: "text" }`
- `{ genres: 1, releaseYear: -1, averageRating: -1 }`
- `{ countries: 1, releaseYear: -1, averageRating: -1 }`

### `episodes`

- `_id`
- `movieId`
- `seasonNumber`
- `episodeNumber`
- `title`
- `durationSeconds`
- `videoSources`
- `createdAt`, `updatedAt`

### Interaction Collections

- `watchlists`
- `ratings`
- `comments`
- `watch_histories`
- `recommendation_events`

These collections store user interaction data for watchlist, rating, comments, history, recommendation metrics, and future model training.

## Data Rules

- Use `isDeleted` for soft delete on movies.
- Keep interaction data in separate collections so they can scale and be indexed independently.
- Do not embed unbounded watchlist, rating, or history arrays inside profiles.
