"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MovieRail } from "@/components/MovieCard";
import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icon";
import { api, getCachedMovies, loadMovies, mapMovie } from "@/lib/api";
import { getActiveProfileId, getToken } from "@/lib/auth";

export default function HomePage() {
  const [catalog, setCatalog] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [recommendationPopupOpen, setRecommendationPopupOpen] = useState(false);
  const [recommendationPopupStatus, setRecommendationPopupStatus] = useState("");
  const [status, setStatus] = useState("Loading catalog...");

  useEffect(() => {
    const token = getToken();
    const profileId = getActiveProfileId();
    const cached = getCachedMovies();
    queueMicrotask(() => {
      if (cached.length) {
        setCatalog(cached);
        setRecommended(cached);
        setStatus("");
      }
    });

    loadMovies()
      .then((items) => {
        setCatalog(items);
        if (!profileId) setRecommended(items);
        setStatus("");
      })
      .catch(() => setStatus(cached.length ? "" : "Backend unavailable. No catalog data loaded."));

    api
      .trending()
      .then((items) => setTrending(items.map(mapMovie).filter(Boolean)))
      .catch(() => {});

    if (token && profileId) {
      api
        .personalized(profileId, token)
        .then((items) => setRecommended(items.map(mapMovie).filter(Boolean)))
        .catch(() => {});

      // Load watch history for "Continue Watching"
      api
        .history(profileId, token)
        .then((items) => {
          const mapped = items
            .map((h) => {
              const movie = mapMovie(h.movieId ?? h);
              if (!movie) return null;
              const pct = h.durationSeconds > 0
                ? Math.round((h.progressSeconds / h.durationSeconds) * 100)
                : 0;
              return { ...movie, progress: Math.min(pct, 100) };
            })
            .filter(Boolean)
            .slice(0, 10);
          setWatchHistory(mapped);
        })
        .catch(() => {});
    }
  }, []);

  async function openRecommendationPopup() {
    setRecommendationPopupOpen(true);
    const token = getToken();
    const profileId = getActiveProfileId();

    if (recommended.length) {
      setRecommendationPopupStatus("");
      return;
    }

    setRecommendationPopupStatus("Loading recommendations...");
    try {
      const items = token && profileId
        ? await api.personalized(profileId, token)
        : await api.trending();
      setRecommended(items.map(mapMovie).filter(Boolean));
      setRecommendationPopupStatus("");
    } catch {
      setRecommendationPopupStatus("Recommendation service is not available.");
    }
  }

  const heroMovie = useMemo(() => catalog[1] ?? catalog[0] ?? null, [catalog]);
  const trendingMovies = trending.length ? trending : catalog;
  const featureMovie = trendingMovies[0] ?? null;

  function trackRecommendationEvent(movie, eventType) {
    if (!movie?.id) return;
    api.trackRecommendationEvent({
      profileId: getActiveProfileId(),
      movieId: movie.id,
      eventType,
      variant: "recommendation",
      source: "home_popup",
      sessionId: typeof window !== "undefined" ? window.sessionStorage.getItem("ipanmovie.session") ?? "" : "",
    }).catch(() => {});
  }

  useEffect(() => {
    if (!recommendationPopupOpen || !recommended.length) return;
    recommended.slice(0, 8).forEach((movie) => trackRecommendationEvent(movie, "impression"));
  }, [recommendationPopupOpen, recommended]);

  return (
    <div className="app-shell">
      <NavBar active="/" />
      <section className="hero" style={{ backgroundImage: heroMovie?.backdropUrl ? `url(${heroMovie.backdropUrl})` : undefined }}>
        <div className="hero-content">
          <div className="eyebrow">
            <span>New Release</span>
            {heroMovie ? <span className="pill">{heroMovie.genre}</span> : null}
            {heroMovie ? <span className="muted">{heroMovie.year}</span> : null}
          </div>
          <h1 className="title-xl">{heroMovie?.title ?? "IPANMOVIE"}</h1>
          <p className="lead">{heroMovie?.description ?? "Connect the backend to load the live movie catalog."}</p>
          <div className="actions">
              {heroMovie ? (
                <Link className="btn btn-primary" href={`/movie/${heroMovie.id}`}>
                  <Icon name="play_arrow" filled />
                  Play Now
                </Link>
              ) : (
                <Link className="btn btn-primary" href="/browse">
                  <Icon name="search" />
                  Browse
                </Link>
              )}
              {heroMovie ? (
                <Link className="btn btn-ghost" href={`/movie/${heroMovie.id}`}>
                  <Icon name="info" />
                  More Info
                </Link>
              ) : null}
              <button className="btn btn-ghost" onClick={openRecommendationPopup} type="button">
                <Icon name="auto_awesome" filled />
                For You
              </button>
            </div>
            {status ? <p className="muted">{status}</p> : null}
        </div>
      </section>
      {/* Continue Watching — real watch history data */}
      {watchHistory.length > 0 && (
        <MovieRail title="Continue Watching" movies={watchHistory} wide />
      )}
      {featureMovie ? <section className="section container">
        <div className="section-header">
          <h2 className="section-title">Trending Now</h2>
          <span className="pill">
            <Icon name="local_fire_department" filled />
            Live catalog
          </span>
        </div>
        <div className="feature-grid">
          <div className="poster-card" style={{ minHeight: 520, aspectRatio: "16 / 10" }}>
            {featureMovie.image ? <Image src={featureMovie.image} alt={`${featureMovie.title} poster`} fill sizes="(max-width: 980px) 100vw, 60vw" /> : <div className="poster-fallback" />}
            <div className="card-overlay">
              <span className="pill">Hybrid Match / {featureMovie.rating}</span>
              <h3 className="section-title">{featureMovie.title}</h3>
              <p className="muted">{featureMovie.description || "Recommended from backend catalog data."}</p>
            </div>
          </div>
          <div className="grid-posters">
            {trendingMovies.slice(1, 5).map((movie) => (
              <div className="poster-card" key={movie.id ?? movie.title}>
                {movie.image ? <Image src={movie.image} alt={`${movie.title} poster`} fill sizes="220px" /> : <div className="poster-fallback" />}
                <div className="card-overlay">
                  <h3 className="card-title">{movie.title}</h3>
                  <span className="muted">{movie.rating} rating</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> : null}
      <MovieRail title="Because You Watched Sci-Fi" movies={recommended} />
      {recommendationPopupOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Recommendation results">
          <div className="recommendation-modal">
            <div className="section-header">
              <div>
                <span className="pill">
                  <Icon name="auto_awesome" filled />
                  Recommendation system
                </span>
                <h2 className="section-title">Picked For You</h2>
              </div>
              <button className="icon-button" onClick={() => setRecommendationPopupOpen(false)} type="button" aria-label="Close recommendations">
                <Icon name="close" />
              </button>
            </div>
            {recommendationPopupStatus ? <p className="muted">{recommendationPopupStatus}</p> : null}
            <div className="recommendation-grid">
              {recommended.slice(0, 8).map((movie) => (
                <Link className="recommendation-result" href={`/movie/${movie.id}`} key={`popup-${movie.id}`} onClick={() => trackRecommendationEvent(movie, "click")}>
                  {movie.image ? <Image src={movie.image} alt={`${movie.title} poster`} width={96} height={132} /> : <div className="recommendation-thumb" />}
                  <div>
                    <h3 className="card-title">{movie.title}</h3>
                    <p className="muted">{movie.genre} / {movie.year} / {movie.rating}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
