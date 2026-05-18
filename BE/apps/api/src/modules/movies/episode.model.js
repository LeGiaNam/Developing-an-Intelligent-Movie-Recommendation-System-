import mongoose from "mongoose";

const episodeSchema = new mongoose.Schema(
  {
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true, index: true },
    seasonNumber: Number,
    episodeNumber: Number,
    title: String,
    durationSeconds: Number,
    videoSources: [{ quality: String, url: String }],
  },
  { timestamps: true }
);

episodeSchema.index({ movieId: 1, seasonNumber: 1, episodeNumber: 1 }, { unique: true });

export const Episode = mongoose.model("Episode", episodeSchema);

