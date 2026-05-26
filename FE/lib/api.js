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

export function getCachedMovies(type) {
  const cacheKey = type ? `${MOVIES_CACHE_KEY}_${type}` : MOVIES_CACHE_KEY;
  return readCache(cacheKey, mapMovie);
}

export function getCachedProfiles() {
  return readCache(PROFILE_CACHE_KEY, mapProfile);
}

export function saveCachedProfiles(profilesRaw) {
  writeCache(PROFILE_CACHE_KEY, profilesRaw);
}

export async function loadMovies(type, page = 1) {
  const items = await api.movies(type, page);
  const cacheKey = type ? `${MOVIES_CACHE_KEY}_${type}` : MOVIES_CACHE_KEY;
  if (page === 1) writeCache(cacheKey, items);
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
  async changePassword(currentPassword, newPassword, token) {
    return request("/auth/me/password", { method: "PATCH", body: { currentPassword, newPassword }, token });
  },
  async profiles(token) {
    return request("/profiles", { token });
  },
  async createProfile(profile, token) {
    return request("/profiles", { method: "POST", body: profile, token });
  },
  async updateProfile(profileId, profile, token) {
    return request(`/profiles/${profileId}`, { method: "PATCH", body: profile, token });
  },
  async deleteProfile(profileId, token) {
    return request(`/profiles/${profileId}`, { method: "DELETE", token });
  },
  async verifyProfilePin(profileId, pin, token) {
    return request(`/profiles/${profileId}/verify-pin`, { method: "POST", body: { pin }, token });
  },
  async movies(type, page = 1) {
    const search = new URLSearchParams({ page, limit: 24 });
    if (type) search.set("type", type);
    return request(`/movies?${search.toString()}`);
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
  async searchSuggest(q) {
    return request(`/search/suggest?q=${encodeURIComponent(q)}`);
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
  async getRatings(profileId, token) {
    return request(`/profiles/${profileId}/ratings`, { token });
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
  async comments(movieId, limit = 10) {
    return request(`/movies/${movieId}/comments?limit=${limit}`);
  },
  async addComment(movieId, profileId, content, token) {
    return request(`/movies/${movieId}/comments`, { method: "POST", body: { profileId, content }, token });
  },
  async updateComment(commentId, profileId, content, token) {
    return request(`/comments/${commentId}`, { method: "PATCH", body: { profileId, content }, token });
  },
  async deleteComment(commentId, profileId, token) {
    return request(`/comments/${commentId}`, { method: "DELETE", body: { profileId }, token });
  },
  async replyComment(commentId, movieId, profileId, content, token) {
    return request(`/comments/${commentId}/replies`, { method: "POST", body: { movieId, profileId, content }, token });
  },
  async commentAction(commentId, profileId, action, token) {
    return request(`/comments/${commentId}/action`, { method: "POST", body: { profileId, action }, token });
  },
  async createMovie(movie, token) {
    return request("/admin/movies", { method: "POST", body: movie, token });
  },
  async updateMovie(movieId, movie, token) {
    return request(`/admin/movies/${movieId}`, { method: "PATCH", body: movie, token });
  },
  async deleteMovie(movieId, token) {
    return request(`/admin/movies/${movieId}`, { method: "DELETE", token });
  },
  async createEpisode(movieId, episode, token) {
    return request(`/admin/movies/${movieId}/episodes`, { method: "POST", body: episode, token });
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
  async recommendationSummary(token) {
    return request("/recommendation-events/summary", { token });
  },
};
