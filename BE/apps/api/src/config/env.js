import dotenv from 'dotenv'
dotenv.config({ path: "../../.env" })

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGO_URI ?? "mongodb://localhost:27017/ipanmovie",
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  recommendationServiceUrl: process.env.RECOMMENDATION_SERVICE_URL ?? "http://localhost:8001",
};
console.log(env);
