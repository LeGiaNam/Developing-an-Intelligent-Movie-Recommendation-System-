# Thiết kế MongoDB

## Collections

### `users`
- `_id`
- `email`
- `passwordHash`
- `googleId`
- `status`: `pending | active | suspended`
- `role`: `user | admin`
- `emailVerifiedAt`
- `otp`: `{ codeHash, expiresAt, resendCount, lastSentAt }`
- `createdAt`, `updatedAt`

Indexes:
- unique `{ email: 1 }`
- sparse unique `{ googleId: 1 }`

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

Indexes:
- unique `{ movieId: 1, seasonNumber: 1, episodeNumber: 1 }`

### `watchlists`
- `_id`
- `profileId`
- `movieId`
- `createdAt`

Indexes:
- unique `{ profileId: 1, movieId: 1 }`

### `ratings`
- `_id`
- `profileId`
- `movieId`
- `score`
- `createdAt`, `updatedAt`

Indexes:
- unique `{ profileId: 1, movieId: 1 }`
- `{ movieId: 1 }`

### `comments`
- `_id`
- `profileId`
- `movieId`
- `parentCommentId`
- `content`
- `isDeleted`
- `createdAt`, `updatedAt`

Indexes:
- `{ movieId: 1, createdAt: -1 }`
- `{ profileId: 1, createdAt: -1 }`

### `watch_histories`
- `_id`
- `profileId`
- `movieId`
- `episodeId`
- `progressSeconds`
- `durationSeconds`
- `completed`
- `lastWatchedAt`

Indexes:
- unique `{ profileId: 1, movieId: 1, episodeId: 1 }`
- `{ profileId: 1, lastWatchedAt: -1 }`

## Vì sao MongoDB hợp lý ở đây?

- Metadata phim linh hoạt, dễ chứa mảng `genres`, `cast`, `directors`, `videoSources`.
- Profile, watchlist, interaction tăng trưởng nhanh và schema có thể tiến hóa.
- Dễ kết hợp Atlas Search cho fuzzy search/autosuggest trước khi cần search engine riêng.

## Nguyên tắc dữ liệu

- `movies` dùng `isDeleted` để soft delete.
- Dữ liệu tương tác (`ratings`, `watch_histories`) tách collection riêng để phục vụ RS.
- Không nhúng watchlist/rating vào `profiles`, vì các tập dữ liệu này tăng không giới hạn và cần index riêng.
