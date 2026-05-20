"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Icon } from "@/components/Icon";
import { api, getCachedMovies, loadMovies, mapMovie } from "@/lib/api";
import { getToken } from "@/lib/auth";

const emptyMovie = {
  title: "",
  slug: "",
  genres: "",
  countries: "",
  releaseYear: "",
  posterUrl: "",
  backdropUrl: "",
};

export default function AdminPage() {
  const [movies, setMovies] = useState([]);
  const [status, setStatus] = useState("Loading catalog...");
  const [showCreate, setShowCreate] = useState(false);
  const [movieForm, setMovieForm] = useState(emptyMovie);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

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

  const seriesCount = movies.filter((movie) => movie.duration === "Series").length;
  const filteredMovies = movies.filter((movie) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [movie.title, movie.genre, movie.year].some((value) => String(value ?? "").toLowerCase().includes(query));
  });

  function updateMovieField(field, value) {
    setMovieForm((current) => ({ ...current, [field]: value }));
  }

  function startCreate() {
    setEditingMovieId(null);
    setMovieForm(emptyMovie);
    setShowCreate((value) => !value);
  }

  function startEdit(movie) {
    setEditingMovieId(movie.id);
    setMovieForm({
      title: movie.title ?? "",
      slug: movie.slug ?? "",
      genres: movie.genres?.join(", ") ?? movie.genre ?? "",
      countries: movie.raw?.countries?.join(", ") ?? "",
      releaseYear: movie.year ?? "",
      posterUrl: movie.raw?.posterUrl ?? movie.image ?? "",
      backdropUrl: movie.raw?.backdropUrl ?? movie.backdropUrl ?? "",
    });
    setShowCreate(true);
    setStatus("");
  }

  async function saveMovie(event) {
    event.preventDefault();
    const token = getToken();
    if (!token) {
      setStatus("Sign in as admin first.");
      return;
    }

    setSaving(true);
    setStatus("");
    try {
      const payload = {
        title: movieForm.title,
        slug: movieForm.slug || movieForm.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        genres: movieForm.genres.split(",").map((item) => item.trim()).filter(Boolean),
        countries: movieForm.countries.split(",").map((item) => item.trim()).filter(Boolean),
        releaseYear: movieForm.releaseYear ? Number(movieForm.releaseYear) : undefined,
        posterUrl: movieForm.posterUrl || undefined,
        backdropUrl: movieForm.backdropUrl || undefined,
      };
      const saved = editingMovieId
        ? await api.updateMovie(editingMovieId, payload, token)
        : await api.createMovie(payload, token);
      const mapped = mapMovie(saved);
      setMovies((current) => editingMovieId
        ? current.map((movie) => (movie.id === editingMovieId ? mapped : movie))
        : [mapped, ...current]);
      setMovieForm(emptyMovie);
      setEditingMovieId(null);
      setShowCreate(false);
      setStatus(editingMovieId ? "Movie updated." : "Movie created.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteMovie(movie) {
    const token = getToken();
    if (!token) {
      setStatus("Sign in as admin first.");
      return;
    }
    if (!window.confirm(`Delete "${movie.title}" from the catalog?`)) {
      return;
    }

    setStatus("");
    try {
      await api.deleteMovie(movie.id, token);
      setMovies((current) => current.filter((item) => item.id !== movie.id));
      setStatus("Movie deleted.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <AdminShell active="/admin">
      <div className="section-header">
        <div>
          <h1 className="title-xl" style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>
            Movie Manager
          </h1>
          <p className="muted">{status || "Manage catalog metadata, posters, publication state, and encoding status."}</p>
        </div>
        <button className="btn btn-primary" onClick={startCreate} type="button">
          <Icon name="add" />
          Add Movie
        </button>
      </div>
      {showCreate ? (
        <section className="admin-panel" style={{ marginBottom: 22 }}>
          <form className="filter-stack" onSubmit={saveMovie}>
            <div className="form-grid">
              <label className="field-label">
                Title
                <input className="field" value={movieForm.title} onChange={(event) => updateMovieField("title", event.target.value)} required />
              </label>
              <label className="field-label">
                Slug
                <input className="field" value={movieForm.slug} onChange={(event) => updateMovieField("slug", event.target.value)} placeholder="auto-from-title" />
              </label>
              <label className="field-label">
                Genres
                <input className="field" value={movieForm.genres} onChange={(event) => updateMovieField("genres", event.target.value)} placeholder="Action, Drama" />
              </label>
              <label className="field-label">
                Countries
                <input className="field" value={movieForm.countries} onChange={(event) => updateMovieField("countries", event.target.value)} placeholder="US, VN" />
              </label>
              <label className="field-label">
                Release year
                <input className="field" value={movieForm.releaseYear} onChange={(event) => updateMovieField("releaseYear", event.target.value)} placeholder="2026" />
              </label>
              <label className="field-label">
                Poster URL
                <input className="field" value={movieForm.posterUrl} onChange={(event) => updateMovieField("posterUrl", event.target.value)} placeholder="https://..." />
              </label>
              <label className="field-label">
                Backdrop URL
                <input className="field" value={movieForm.backdropUrl} onChange={(event) => updateMovieField("backdropUrl", event.target.value)} placeholder="https://..." />
              </label>
            </div>
            <div className="actions">
              <button className="btn btn-ghost" type="button" onClick={() => {
                setShowCreate(false);
                setEditingMovieId(null);
                setMovieForm(emptyMovie);
              }}>
                Cancel
              </button>
              <button className="btn btn-primary" disabled={saving} type="submit">
                <Icon name="add" />
                {saving ? "Saving..." : editingMovieId ? "Update Movie" : "Create Movie"}
              </button>
            </div>
          </form>
        </section>
      ) : null}
      <section className="kpi-grid">
        {[
          ["Movies", String(movies.length)],
          ["Series", String(seriesCount)],
          ["Pending", "0"],
          ["Errors", "0"],
        ].map(([label, value]) => (
          <div className="kpi" key={label}>
            <span className="muted">{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
      <section className="admin-panel" style={{ marginTop: 22 }}>
        <div className="section-header">
          <h2 className="section-title">Catalog</h2>
          <label className="search-field" style={{ display: "flex", width: 280 }}>
            <Icon name="search" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search movies" />
          </label>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Genre</th>
              <th>Year</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovies.map((movie) => (
              <tr key={movie.id ?? movie.title}>
                <td>{movie.title}</td>
                <td>{movie.genre}</td>
                <td>{movie.year}</td>
                <td>{movie.rating}</td>
                <td>
                  <span className="pill">Published</span>
                </td>
                <td>
                  <button className="icon-button" aria-label={`Edit ${movie.title}`} onClick={() => startEdit(movie)} type="button">
                    <Icon name="edit" />
                  </button>
                  <button className="icon-button" aria-label={`Delete ${movie.title}`} onClick={() => deleteMovie(movie)} type="button">
                    <Icon name="delete" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
