"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Icon } from "@/components/Icon";
import { api, fallback, mapMovie } from "@/lib/api";

export default function AdminPage() {
  const [movies, setMovies] = useState(fallback.movies);
  const [status, setStatus] = useState("");

  useEffect(() => {
    api
      .movies()
      .then((items) => setMovies(items.map(mapMovie)))
      .catch(() => setStatus("Backend unavailable. Showing mock catalog."));
  }, []);

  const seriesCount = movies.filter((movie) => movie.duration === "Series").length;

  return (
    <AdminShell active="/admin">
      <div className="section-header">
        <div>
          <h1 className="title-xl" style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>
            Movie Manager
          </h1>
          <p className="muted">{status || "Manage catalog metadata, posters, publication state, and encoding status."}</p>
        </div>
        <button className="btn btn-primary">
          <Icon name="add" />
          Add Movie
        </button>
      </div>
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
            <input placeholder="Search movies" />
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
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => (
              <tr key={movie.id ?? movie.title}>
                <td>{movie.title}</td>
                <td>{movie.genre}</td>
                <td>{movie.year}</td>
                <td>{movie.rating}</td>
                <td>
                  <span className="pill">Published</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
