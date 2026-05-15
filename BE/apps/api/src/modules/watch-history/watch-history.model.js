import mongoose from "mongoose";

const watchHistorySchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    episodeId: { type: mongoose.Schema.Types.ObjectId, ref: "Episode", default: null },
    progressSeconds: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    lastWatchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

watchHistorySchema.index({ profileId: 1, movieId: 1, episodeId: 1 }, { unique: true });
watchHistorySchema.index({ profileId: 1, lastWatchedAt: -1 });

export const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);

