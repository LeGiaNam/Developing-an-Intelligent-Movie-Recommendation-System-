import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { connectDatabase } from '../config/db.js';
import { env } from '../config/env.js';

// ==========================================
// 1. Mongoose Schemas & Models Definition
// ==========================================

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: { type: String },
  auth_type: { type: String, enum: ['email', 'google'] },
  status: { type: String, enum: ['active', 'pending'] },
  created_at: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const profileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  profile_name: { type: String },
  avatar_url: { type: String },
  is_kids: { type: Boolean },
  pin_code: { type: String, default: null },
  watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }]
});
const Profile = mongoose.model('Profile', profileSchema);

const movieSchema = new mongoose.Schema({
  title: String,
  slug: String,
  description: String,
  backdrop_url: String,
  poster_url: String,
  trailer_url: String,
  directors: [String],
  casts: [String],
  genres: [String],
  release_year: Number,
  country: String,
  rating_avg: Number,
  is_series: Boolean,
  episodes: [{
    episode_number: Number,
    title: String,
    video_url: String,
    duration: Number
  }],
  is_deleted: { type: Boolean, default: false }
});
const Movie = mongoose.model('Movie', movieSchema);

const commentSchema = new mongoose.Schema({
  movie_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
  profile_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  profile_name: String,
  content: String,
  replies: [{
    profile_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    profile_name: String,
    content: String,
    created_at: { type: Date, default: Date.now }
  }]
});
const Comment = mongoose.model('Comment', commentSchema);

const ratingSchema = new mongoose.Schema({
  movie_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
  profile_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  score: Number
});
const Rating = mongoose.model('Rating', ratingSchema);

const searchLogSchema = new mongoose.Schema({
  keyword: String,
  profile_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  results_count: Number
});
const SearchLog = mongoose.model('SearchLog', searchLogSchema);

// ==========================================
// 2. Main Seeding Function
// ==========================================

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDatabase();
    console.log('Connected successfully!');

    // Cleanup Step
    console.log('Cleaning up existing data...');
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Movie.deleteMany({});
    await Comment.deleteMany({});
    await Rating.deleteMany({});
    await SearchLog.deleteMany({});
    console.log('Cleanup completed.');
 
    // Arrays to hold mock data
    const users = [];
    const profiles = [];
    const movies = [];
    const comments = [];
    const ratings = [];
    const searchLogs = [];

    console.log('Generating Mock Data...');

    // Generate 100 Users
    for (let i = 0; i < 100; i++) {
      const authType = faker.helpers.arrayElement(['email', 'google']);
      users.push({
        _id: new mongoose.Types.ObjectId(),
        email: faker.internet.email({ provider: faker.helpers.arrayElement(['gmail.com', 'yahoo.com']) }),
        password: authType === 'email' ? `$2b$10$${faker.string.alphanumeric(43)}` : '', // Mock hashed password
        auth_type: authType,
        status: faker.helpers.arrayElement(['active', 'pending']),
        created_at: faker.date.past({ years: 2 })
      });
    }

    // Generate 100 Profiles (1 per User to strictly meet the 100 profiles constraint)
    for (let i = 0; i < 100; i++) {
      const isKids = faker.datatype.boolean();
      profiles.push({
        _id: new mongoose.Types.ObjectId(),
        user_id: users[i]._id,
        profile_name: faker.person.firstName(),
        avatar_url: faker.image.avatar(), // Using faker dummy image
        is_kids: isKids,
        pin_code: !isKids && faker.datatype.boolean() ? faker.string.numeric(4) : null,
        watchlist: [] // Will populate after movies are created
      });
    }

    // Generate 100 Movies
    const genresList = ['Action', 'Comedy', 'Sci-Fi', 'Horror', 'Romance', 'Drama', 'Documentary', 'Animation', 'Thriller'];
    const countriesList = ['USA', 'Vietnam', 'Korea', 'UK', 'Japan', 'France'];

    for (let i = 0; i < 100; i++) {
      const isSeries = faker.datatype.boolean();
      const numEpisodes = isSeries ? faker.number.int({ min: 5, max: 24 }) : 0;
      const episodes = [];

      if (isSeries) {
        for (let j = 1; j <= numEpisodes; j++) {
          episodes.push({
            episode_number: j,
            title: `Episode ${j}: ${faker.lorem.words({ min: 2, max: 5 })}`,
            video_url: `https://www.youtube.com/watch?v=${faker.string.alphanumeric(11)}`,
            duration: faker.number.int({ min: 20, max: 60 }) // duration in minutes
          });
        }
      }

      movies.push({
        _id: new mongoose.Types.ObjectId(),
        title: faker.lorem.words({ min: 1, max: 4 }),
        slug: faker.lorem.slug(),
        description: faker.lorem.paragraph(),
        backdrop_url: faker.image.urlLoremFlickr({ category: 'city' }),
        poster_url: faker.image.urlLoremFlickr({ category: 'movie' }),
        trailer_url: `https://www.youtube.com/watch?v=${faker.string.alphanumeric(11)}`,
        directors: Array.from({ length: faker.number.int({ min: 1, max: 2 }) }, () => faker.person.fullName()),
        casts: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => faker.person.fullName()),
        genres: faker.helpers.arrayElements(genresList, faker.number.int({ min: 1, max: 3 })),
        release_year: faker.number.int({ min: 2010, max: 2026 }),
        country: faker.helpers.arrayElement(countriesList),
        rating_avg: faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }),
        is_series: isSeries,
        episodes: episodes,
        is_deleted: false
      });
    }

    // Populate profile watchlists now that we have movies
    for (let i = 0; i < 100; i++) {
      const numWatchlist = faker.number.int({ min: 0, max: 10 });
      const watchlistMovies = faker.helpers.arrayElements(movies, numWatchlist);
      profiles[i].watchlist = watchlistMovies.map(m => m._id);
    }

    // Generate 100 Comments
    for (let i = 0; i < 100; i++) {
      const randomMovie = faker.helpers.arrayElement(movies);
      const randomProfile = faker.helpers.arrayElement(profiles);

      const numReplies = faker.number.int({ min: 0, max: 3 });
      const replies = [];
      for (let j = 0; j < numReplies; j++) {
        const replyProfile = faker.helpers.arrayElement(profiles);
        replies.push({
          profile_id: replyProfile._id,
          profile_name: replyProfile.profile_name,
          content: faker.lorem.sentence(),
          created_at: faker.date.recent({ days: 30 })
        });
      }

      comments.push({
        _id: new mongoose.Types.ObjectId(),
        movie_id: randomMovie._id,
        profile_id: randomProfile._id,
        profile_name: randomProfile.profile_name,
        content: faker.lorem.sentences({ min: 1, max: 3 }),
        replies: replies
      });
    }

    // Generate 100 Ratings
    for (let i = 0; i < 100; i++) {
      const randomMovie = faker.helpers.arrayElement(movies);
      const randomProfile = faker.helpers.arrayElement(profiles);

      ratings.push({
        _id: new mongoose.Types.ObjectId(),
        movie_id: randomMovie._id,
        profile_id: randomProfile._id,
        score: faker.number.int({ min: 1, max: 5 })
      });
    }

    // Generate 100 SearchLogs
    const popularKeywords = ['Batman', 'Avenger', 'Action', 'Comedy', 'Love', 'War', 'Space', 'Zombie', 'Spiderman', 'Matrix'];
    for (let i = 0; i < 100; i++) {
      const randomProfile = faker.helpers.arrayElement(profiles);

      searchLogs.push({
        _id: new mongoose.Types.ObjectId(),
        keyword: faker.helpers.arrayElement(popularKeywords),
        profile_id: randomProfile._id,
        results_count: faker.number.int({ min: 0, max: 50 })
      });
    }

    // Insert Data using insertMany for high performance
    console.log('Inserting Users...');
    await User.insertMany(users);
    console.log(`Inserted ${users.length} Users.`);

    console.log('Inserting Profiles...');
    await Profile.insertMany(profiles);
    console.log(`Inserted ${profiles.length} Profiles.`);

    console.log('Inserting Movies...');
    await Movie.insertMany(movies);
    console.log(`Inserted ${movies.length} Movies.`);

    console.log('Inserting Comments...');
    await Comment.insertMany(comments);
    console.log(`Inserted ${comments.length} Comments.`);

    console.log('Inserting Ratings...');
    await Rating.insertMany(ratings);
    console.log(`Inserted ${ratings.length} Ratings.`);

    console.log('Inserting SearchLogs...');
    await SearchLog.insertMany(searchLogs);
    console.log(`Inserted ${searchLogs.length} SearchLogs.`);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
  } finally {
    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

seedDatabase();
