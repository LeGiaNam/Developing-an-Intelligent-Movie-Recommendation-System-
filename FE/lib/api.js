import { movieImages, movies as mockMovies, profiles as mockProfiles } from "@/lib/data";
import { getToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const API_PREFIX = "/api/v1";

function imageForIndex(index = 0) {
  return movieImages[index % movieImages.length];
}

export function mapMovie(movie, index = 0) {
  if (!movie) return mockMovies[index % mockMovies.length];
  return {
    id: movie._id ?? movie.id ?? movie.movie_id ?? movie.movieId,
    slug: movie.slug ?? "neon-horizons",
    title: movie.title ?? `Movie ${index + 1}`,
    genre: Array.isArray(movie.genres) ? movie.genres[0] ?? "Movie" : movie.genres ?? "Movie",
    genres: Array.isArray(movie.genres) ? movie.genres : String(movie.genres ?? "Movie").split("|"),
    year: movie.releaseYear ?? movie.year ?? "",
    rating: Number(movie.averageRating ?? movie.rating ?? movie.score ?? 0).toFixed(1),
    duration: movie.type === "series" ? "Series" : "Movie",
    image: movie.posterUrl || movie.backdropUrl || imageForIndex(index),
    backdropUrl: movie.backdropUrl || movie.posterUrl || imageForIndex(index + 1),
    description: movie.description ?? "",
    raw: movie,
  };
}

export function mapProfile(profile, index = 0) {
  const fallback = mockProfiles[index % mockProfiles.length];
  return {
    id: profile?._id ?? profile?.id ?? fallback.name,
    name: profile?.name ?? fallback.name,
    image: profile?.avatarUrl || fallback.image,
    isKids: Boolean(profile?.isKids),
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
    throw new Error(message);
  }
  return payload.data ?? payload;
}

export const api = {
  async login(email, password) {
    return request("/auth/login", { method: "POST", body: { email, password }, token: null });
  },
  async register(email, password) {
    return request("/auth/register", { method: "POST", body: { email, password }, token: null });
  },
  async googleMockLogin() {
    return request("/auth/google/mock", { token: null });
  },
  async me(token) {
    return request("/auth/me", { token });
  },
  async profiles(token) {
    return request("/profiles", { token });
  },
  async movies() {
    return request("/movies");
  },
  async trending() {
    return request("/movies/discovery/trending");
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
  async watchlist(profileId, token) {
    return request(`/profiles/${profileId}/watchlist`, { token });
  },
  async history(profileId, token) {
    return request(`/profiles/${profileId}/history`, { token });
  },
  async adminUsers(token) {
    return request("/admin/users", { token });
  },
  async updateUserStatus(userId, status, token) {
    return request(`/admin/users/${userId}/status`, { method: "PATCH", body: { status }, token });
  },
};

export const fallback = {
  movies: mockMovies,
  profiles: mockProfiles.map(mapProfile),
};
