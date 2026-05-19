import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { User } from "../modules/auth/user.model.js";
import { Profile } from "../modules/profiles/profile.model.js";
import { Movie } from "../modules/movies/movie.model.js";
import { Episode } from "../modules/movies/episode.model.js";
import { Watchlist } from "../modules/watchlist/watchlist.model.js";
import { Rating } from "../modules/ratings/rating.model.js";
import { Comment } from "../modules/comments/comment.model.js";
import { WatchHistory } from "../modules/watch-history/watch-history.model.js";
import { normalizeText } from "../common/utils/normalizeText.js";

const posterImages = [
  "https://images.unsplash.com/photo-1485846234645-a62644f84728",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1",
  "https://images.unsplash.com/photo-1517602302552-471fe67acf66",
  "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4",
];

const backdropImages = [
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d",
  "https://images.unsplash.com/photo-1520034475321-cbe63696469a",
  "https://images.unsplash.com/photo-1518709268805-4e9042af2176",
];

function imageFrom(list, index) {
  return `${list[index % list.length]}?auto=format&fit=crop&w=900&q=80`;
}

async function seedDatabase() {
  await connectDatabase();

  console.log("Cleaning up existing data...");
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
  console.log("Cleanup completed.");

  const passwordHash = await bcrypt.hash("Password@123", 12);
  const [admin, user] = await User.create([
    { email: "admin@ipanmovie.local", passwordHash, status: "active", role: "admin" },
    { email: "user@ipanmovie.local", passwordHash, status: "active", role: "user" },
  ]);

  const [adminProfile, mainProfile, kidsProfile] = await Profile.create([
    { userId: admin._id, name: "Admin" },
    { userId: user._id, name: "Alex", avatarUrl: "https://i.pravatar.cc/240?img=12" },
    { userId: user._id, name: "Kids", isKids: true, avatarUrl: "https://i.pravatar.cc/240?img=33" },
  ]);

  const genresList = ["Action", "Comedy", "Sci-Fi", "Horror", "Romance", "Drama", "Documentary", "Animation", "Thriller"];
  const countriesList = ["USA", "Vietnam", "Korea", "UK", "Japan", "France"];

  const movies = Array.from({ length: 60 }, (_, index) => {
    const title = faker.helpers.arrayElement([
      "Neon Horizons",
      "Echoes of Eternity",
      "The Silent Protocol",
      "Realms of Valor",
      "Dune Walkers",
      "The Room Beyond",
      faker.word.words({ count: { min: 2, max: 4 } }),
    ]);
    const type = faker.helpers.arrayElement(["movie", "series"]);
    const releaseYear = faker.number.int({ min: 2010, max: 2026 });
    const averageRating = faker.number.float({ min: 3.1, max: 5, precision: 0.1 });

    return {
      _id: new mongoose.Types.ObjectId(),
      title: `${title} ${index + 1}`,
      slug: faker.helpers.slugify(`${title}-${index + 1}`).toLowerCase(),
      normalizedTitle: normalizeText(`${title} ${index + 1}`),
      description: faker.lorem.paragraph(),
      type,
      genres: faker.helpers.arrayElements(genresList, faker.number.int({ min: 1, max: 3 })),
      countries: faker.helpers.arrayElements(countriesList, faker.number.int({ min: 1, max: 2 })),
      releaseYear,
      cast: Array.from({ length: 4 }, () => faker.person.fullName()),
      directors: Array.from({ length: 1 }, () => faker.person.fullName()),
      ageRating: faker.helpers.arrayElement(["PG", "PG-13", "TV-14", "R"]),
      posterUrl: imageFrom(posterImages, index),
      backdropUrl: imageFrom(backdropImages, index),
      trailerUrl: `https://www.youtube.com/watch?v=${faker.string.alphanumeric(11)}`,
      averageRating,
      ratingCount: faker.number.int({ min: 10, max: 1000 }),
      isDeleted: false,
    };
  });

  await Movie.insertMany(movies);

  const series = movies.filter((movie) => movie.type === "series").slice(0, 10);
  await Episode.insertMany(
    series.flatMap((movie) =>
      Array.from({ length: 4 }, (_, index) => ({
        movieId: movie._id,
        seasonNumber: 1,
        episodeNumber: index + 1,
        title: `Episode ${index + 1}: ${faker.lorem.words({ min: 2, max: 4 })}`,
        durationSeconds: faker.number.int({ min: 1200, max: 3600 }),
        videoSources: [{ quality: "1080p", url: `https://example.com/videos/${movie.slug}-${index + 1}.mp4` }],
      }))
    )
  );

  await Watchlist.insertMany(
    movies.slice(0, 8).map((movie) => ({ profileId: mainProfile._id, movieId: movie._id }))
  );

  await Rating.insertMany(
    movies.slice(0, 20).map((movie) => ({
      profileId: faker.helpers.arrayElement([mainProfile._id, kidsProfile._id, adminProfile._id]),
      movieId: movie._id,
      score: faker.number.int({ min: 3, max: 5 }),
    }))
  );

  await Comment.insertMany(
    movies.slice(0, 12).map((movie) => ({
      profileId: mainProfile._id,
      movieId: movie._id,
      content: faker.lorem.sentence(),
    }))
  );

  await WatchHistory.insertMany(
    movies.slice(10, 16).map((movie) => ({
      profileId: mainProfile._id,
      movieId: movie._id,
      progressSeconds: faker.number.int({ min: 300, max: 3600 }),
      durationSeconds: 5400,
      completed: false,
      lastWatchedAt: faker.date.recent({ days: 20 }),
    }))
  );

  console.log("Database seeding completed successfully!");
  console.log({
    admin: "admin@ipanmovie.local / Password@123",
    user: "user@ipanmovie.local / Password@123",
    movies: movies.length,
    profiles: 3,
  });
}

try {
  await seedDatabase();
} finally {
  await disconnectDatabase();
}
