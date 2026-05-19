"use client";

import { useEffect, useMemo, useState } from "react";
import { MovieCard, MovieRail } from "@/components/MovieCard";
import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icon";
import { getCachedMovies, loadMovies } from "@/lib/api";

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [status, setStatus] = useState("Loading catalog...");

  useEffect(() => {
    const cached = getCachedMovies();
    queueMicrotask(() => {
      if (cached.length) {
        setMovies(cached);
        setStatus("");
      }
    });

    loadMovies()
      .then((items) => {
        setMovies(items);
        setStatus("");
      })
      .catch(() => setStatus(cached.length ? "" : "Backend unavailable. No catalog data loaded."));
  }, []);

  const featured = useMemo(() => movies[0] ?? null, [movies]);

  return (
    <div className="app-shell">
      <NavBar active="/movies" />
      <section className="hero" style={{ backgroundImage: featured?.backdropUrl ? `url(${featured.backdropUrl})` : undefined }}>
        <div className="hero-content">
          <div className="eyebrow">
            <span>Featured Movie</span>
            {featured ? <span className="pill">{featured.genre}</span> : null}
            {featured ? <span className="muted">Rating {featured.rating}</span> : null}
          </div>
          <h1 className="title-xl">{featured?.title ?? "Movies"}</h1>
          <p className="lead">{featured?.description ?? "Connect the backend to load the live movie catalog."}</p>
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
