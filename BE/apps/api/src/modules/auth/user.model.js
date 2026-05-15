import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    codeHash: String,
    expiresAt: Date,
    resendCount: { type: Number, default: 0 },
    lastSentAt: Date,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: String,
    googleId: { type: String, sparse: true, unique: true },
    status: { type: String, enum: ["pending", "active", "suspended"], default: "pending" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    emailVerifiedAt: Date,
    otp: otpSchema,
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);

