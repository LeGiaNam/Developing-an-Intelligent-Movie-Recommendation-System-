import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    avatarUrl: String,
    pinHash: String,
    isKids: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Profile = mongoose.model("Profile", profileSchema);

