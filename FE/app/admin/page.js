"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Icon } from "@/components/Icon";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { api, getCachedMovies, loadMovies, mapMovie } from "@/lib/api";
import { getToken } from "@/lib/auth";

const emptyMovie = {
  title: "", slug: "", type: "movie",
  genres: "", countries: "", releaseYear: "",
  description: "", cast: "", directors: "",
  ageRating: "", trailerUrl: "", posterUrl: "", backdropUrl: "",
};

const emptyEpisode = {
  seasonNumber: "1", episodeNumber: "", title: "", description: "",
  durationSeconds: "", videoUrl: "", quality: "1080p",
};

export default function AdminPage() {
  const { toast } = useToast();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [movieForm, setMovieForm] = useState(emptyMovie);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState("basic"); // basic | media | episodes
  // Episode management
  const [episodes, setEpisodes] = useState([]);
  const [episodeForm, setEpisodeForm] = useState(emptyEpisode);
  const [savingEpisode, setSavingEpisode] = useState(false);
  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    const cached = getCachedMovies();
    if (cached.length) { setMovies(cached); setLoading(false); }
    loadMovies()
      .then((items) => { setMovies(items); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const seriesCount = movies.filter((m) => m.duration === "Series").length;
  const filteredMovies = movies.filter((m) => {
    const q = searchQuery.trim().toLowerCase();
    return !q || [m.title, m.genre, String(m.year)].some((v) => String(v ?? "").toLowerCase().includes(q));
  });

  function field(key) {
    return (e) => setMovieForm((prev) => ({ ...prev, [key]: e.target.value }));
  }
  function episodeField(key) {
    return (e) => setEpisodeForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  function startCreate() {
    setEditingMovieId(null);
    setMovieForm(emptyMovie);
    setEpisodes([]);
    setEpisodeForm(emptyEpisode);
    setActiveFormTab("basic");
    setShowForm(true);
  }

  function startEdit(movie) {
    setEditingMovieId(movie.id);
    setMovieForm({
      title: movie.title ?? "",
      slug: movie.slug ?? "",
      type: movie.raw?.type ?? "movie",
      genres: movie.genres?.join(", ") ?? movie.genre ?? "",
      countries: movie.raw?.countries?.join(", ") ?? "",
      releaseYear: String(movie.year ?? ""),
      description: movie.raw?.description ?? movie.description ?? "",
      cast: (movie.raw?.cast ?? []).join(", "),
      directors: (movie.raw?.directors ?? []).join(", "),
      ageRating: movie.raw?.ageRating ?? "",
      trailerUrl: movie.raw?.trailerUrl ?? "",
      posterUrl: movie.raw?.posterUrl ?? movie.image ?? "",
      backdropUrl: movie.raw?.backdropUrl ?? movie.backdropUrl ?? "",
    });
    setEpisodes([]);
    setEpisodeForm(emptyEpisode);
    setActiveFormTab("basic");
    setShowForm(true);
    // Load episodes if series
    if (movie.raw?.type === "series" || movie.duration === "Series") {
      api.episodes(movie.id).then(setEpisodes).catch(() => {});
    }
  }

  async function saveMovie(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) { toast("Admin access required.", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        title: movieForm.title.trim(),
        slug: movieForm.slug.trim() || movieForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        type: movieForm.type,
        genres: movieForm.genres.split(",").map((s) => s.trim()).filter(Boolean),
        countries: movieForm.countries.split(",").map((s) => s.trim()).filter(Boolean),
        releaseYear: movieForm.releaseYear ? Number(movieForm.releaseYear) : undefined,
        description: movieForm.description || undefined,
        cast: movieForm.cast.split(",").map((s) => s.trim()).filter(Boolean),
        directors: movieForm.directors.split(",").map((s) => s.trim()).filter(Boolean),
        ageRating: movieForm.ageRating || undefined,
        trailerUrl: movieForm.trailerUrl || undefined,
        posterUrl: movieForm.posterUrl || undefined,
        backdropUrl: movieForm.backdropUrl || undefined,
      };
      const saved = editingMovieId
        ? await api.updateMovie(editingMovieId, payload, token)
        : await api.createMovie(payload, token);
      const mapped = mapMovie(saved);
      setMovies((curr) => editingMovieId
        ? curr.map((m) => m.id === editingMovieId ? mapped : m)
        : [mapped, ...curr]);
      toast(editingMovieId ? "Movie updated successfully." : "Movie created successfully.", "success");
      setShowForm(false);
      setEditingMovieId(null);
      setMovieForm(emptyMovie);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(movie) {
    setPendingDelete(movie);
    setConfirmOpen(true);
  }

  async function executeDelete() {
    const token = getToken();
    const movie = pendingDelete;
    setConfirmOpen(false);
    setPendingDelete(null);
    if (!token || !movie) return;
    try {
      await api.deleteMovie(movie.id, token);
      setMovies((curr) => curr.filter((m) => m.id !== movie.id));
      toast(`"${movie.title}" deleted from catalog.`, "success");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function saveEpisode(e) {
    e.preventDefault();
    const token = getToken();
    if (!token || !editingMovieId) return;
    setSavingEpisode(true);
    try {
      const ep = {
        seasonNumber: Number(episodeForm.seasonNumber) || 1,
        episodeNumber: Number(episodeForm.episodeNumber),
        title: episodeForm.title.trim() || undefined,
        description: episodeForm.description.trim() || undefined,
        durationSeconds: episodeForm.durationSeconds ? Number(episodeForm.durationSeconds) : undefined,
        videoSources: episodeForm.videoUrl ? [{ quality: episodeForm.quality, url: episodeForm.videoUrl }] : undefined,
      };
      const created = await api.createEpisode(editingMovieId, ep, token);
      setEpisodes((prev) => [...prev, created]);
      setEpisodeForm(emptyEpisode);
      toast("Episode added successfully.", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSavingEpisode(false);
    }
  }

  return (
    <AdminShell active="/admin">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="title-xl" style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>Movie Manager</h1>
          <p className="muted">Manage catalog metadata, posters, publication state, and episodes.</p>
        </div>
        <button className="btn btn-primary" onClick={startCreate} type="button">
          <Icon name="add" />Add Movie
        </button>
      </div>

      {/* KPI */}
      <section className="kpi-grid" style={{ marginBottom: 24 }}>
        {[
          ["Movies", movies.length - seriesCount, "movie"],
          ["Series", seriesCount, "video_library"],
          ["Total", movies.length, "library_books"],
          ["Genres", [...new Set(movies.flatMap((m) => m.genres ?? []))].length, "label"],
        ].map(([label, value, icon]) => (
          <div className="kpi" key={label} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Icon name={icon} style={{ color: "var(--primary)", width: 28, height: 28 }} />
            <div>
              <div className="muted" style={{ fontSize: 12 }}>{label}</div>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </section>

      {/* Movie Form */}
      {showForm && (
        <section className="admin-panel" style={{ marginBottom: 22 }}>
          <div style={{ padding: "18px 22px 0" }}>
            <h2 className="section-title" style={{ fontSize: 20 }}>
              {editingMovieId ? "Edit Movie" : "Add New Movie"}
            </h2>
          </div>

          {/* Form Tabs */}
          <div className="admin-tabs" style={{ paddingInline: 22 }}>
            {[
              { id: "basic", label: "Basic Info" },
              { id: "media", label: "Media & Assets" },
              ...(movieForm.type === "series" || editingMovieId ? [{ id: "episodes", label: `Episodes (${episodes.length})` }] : []),
            ].map((tab) => (
              <button key={tab.id} className={`admin-tab${activeFormTab === tab.id ? " active" : ""}`}
                onClick={() => setActiveFormTab(tab.id)} type="button">{tab.label}</button>
            ))}
          </div>

          <form className="filter-stack" onSubmit={saveMovie} style={{ padding: "0 22px 22px" }}>
            {/* Basic Info Tab */}
            {activeFormTab === "basic" && (
              <div className="form-grid">
                <label className="field-label">
                  Title *
                  <input className="field" value={movieForm.title} onChange={field("title")} required />
                </label>
                <label className="field-label">
                  Slug
                  <input className="field" value={movieForm.slug} onChange={field("slug")} placeholder="auto-from-title" />
                </label>
                <label className="field-label">
                  Type
                  <select className="field select-field" value={movieForm.type} onChange={field("type")}>
                    <option value="movie">Movie</option>
                    <option value="series">Series</option>
                  </select>
                </label>
                <label className="field-label">
                  Release Year
                  <input className="field" type="number" value={movieForm.releaseYear} onChange={field("releaseYear")} placeholder="2026" min="1900" max="2100" />
                </label>
                <label className="field-label">
                  Genres
                  <input className="field" value={movieForm.genres} onChange={field("genres")} placeholder="Action, Drama, Sci-Fi" />
                </label>
                <label className="field-label">
                  Countries
                  <input className="field" value={movieForm.countries} onChange={field("countries")} placeholder="US, VN, KR" />
                </label>
                <label className="field-label">
                  Cast (comma separated)
                  <input className="field" value={movieForm.cast} onChange={field("cast")} placeholder="Actor 1, Actor 2" />
                </label>
                <label className="field-label">
                  Directors
                  <input className="field" value={movieForm.directors} onChange={field("directors")} placeholder="Director Name" />
                </label>
                <label className="field-label">
                  Age Rating
                  <select className="field select-field" value={movieForm.ageRating} onChange={field("ageRating")}>
                    <option value="">Not specified</option>
                    {["G", "PG", "PG-13", "R", "NC-17", "TV-Y", "TV-PG", "TV-14", "TV-MA"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  Trailer URL
                  <input className="field" type="url" value={movieForm.trailerUrl} onChange={field("trailerUrl")} placeholder="https://youtube.com/..." />
                </label>
                <label className="field-label" style={{ gridColumn: "1 / -1" }}>
                  Description
                  <textarea className="field textarea-field" value={movieForm.description} onChange={field("description")} placeholder="Movie synopsis..." />
                </label>
              </div>
            )}

            {/* Media Tab */}
            {activeFormTab === "media" && (
              <div className="form-grid">
                <label className="field-label">
                  Poster URL
                  <input className="field" type="url" value={movieForm.posterUrl} onChange={field("posterUrl")} placeholder="https://..." />
                  {movieForm.posterUrl ? (
                    <img src={movieForm.posterUrl} alt="Poster preview" className="img-preview"
                      style={{ aspectRatio: "2/3", maxWidth: 140 }}
                      onError={(e) => { e.target.style.display = "none"; }} />
                  ) : (
                    <div className="img-preview-placeholder" style={{ aspectRatio: "2/3", maxWidth: 140 }}>
                      <Icon name="image" /><span>No poster</span>
                    </div>
                  )}
                </label>
                <label className="field-label">
                  Backdrop URL
                  <input className="field" type="url" value={movieForm.backdropUrl} onChange={field("backdropUrl")} placeholder="https://..." />
                  {movieForm.backdropUrl ? (
                    <img src={movieForm.backdropUrl} alt="Backdrop preview" className="img-preview"
                      onError={(e) => { e.target.style.display = "none"; }} />
                  ) : (
                    <div className="img-preview-placeholder">
                      <Icon name="panorama" /><span>No backdrop</span>
                    </div>
                  )}
                </label>
              </div>
            )}

            {/* Episodes Tab */}
            {activeFormTab === "episodes" && editingMovieId && (
              <div>
                <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
                  {episodes.length === 0 && (
                    <p className="muted" style={{ fontSize: 14 }}>No episodes yet. Add one below.</p>
                  )}
                  {episodes.map((ep) => (
                    <div key={ep._id ?? ep.id} className="episode-row" style={{ cursor: "default" }}>
                      <div className="episode-number">
                        S{ep.seasonNumber ?? 1}E{ep.episodeNumber}
                      </div>
                      <div className="episode-copy">
                        <strong>{ep.title || `Episode ${ep.episodeNumber}`}</strong>
                        <span className="muted" style={{ fontSize: 12 }}>{ep.durationSeconds ? `${Math.floor(ep.durationSeconds / 60)} min` : ""}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {(ep.videoSources?.[0]?.url) && (
                          <span className="pill" style={{ fontSize: 11, color: "#44cf70" }}>Has video</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <h3 style={{ margin: "0 0 10px", fontFamily: "Montserrat,sans-serif", fontSize: 16 }}>Add Episode</h3>
                <form className="episode-form" onSubmit={saveEpisode}>
                  <div className="episode-form-row">
                    <label className="field-label">
                      Season #
                      <input className="field" type="number" value={episodeForm.seasonNumber} onChange={episodeField("seasonNumber")} min="1" />
                    </label>
                    <label className="field-label">
                      Episode # *
                      <input className="field" type="number" value={episodeForm.episodeNumber} onChange={episodeField("episodeNumber")} min="1" required />
                    </label>
                    <label className="field-label">
                      Duration (sec)
                      <input className="field" type="number" value={episodeForm.durationSeconds} onChange={episodeField("durationSeconds")} placeholder="2700" />
                    </label>
                  </div>
                  <label className="field-label">
                    Episode Title
                    <input className="field" value={episodeForm.title} onChange={episodeField("title")} placeholder="Episode title (optional)" />
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
                    <label className="field-label">
                      Video URL
                      <input className="field" type="url" value={episodeForm.videoUrl} onChange={episodeField("videoUrl")} placeholder="https://cdn.example.com/ep1.mp4" />
                    </label>
                    <label className="field-label">
                      Quality
                      <select className="field select-field" value={episodeForm.quality} onChange={episodeField("quality")}>
                        {["4K", "1080p", "720p", "480p"].map((q) => <option key={q}>{q}</option>)}
                      </select>
                    </label>
                  </div>
                  <div>
                    <button className="btn btn-primary" type="submit" disabled={savingEpisode}>
                      <Icon name="add" />{savingEpisode ? "Adding..." : "Add Episode"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Form actions (not in episodes tab) */}
            {activeFormTab !== "episodes" && (
              <div className="actions">
                <button className="btn btn-ghost" type="button" onClick={() => { setShowForm(false); setEditingMovieId(null); setMovieForm(emptyMovie); }}>
                  Cancel
                </button>
                <button className="btn btn-primary" disabled={saving} type="submit">
                  <Icon name={saving ? "hourglass_empty" : "save"} />
                  {saving ? "Saving..." : editingMovieId ? "Update Movie" : "Create Movie"}
                </button>
              </div>
            )}
          </form>
        </section>
      )}

      {/* Catalog Table */}
      <section className="admin-panel">
        <div className="section-header" style={{ padding: "18px 22px" }}>
          <h2 className="section-title" style={{ fontSize: 20 }}>
            Catalog
            <span className="muted" style={{ fontSize: 14, fontWeight: 500, marginLeft: 10 }}>
              {filteredMovies.length} {searchQuery ? "results" : "movies"}
            </span>
          </h2>
          <div className="search-field" style={{ width: 280 }}>
            <Icon name="search" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search catalog..."
              style={{ flex: 1, border: 0, background: "transparent", outline: 0, color: "var(--text)" }} />
          </div>
        </div>
        {loading ? (
          <p className="muted" style={{ padding: 24 }}>Loading catalog...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Genre</th>
                <th>Year</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovies.map((movie) => (
                <tr key={movie.id ?? movie.title}>
                  <td>
                    <strong style={{ fontSize: 14 }}>{movie.title}</strong>
                    {movie.raw?.ageRating && (
                      <span className="pill" style={{ marginLeft: 8, fontSize: 10 }}>{movie.raw.ageRating}</span>
                    )}
                  </td>
                  <td>
                    <span className="pill" style={{ fontSize: 11, textTransform: "capitalize" }}>
                      {movie.raw?.type ?? (movie.duration === "Series" ? "series" : "movie")}
                    </span>
                  </td>
                  <td className="muted" style={{ fontSize: 13 }}>{movie.genre}</td>
                  <td className="muted">{movie.year}</td>
                  <td>
                    <span style={{ color: "var(--primary)", fontWeight: 700 }}>⭐ {movie.rating}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="icon-button" title="Edit" onClick={() => startEdit(movie)} type="button">
                        <Icon name="edit" />
                      </button>
                      <button className="icon-button" title="Delete" onClick={() => confirmDelete(movie)} type="button"
                        style={{ color: "#ff8080" }}>
                        <Icon name="delete" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Movie"
        message={`Are you sure you want to remove "${pendingDelete?.title}" from the catalog? This action can be undone by an admin.`}
        confirmLabel="Delete"
        onConfirm={executeDelete}
        onCancel={() => { setConfirmOpen(false); setPendingDelete(null); }}
        danger
      />
    </AdminShell>
  );
}
