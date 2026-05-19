import mongoose from "mongoose";

const recommendationEventSchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", default: null },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    eventType: { type: String, enum: ["impression", "click", "play"], required: true },
    variant: { type: String, enum: ["control", "recommendation"], default: "recommendation" },
    source: { type: String, default: "home_popup" },
    sessionId: { type: String, default: "" },
    score: { type: Number, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

recommendationEventSchema.index({ createdAt: -1 });
recommendationEventSchema.index({ profileId: 1, eventType: 1, createdAt: -1 });
recommendationEventSchema.index({ movieId: 1, eventType: 1, createdAt: -1 });

export const RecommendationEvent = mongoose.model("RecommendationEvent", recommendationEventSchema);
