"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { MovieRail } from "@/components/MovieCard";
import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icon";
import { api, getCachedMovies, mapMovie } from "@/lib/api";
import { getActiveProfileId, getToken } from "@/lib/auth";

export default function MovieDetailsPage() {
  const { movieId } = useParams();
  const [cachedMovies, setCachedMovies] = useState([]);
  const [movie, setMovie] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!movieId) return;
    const cached = getCachedMovies();
    queueMicrotask(() => {
      setCachedMovies(cached);
      setMovie(cached.find((item) => item.id === movieId) ?? null);
    });

    api
      .movie(movieId)
      .then((item) => {
        if (!item) {
          setStatus("Movie not found in backend catalog.");
          return;
        }
        setMovie(mapMovie(item));
      })
      .catch(() => setStatus(cached.length ? "Backend unavailable. Showing cached movie data." : "Backend unavailable."));

    api
      .episodes(movieId)
      .then(setEpisodes)
      .catch(() => setEpisodes([]));

    api
      .similar(movieId)
      .then((items) => setSimilarMovies(items.map(mapMovie).filter(Boolean)))
      .catch(() => setSimilarMovies([]));
  }, [movieId]);

  const similar = similarMovies.length ? similarMovies : cachedMovies.filter((item) => item.id !== movie?.id).slice(0, 10);
  const cast = movie?.raw?.cast ?? movie?.raw?.casts ?? [];
  const directors = movie?.raw?.directors ?? [];

  async function runProfileAction(action) {
    const token = getToken();
    const profileId = getActiveProfileId();
    if (!token || !profileId) {
      setStatus("Sign in and choose a profile first.");
      return;
    }
    if (!movie?.id) {
      setStatus("Movie is still loading.");
      return;
    }

    try {
      await action(profileId, movie.id, token);
    } catch (error) {
      setStatus(error.message);
    }
  }

  function addToMyList() {
    runProfileAction(async (profileId, movieIdValue, token) => {
      await api.addToWatchlist(profileId, movieIdValue, token);
      setStatus("Added to your list.");
    });
  }

  function rateMovie() {
    runProfileAction(async (profileId, movieIdValue, token) => {
      await api.rateMovie(profileId, movieIdValue, 5, token);
      setStatus("Rated 5 stars.");
    });
  }

  function markPlaybackStarted() {
    runProfileAction(async (profileId, movieIdValue, token) => {
      await api.updateHistory(profileId, movieIdValue, 60, 3600, token);
      setStatus("Playback saved to your watch history.");
    });
  }

  return (
    <div className="app-shell">
      <NavBar active="/movies" />
      <section className="hero detail-hero" style={{ backgroundImage: movie?.backdropUrl ? `url(${movie.backdropUrl})` : undefined }}>
        <div className="hero-content">
          <div className="eyebrow">
            <span>IPANMOVIE Catalog</span>
            {movie ? <span className="pill">{movie.genre}</span> : null}
            {movie ? <span className="muted">{movie.year} / {movie.duration}</span> : null}
          </div>
          <h1 className="title-xl">{movie?.title ?? "Movie"}</h1>
          <p className="lead">{movie?.description ?? "Loading movie metadata from the backend catalog."}</p>
          <div className="actions">
            <button className="btn btn-primary" onClick={markPlaybackStarted} type="button">
              <Icon name="play_arrow" filled />
              Play
            </button>
            <button className="btn btn-ghost" onClick={addToMyList} type="button">
              <Icon name="add" />
              My List
            </button>
            <button className="btn btn-ghost" onClick={rateMovie} type="button">
              <Icon name="thumb_up" />
              Rate
            </button>
          </div>
          {status ? <p className="muted">{status}</p> : null}
        </div>
      </section>
      <main className="container">
        <section className="section feature-grid">
          <div className="glass-panel">
            <h2 className="section-title">Synopsis</h2>
            <p className="lead">{movie?.description || "No synopsis available yet."}</p>
            <h2 className="section-title">Cast & Crew</h2>
            <div className="chips">
              {[...cast.slice(0, 4), ...directors.map((name) => `Director: ${name}`).slice(0, 2)].map((item) => (
                <span className="pill" key={item}>
                  {item}
                </span>
              ))}
              {cast.length === 0 && directors.length === 0 ? <span className="pill">Updating metadata</span> : null}
            </div>
          </div>
          <div className="glass-panel">
            <h2 className="section-title">Metadata</h2>
            <div className="metadata-grid">
              {[
                ["Rating", movie?.rating ?? "N/A"],
                ["Type", movie?.duration ?? "N/A"],
                ["Year", movie?.year || "N/A"],
                ["Episodes", episodes.length || "N/A"],
              ].map(([label, value]) => (
                <div className="meta-box" key={label}>
                  <span className="muted">{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="section glass-panel">
          <h2 className="section-title">Community Resonance</h2>
          <p className="muted">Viewers are rating this {movie?.rating ?? "N/A"} in the seeded catalog.</p>
        </section>
      </main>
      <MovieRail title="Similar Titles" movies={similar} />
    </div>
  );
}
