import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/ipanmovie",
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  recommendationServiceUrl: process.env.RECOMMENDATION_SERVICE_URL ?? "http://localhost:8001",
};

