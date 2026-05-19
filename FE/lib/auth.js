"use client";

const TOKEN_KEY = "ipanmovie.accessToken";
const PROFILE_KEY = "ipanmovie.activeProfileId";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(PROFILE_KEY);
}

export function getActiveProfileId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PROFILE_KEY);
}

export function saveActiveProfileId(profileId) {
  window.localStorage.setItem(PROFILE_KEY, profileId);
}
