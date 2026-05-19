"use client";

import { useEffect, useState } from "react";
import { MovieCard } from "@/components/MovieCard";
import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icon";
import { api, fallback, mapMovie } from "@/lib/api";

export default function BrowsePage() {
  const [movies, setMovies] = useState(fallback.movies);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [minRating, setMinRating] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api
      .movies()
      .then((items) => setMovies(items.map(mapMovie)))
      .catch(() => setStatus("Backend unavailable. Showing mock results."));
  }, []);

  async function applyFilters() {
    setStatus("");
    try {
      const items = await api.searchMovies({ q: query, genre, year, minRating });
      setMovies(items.map(mapMovie));
    } catch {
      const normalized = query.trim().toLowerCase();
      setMovies(fallback.movies.filter((movie) => !normalized || movie.title.toLowerCase().includes(normalized)));
      setStatus("Search API unavailable. Filtering mock data locally.");
    }
  }

  function resetFilters() {
    setQuery("");
    setGenre("");
    setYear("");
    setMinRating("");
    setMovies(fallback.movies);
    setStatus("");
  }

  return (
    <div className="app-shell">
      <NavBar active="/browse" />
      <main className="container section">
        <div className="section-header">
          <div>
            <h1 className="title-xl" style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>
              Search & Browse
            </h1>
            <p className="lead">Find movies by title, genre, rating, release year, or hybrid recommendation signal.</p>
          </div>
          <button className="btn btn-primary" onClick={applyFilters} type="button">
            <Icon name="tune" />
            Apply
          </button>
        </div>
        <div className="split">
          <aside className="glass-panel filter-stack">
            <div className="section-header">
              <h2 className="section-title">Filters</h2>
              <button className="btn btn-ghost" onClick={resetFilters} type="button">
                Reset
              </button>
            </div>
            <label className="field-label">
              Search
              <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Actor, director, title..." />
            </label>
            <label className="field-label">
              Genre
              <select className="select-field" value={genre} onChange={(event) => setGenre(event.target.value)}>
                <option value="">All genres</option>
                <option>Sci-Fi</option>
                <option>Thriller</option>
                <option>Drama</option>
                <option>Adventure</option>
              </select>
            </label>
            <label className="field-label">
              Rating
              <select className="select-field" value={minRating} onChange={(event) => setMinRating(event.target.value)}>
                <option value="">All ratings</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
              </select>
            </label>
            <label className="field-label">
              Release Year
              <input className="field" value={year} onChange={(event) => setYear(event.target.value)} placeholder="2026" />
            </label>
          </aside>
          <section>
            <div className="section-header">
              <h2 className="section-title">Results</h2>
              <span className="muted">{status || `${movies.length} titles`}</span>
            </div>
            <div className="grid-posters">
              {movies.map((movie, index) => (
                <MovieCard key={`${movie.id ?? movie.title}-browse-${index}`} movie={movie} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
