"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MovieCard } from "@/components/MovieCard";
import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icon";
import { api, getCachedMovies, loadMovies, mapMovie } from "@/lib/api";

export default function BrowsePage() {
  const router = useRouter();
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [minRating, setMinRating] = useState("");
  const [status, setStatus] = useState("Loading catalog...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q") ?? "";
    const initialGenre = params.get("genre") ?? "";
    const initialYear = params.get("year") ?? "";
    const initialRating = params.get("minRating") ?? "";
    queueMicrotask(() => {
      setQuery(initialQuery);
      setGenre(initialGenre);
      setYear(initialYear);
      setMinRating(initialRating);
    });

    const cached = getCachedMovies();
    queueMicrotask(() => {
      if (cached.length) {
        setMovies(cached);
        setStatus("");
      }
    });

    const hasFilters = Boolean(initialQuery || initialGenre || initialYear || initialRating);
    const load = hasFilters
      ? api.searchMovies({ q: initialQuery, genre: initialGenre, year: initialYear, minRating: initialRating }).then((items) => items.map(mapMovie).filter(Boolean))
      : loadMovies();

    load
      .then((items) => {
        setMovies(items);
        setStatus("");
      })
      .catch(() => setStatus(cached.length ? "" : "Backend unavailable. No catalog data loaded."));
  }, []);

  async function applyFilters(event) {
    event.preventDefault();
    setStatus("Searching...");
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (genre) params.set("genre", genre);
    if (year.trim()) params.set("year", year.trim());
    if (minRating) params.set("minRating", minRating);
    router.replace(`/browse${params.toString() ? `?${params.toString()}` : ""}`);

    try {
      const items = await api.searchMovies({ q: query, genre, year, minRating });
      setMovies(items.map(mapMovie).filter(Boolean));
      setStatus("");
    } catch {
      const normalized = query.trim().toLowerCase();
      setMovies(getCachedMovies().filter((movie) => !normalized || movie.title.toLowerCase().includes(normalized)));
      setStatus("Search API unavailable. Filtering cached live data locally.");
    }
  }

  function resetFilters() {
    setQuery("");
    setGenre("");
    setYear("");
    setMinRating("");
    router.replace("/browse");
    setMovies(getCachedMovies());
    setStatus("");
  }

  return (
    <div className="app-shell">
      <NavBar active="/browse" />
      <main className="container section">
        <div className="section-header browse-heading">
          <div>
            <h1 className="title-xl" style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>
              Search & Browse
            </h1>
            <p className="lead">Find movies by title, genre, rating, release year, or recommendation signal.</p>
          </div>
        </div>

        <form className="browse-filter-bar" onSubmit={applyFilters}>
          <label className="field-label browse-search">
            Search
            <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Actor, director, title..." />
          </label>
          <label className="field-label">
            Genre
            <select className="select-field" value={genre} onChange={(event) => setGenre(event.target.value)}>
              <option value="">All genres</option>
              <option>Action</option>
              <option>Sci-Fi</option>
              <option>Thriller</option>
              <option>Drama</option>
              <option>Adventure</option>
              <option>Comedy</option>
              <option>Horror</option>
              <option>Romance</option>
              <option>Animation</option>
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
          <label className="field-label browse-year">
            Year
            <input className="field" value={year} onChange={(event) => setYear(event.target.value)} placeholder="2026" />
          </label>
          <div className="browse-filter-actions">
            <button className="btn btn-primary" type="submit">
              <Icon name="search" />
              Search
            </button>
            <button className="btn btn-ghost" onClick={resetFilters} type="button">
              Reset
            </button>
          </div>
        </form>

        <section className="browse-results">
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
      </main>
    </div>
  );
}
