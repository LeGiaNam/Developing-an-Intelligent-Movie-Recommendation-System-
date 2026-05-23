import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
    content: { type: String, maxlength: 500, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Profile" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Profile" }],
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: "Profile" }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ movieId: 1, createdAt: -1 });
commentSchema.index({ profileId: 1, createdAt: -1 });

export const Comment = mongoose.model("Comment", commentSchema);

