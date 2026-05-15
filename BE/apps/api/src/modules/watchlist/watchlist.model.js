import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
  },
  { timestamps: true }
);

watchlistSchema.index({ profileId: 1, movieId: 1 }, { unique: true });

export const Watchlist = mongoose.model("Watchlist", watchlistSchema);

