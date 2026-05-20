import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

function buildMongoUri() {
  const directUri = process.env.MONGO_URI ?? process.env.MONGODB_URI;
  if (directUri) {
    if (isLocalMongoUri(directUri)) {
      throw new Error("MongoDB local URLs are not allowed. Configure MongoDB Atlas instead.");
    }
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

  throw new Error("MongoDB Atlas configuration is required. Set MONGODB_URI or MONGODB_CLUSTER/MONGODB_USER/MONGODB_PASSWORD/MONGODB_DATABASE.");
}

function isLocalMongoUri(uri) {
  return /mongodb(?:\+srv)?:\/\/(?:[^@/]+@)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0|host\.docker\.internal)(?::|\/|$)/i.test(uri);
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
