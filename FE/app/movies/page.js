"use client";

import { useEffect, useMemo, useState } from "react";
import { MovieCard, MovieRail } from "@/components/MovieCard";
import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icon";
import { api, fallback, mapMovie } from "@/lib/api";
import { images } from "@/lib/data";

export default function MoviesPage() {
  const [movies, setMovies] = useState(fallback.movies);
  const [status, setStatus] = useState("");

  useEffect(() => {
    api
      .movies()
      .then((items) => {
        setMovies(items.map(mapMovie));
        setStatus("");
      })
      .catch(() => setStatus("Backend unavailable. Showing mock movies."));
  }, []);

  const featured = useMemo(() => movies[0] ?? fallback.movies[0], [movies]);

  return (
    <div className="app-shell">
      <NavBar active="/movies" />
      <section className="hero" style={{ backgroundImage: `url(${featured.backdropUrl || images.moviesHero})` }}>
        <div className="hero-content">
          <div className="eyebrow">
            <span>Featured Movie</span>
            <span className="pill">{featured.genre}</span>
            <span className="muted">Rating {featured.rating}</span>
          </div>
          <h1 className="title-xl">{featured.title}</h1>
          <p className="lead">{featured.description || "A curated cinema wall powered by the backend catalog when available."}</p>
          <div className="actions">
            <button className="btn btn-primary">
              <Icon name="play_arrow" filled />
              Watch Now
            </button>
            <button className="btn btn-ghost">
              <Icon name="info" />
              Details
            </button>
          </div>
          {status ? <p className="muted">{status}</p> : null}
        </div>
      </section>
      <MovieRail title="Popular on IPANMOVIE" movies={movies} />
      <section className="section container">
        <div className="section-header">
          <h2 className="section-title">All Movies</h2>
          <div className="chips">
            {["Action", "Sci-Fi", "Drama", "Fantasy"].map((chip) => (
              <span className="pill" key={chip}>
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div className="grid-posters">
          {movies.map((movie) => (
            <MovieCard key={movie.id ?? movie.title} movie={movie} />
          ))}
        </div>
      </section>
    </div>
  );
}
