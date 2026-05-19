import mongoose from "mongoose";
import { env } from "./env.js";

const getConnectionString = () => {
  const { mongoUser, mongoPassword, mongoCluster, mongoAppName, mongoDatabase } = env;
  const encodedPassword = encodeURIComponent(mongoPassword);
  return `mongodb+srv://${mongoUser}:${encodedPassword}@${mongoCluster}/${mongoDatabase}?appName=${mongoAppName}`;
}

export async function connectDatabase() {
  try {
    const connectionString = getConnectionString();
    const connection = await mongoose.connect(connectionString);
    if (connection.connections[0].readyState === 1) {
      console.log('✅✅✅ MongoDB connected successfully');
    }
    return connection;
  } catch (error) {
    console.error("❌❌❌ error to connect mongodb");
    return null;
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  console.log('✅✅✅ MongoDB disconnected successfully');
}

