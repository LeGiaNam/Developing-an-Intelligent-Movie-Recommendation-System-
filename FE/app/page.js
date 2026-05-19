"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { MovieRail } from "@/components/MovieCard";
import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icon";
import { api, fallback, mapMovie } from "@/lib/api";
import { images } from "@/lib/data";
import { getActiveProfileId, getToken } from "@/lib/auth";

export default function HomePage() {
  const [catalog, setCatalog] = useState(fallback.movies);
  const [recommended, setRecommended] = useState(fallback.movies);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const token = getToken();
    const profileId = getActiveProfileId();

    api
      .movies()
      .then((items) => setCatalog(items.map(mapMovie)))
      .catch(() => setStatus("Backend unavailable. Showing curated demo data."));

    if (token && profileId) {
      api
        .personalized(profileId, token)
        .then((items) => setRecommended(items.map(mapMovie)))
        .catch(() => setRecommended(fallback.movies));
    }
  }, []);

  const heroMovie = useMemo(() => catalog[1] ?? fallback.movies[1], [catalog]);
  const featureMovie = catalog[0] ?? fallback.movies[0];

  return (
    <div className="app-shell">
      <NavBar active="/" />
      <section className="hero" style={{ backgroundImage: `url(${heroMovie.backdropUrl || images.homeHero})` }}>
        <div className="hero-content">
          <div className="eyebrow">
            <span>New Release</span>
            <span className="pill">{heroMovie.genre}</span>
            <span className="muted">{heroMovie.year}</span>
          </div>
          <h1 className="title-xl">{heroMovie.title}</h1>
          <p className="lead">{heroMovie.description || "A cinematic recommendation picked from the live IPANMOVIE catalog."}</p>
          <div className="actions">
            <button className="btn btn-primary">
              <Icon name="play_arrow" filled />
              Play
            </button>
            <button className="btn btn-ghost">
              <Icon name="add" />
              My List
            </button>
          </div>
          {status ? <p className="muted">{status}</p> : null}
        </div>
      </section>
      <MovieRail title="Continue Watching" movies={catalog.slice(0, 6)} wide />
      <section className="section container">
        <div className="section-header">
          <h2 className="section-title">Trending Now</h2>
          <span className="pill">
            <Icon name="local_fire_department" filled />
            Live catalog
          </span>
        </div>
        <div className="feature-grid">
          <div className="poster-card" style={{ minHeight: 520, aspectRatio: "16 / 10" }}>
            <Image src={featureMovie.image} alt={`${featureMovie.title} poster`} fill sizes="(max-width: 980px) 100vw, 60vw" />
            <div className="card-overlay">
              <span className="pill">Hybrid Match / {featureMovie.rating}</span>
              <h3 className="section-title">{featureMovie.title}</h3>
              <p className="muted">{featureMovie.description || "Recommended from backend catalog data."}</p>
            </div>
          </div>
          <div className="grid-posters">
            {catalog.slice(1, 5).map((movie) => (
              <div className="poster-card" key={movie.id ?? movie.title}>
                <Image src={movie.image} alt={`${movie.title} poster`} fill sizes="220px" />
                <div className="card-overlay">
                  <h3 className="card-title">{movie.title}</h3>
                  <span className="muted">{movie.rating} rating</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <MovieRail title="Because You Watched Sci-Fi" movies={recommended} />
    </div>
  );
}
