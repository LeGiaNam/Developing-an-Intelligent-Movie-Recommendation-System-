import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

function buildMongoUri() {
  const directUri = process.env.MONGO_URI ?? process.env.MONGODB_URI;
  if (directUri) {
    return directUri;
  }

  const cluster = process.env.MONGODB_CLUSTER;
  const user = process.env.MONGODB_USER;
  const password = process.env.MONGODB_PASSWORD;
  const database = process.env.MONGODB_DATABASE;
  if (cluster && user && password && database) {
    const encodedPassword = encodeURIComponent(password);
    const appName = process.env.MONGODB_APPNAME ? `?appName=${process.env.MONGODB_APPNAME}` : "";
    return `mongodb+srv://${user}:${encodedPassword}@${cluster}/${database}${appName}`;
  }

  return "mongodb://localhost:27017/ipanmovie";
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: buildMongoUri(),
  mongoCluster: process.env.MONGODB_CLUSTER ?? "",
  mongoUser: process.env.MONGODB_USER ?? "",
  mongoPassword: process.env.MONGODB_PASSWORD ?? "",
  mongoAppName: process.env.MONGODB_APPNAME ?? "",
  mongoDatabase: process.env.MONGODB_DATABASE ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  recommendationServiceUrl: process.env.RECOMMENDATION_SERVICE_URL ?? "http://localhost:8001",
  rateLimitMax: Number(process.env.API_RATE_LIMIT_MAX ?? 300),
  rateLimitWindow: process.env.API_RATE_LIMIT_WINDOW ?? "1 minute",
};


console.log("Environment Variables:");
console.log(`PORT: ${env.port}`);
console.log(`MONGO_URI: ${env.mongoUri}`);
console.log(`MONGODB_CLUSTER: ${env.mongoCluster}`);
console.log(`MONGODB_USER: ${env.mongoUser}`);
console.log(`MONGODB_PASSWORD: ${env.mongoPassword ? "***" : ""}`);
console.log(`MONGODB_APPNAME: ${env.mongoAppName}`);
console.log(`MONGODB_DATABASE: ${env.mongoDatabase}`);
console.log(`JWT_SECRET: ${env.jwtSecret}`);
console.log(`RECOMMENDATION_SERVICE_URL: ${env.recommendationServiceUrl}`);
console.log(`API_RATE_LIMIT_MAX: ${env.rateLimitMax}`);
console.log(`API_RATE_LIMIT_WINDOW: ${env.rateLimitWindow}`);
