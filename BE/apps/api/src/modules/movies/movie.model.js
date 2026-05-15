import mongoose from "mongoose";

const videoSourceSchema = new mongoose.Schema(
  {
    quality: String,
    url: String,
  },
  { _id: false }
);

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    normalizedTitle: { type: String, index: true },
    description: String,
    type: { type: String, enum: ["movie", "series"], default: "movie" },
    genres: [String],
    countries: [String],
    releaseYear: Number,
    cast: [String],
    directors: [String],
    ageRating: String,
    posterUrl: String,
    backdropUrl: String,
    trailerUrl: String,
    videoSources: [videoSourceSchema],
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

movieSchema.index({ title: "text", cast: "text", directors: "text" });
movieSchema.index({ genres: 1, releaseYear: -1, averageRating: -1 });
movieSchema.index({ countries: 1, releaseYear: -1, averageRating: -1 });

export const Movie = mongoose.model("Movie", movieSchema);
