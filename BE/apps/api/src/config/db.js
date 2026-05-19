import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  try {
    const connection = await mongoose.connect(env.mongoUri);
    if (connection.connections[0].readyState === 1) {
      console.log(' MongoDB connected successfully');
    }
    return connection;
  } catch (error) {
    console.error(" error to connect mongodb", error.message);
    return null;
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  console.log(' MongoDB disconnected successfully');
}

