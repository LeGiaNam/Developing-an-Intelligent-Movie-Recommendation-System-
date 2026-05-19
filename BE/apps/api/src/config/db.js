import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
const connection =  await mongoose.connect(env.mongoUri);
console.log(connection);
}