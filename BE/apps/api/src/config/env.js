import dotenv from 'dotenv';
dotenv.config({ path: "../.env" });

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoCluster: process.env.MONGODB_CLUSTER ?? "",
  mongoUser: process.env.MONGODB_USER ?? "",
  mongoPassword: process.env.MONGODB_PASSWORD ?? "",
  mongoAppName: process.env.MONGODB_APPNAME ?? "",
  mongoDatabase: process.env.MONGODB_DATABASE ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  recommendationServiceUrl: process.env.RECOMMENDATION_SERVICE_URL ?? "http://localhost:8001",
};