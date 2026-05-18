import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    score: { type: Number, min: 1, max: 5, required: true },
  },
  { timestamps: true }
);

ratingSchema.index({ profileId: 1, movieId: 1 }, { unique: true });

export const Rating = mongoose.model("Rating", ratingSchema);

