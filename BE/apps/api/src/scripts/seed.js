import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import { User } from "../modules/auth/user.model.js";
import { Profile } from "../modules/profiles/profile.model.js";
import { Movie } from "../modules/movies/movie.model.js";
import { Episode } from "../modules/movies/episode.model.js";
import { Watchlist } from "../modules/watchlist/watchlist.model.js";
import { Rating } from "../modules/ratings/rating.model.js";
import { Comment } from "../modules/comments/comment.model.js";
import { WatchHistory } from "../modules/watch-history/watch-history.model.js";
import { normalizeText } from "../common/utils/normalizeText.js";

await connectDatabase();

await Promise.all([
  User.deleteMany({}),
  Profile.deleteMany({}),
  Movie.deleteMany({}),
  Episode.deleteMany({}),
  Watchlist.deleteMany({}),
  Rating.deleteMany({}),
  Comment.deleteMany({}),
  WatchHistory.deleteMany({}),
]);

const passwordHash = await bcrypt.hash("Password@123", 12);
const [admin, user] = await User.create([
  { email: "admin@ipanmovie.local", passwordHash, status: "active", role: "admin", emailVerifiedAt: new Date() },
  { email: "user@ipanmovie.local", passwordHash, status: "active", role: "user", emailVerifiedAt: new Date() },
]);

const [adminProfile, alexProfile, kidsProfile] = await Profile.create([
  { userId: admin._id, name: "Admin" },
  { userId: user._id, name: "Alex", avatarUrl: "https://example.com/alex.png" },
  { userId: user._id, name: "Kids", isKids: true, avatarUrl: "https://example.com/kids.png" },
]);

const moviePayloads = [
  {
    title: "Neon Horizons",
    slug: "neon-horizons",
    description: "A cyberpunk thriller about a city that remembers everything.",
    type: "movie",
    genres: ["Sci-Fi", "Thriller"],
    countries: ["USA"],
    releaseYear: 2026,
    cast: ["Lena Park", "Ivo Chen"],
    directors: ["Mira Sol"],
    ageRating: "PG-13",
  },
  {
    title: "Echoes of Eternity",
    slug: "echoes-of-eternity",
    description: "A rogue archivist uncovers a memory that can save humanity.",
    type: "movie",
    genres: ["Adventure", "Sci-Fi"],
    countries: ["USA"],
    releaseYear: 2026,
    cast: ["Aria Moon", "Kai Rivers"],
    directors: ["T. Nguyen"],
    ageRating: "PG-13",
  },
  {
    title: "The Silent Protocol",
    slug: "the-silent-protocol",
    description: "A conspiracy series where every signal hides another truth.",
    type: "series",
    genres: ["Thriller", "Mystery"],
    countries: ["UK"],
    releaseYear: 2025,
    cast: ["Nora Vale", "Ethan Cross"],
    directors: ["S. Carter"],
    ageRating: "TV-14",
  },
].map((movie) => ({ ...movie, normalizedTitle: normalizeText(movie.title) }));

const [neon, echoes, silent] = await Movie.create(moviePayloads);

await Episode.create([
  { movieId: silent._id, seasonNumber: 1, episodeNumber: 1, title: "Handshake", durationSeconds: 2700 },
  { movieId: silent._id, seasonNumber: 1, episodeNumber: 2, title: "Dead Air", durationSeconds: 2800 },
]);

await Watchlist.create([{ profileId: alexProfile._id, movieId: echoes._id }]);
await Rating.create([
  { profileId: alexProfile._id, movieId: neon._id, score: 5 },
  { profileId: kidsProfile._id, movieId: echoes._id, score: 4 },
]);
await Movie.findByIdAndUpdate(neon._id, { averageRating: 5, ratingCount: 1 });
await Movie.findByIdAndUpdate(echoes._id, { averageRating: 4, ratingCount: 1 });
await Comment.create([
  { profileId: alexProfile._id, movieId: neon._id, content: "Visual quá đã, nhịp phim rất chắc." },
]);
await WatchHistory.create([
  {
    profileId: alexProfile._id,
    movieId: silent._id,
    progressSeconds: 1200,
    durationSeconds: 2700,
    completed: false,
    lastWatchedAt: new Date(),
  },
]);

console.log("Seed complete");
console.log({
  admin: "admin@ipanmovie.local / Password@123",
  user: "user@ipanmovie.local / Password@123",
  profiles: {
    adminProfile: adminProfile._id.toString(),
    alexProfile: alexProfile._id.toString(),
    kidsProfile: kidsProfile._id.toString(),
  },
});

await mongoose.disconnect();
