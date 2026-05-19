import { getToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const API_PREFIX = "/api/v1";
const MOVIES_CACHE_KEY = "ipanmovie.movies";
const PROFILE_CACHE_KEY = "ipanmovie.profiles";

export function mapMovie(movie) {
  if (!movie) return null;
  const genres = Array.isArray(movie.genres) ? movie.genres : String(movie.genres ?? "").split("|").filter(Boolean);
  return {
    id: movie._id ?? movie.id ?? movie.movie_id ?? movie.movieId,
    slug: movie.slug,
    title: movie.title ?? "Untitled",
    genre: genres[0] ?? "Movie",
    genres,
    year: movie.releaseYear ?? movie.year ?? "",
    rating: Number(movie.averageRating ?? movie.rating ?? movie.score ?? 0).toFixed(1),
    duration: movie.type === "series" ? "Series" : "Movie",
    image: movie.posterUrl || movie.backdropUrl || "",
    backdropUrl: movie.backdropUrl || movie.posterUrl || "",
    description: movie.description ?? "",
    raw: movie,
  };
}

export function mapProfile(profile) {
  if (!profile) return null;
  return {
    id: profile._id ?? profile.id,
    name: profile.name ?? "Profile",
    image: profile.avatarUrl || "",
    isKids: Boolean(profile.isKids),
    raw: profile,
  };
}

async function request(path, options = {}) {
  const token = options.token ?? getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    ...options,
    headers,
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const message = payload.error?.message ?? `Request failed: ${response.status}`;
    const error = new Error(message);
    error.code = payload.error?.code;
    error.details = payload.error?.details;
    throw error;
  }
  return payload.data ?? payload;
}

function readCache(key, mapper) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw).map(mapper).filter(Boolean);
  } catch {
    return [];
  }
}

function writeCache(key, items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function getCachedMovies() {
  return readCache(MOVIES_CACHE_KEY, mapMovie);
}

export function getCachedProfiles() {
  return readCache(PROFILE_CACHE_KEY, mapProfile);
}

export async function loadMovies() {
  const items = await api.movies();
  writeCache(MOVIES_CACHE_KEY, items);
  return items.map(mapMovie).filter(Boolean);
}

export async function loadProfiles(token) {
  const data = await api.me(token);
  writeCache(PROFILE_CACHE_KEY, data.profiles ?? []);
  return { ...data, profiles: (data.profiles ?? []).map(mapProfile).filter(Boolean) };
}

export const api = {
  async login(email, password) {
    return request("/auth/login", { method: "POST", body: { email, password }, token: null });
  },
  async register(email, password, profileName) {
    return request("/auth/register", { method: "POST", body: { email, password, profileName }, token: null });
  },
  async me(token) {
    return request("/auth/me", { token });
  },
  async profiles(token) {
    return request("/profiles", { token });
  },
  async createProfile(profile, token) {
    return request("/profiles", { method: "POST", body: profile, token });
  },
  async movies() {
    return request("/movies");
  },
  async movie(movieId) {
    return request(`/movies/${movieId}`);
  },
  async similarMovies(movieId) {
    return request(`/movies/${movieId}/similar`);
  },
  async episodes(movieId) {
    return request(`/movies/${movieId}/episodes`);
  },
  async trending() {
    return request("/movies/discovery/trending");
  },
  async similar(movieId) {
    return request(`/movies/${movieId}/similar`);
  },
  async searchMovies(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) search.set(key, value);
    });
    return request(`/search/movies?${search.toString()}`);
  },
  async personalized(profileId, token) {
    return request(`/profiles/${profileId}/recommendations`, { token });
  },
  async trackRecommendationEvent(event) {
    return request("/recommendation-events", { method: "POST", body: event, token: null });
  },
  async watchlist(profileId, token) {
    return request(`/profiles/${profileId}/watchlist`, { token });
  },
  async addToWatchlist(profileId, movieId, token) {
    return request(`/profiles/${profileId}/watchlist/${movieId}`, { method: "POST", body: {}, token });
  },
  async removeFromWatchlist(profileId, movieId, token) {
    return request(`/profiles/${profileId}/watchlist/${movieId}`, { method: "DELETE", token });
  },
  async rateMovie(profileId, movieId, score, token) {
    return request(`/profiles/${profileId}/ratings/${movieId}`, { method: "PUT", body: { score }, token });
  },
  async updateHistory(profileId, movieId, progressSeconds, durationSeconds, token, episodeId = null) {
    return request(`/profiles/${profileId}/history/${movieId}`, {
      method: "PUT",
      body: { episodeId, progressSeconds, durationSeconds },
      token,
    });
  },
  async history(profileId, token) {
    return request(`/profiles/${profileId}/history`, { token });
  },
  async createMovie(movie, token) {
    return request("/admin/movies", { method: "POST", body: movie, token });
  },
  async adminUsers(token) {
    return request("/admin/users", { token });
  },
  async createAdminUser(user, token) {
    return request("/admin/users", { method: "POST", body: user, token });
  },
  async updateUserStatus(userId, status, token) {
    return request(`/admin/users/${userId}/status`, { method: "PATCH", body: { status }, token });
  },
};
