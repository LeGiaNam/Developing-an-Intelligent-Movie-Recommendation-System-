import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/?retryWrites=true&w=majority&appName=${process.env.MONGODB_APPNAME}`;

async function count() {
  try {
    await mongoose.connect(uri, { dbName: process.env.MONGODB_DATABASE });
    const db = mongoose.connection.db;
    const total = await db.collection("movies").countDocuments({ isDeleted: false });
    const movies = await db.collection("movies").countDocuments({ isDeleted: false, type: "movie" });
    const series = await db.collection("movies").countDocuments({ isDeleted: false, type: "series" });
    console.log(`Total active movies/series: ${total}`);
    console.log(`- Movies (Phim lẻ): ${movies}`);
    console.log(`- TV Series (Phim bộ): ${series}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

count();
