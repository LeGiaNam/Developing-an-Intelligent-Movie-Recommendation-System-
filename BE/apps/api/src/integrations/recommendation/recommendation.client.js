import { env } from "../../config/env.js";

export async function getSimilarMovies(movieId) {
  const response = await fetch(`${env.recommendationServiceUrl}/v1/recommendations/similar/${movieId}`);
  if (!response.ok) {
    return [];
  }

  const body = await response.json();
  return body.items ?? [];
}

export async function getPersonalizedMovies(profileId) {
  const response = await fetch(`${env.recommendationServiceUrl}/v1/recommendations/personalized/${profileId}`);
  if (!response.ok) {
    return [];
  }

  const body = await response.json();
  return body.items ?? [];
}

export async function getTrendingMovies() {
  const response = await fetch(`${env.recommendationServiceUrl}/v1/recommendations/trending`);
  if (!response.ok) {
    return [];
  }

  const body = await response.json();
  return body.items ?? [];
}

export async function invalidateProfileRecommendations(profileId) {
  try {
    await fetch(`${env.recommendationServiceUrl}/v1/cache/invalidate/profile/${profileId}`, {
      method: "POST",
    });
  } catch {
    return;
  }
}

export async function invalidateSimilarRecommendations(movieId) {
  try {
    await fetch(`${env.recommendationServiceUrl}/v1/cache/invalidate/similar/${movieId}`, {
      method: "POST",
    });
  } catch {
    return;
  }
}

export async function invalidateTrendingRecommendations() {
  try {
    await fetch(`${env.recommendationServiceUrl}/v1/cache/invalidate/trending`, {
      method: "POST",
    });
  } catch {
    return;
  }
}

export async function invalidateAllRecommendations() {
  try {
    await fetch(`${env.recommendationServiceUrl}/v1/cache/invalidate/all`, {
      method: "POST",
    });
  } catch {
    return;
  }
}
