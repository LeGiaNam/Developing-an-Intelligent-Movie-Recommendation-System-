"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MovieCard, MovieRail } from "@/components/MovieCard";
import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icon";
import { SkeletonRail, SkeletonGrid, EmptyState } from "@/components/EmptyState";
import { getCachedMovies, loadMovies, api, mapMovie } from "@/lib/api";
import { getActiveProfileId, getToken } from "@/lib/auth";

const GENRES = ["Action", "Sci-Fi", "Drama", "Fantasy", "Thriller", "Comedy", "Horror", "Romance"];

export default function SeriesPage() {
  const router = useRouter();
  const [movies, setMovies] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const cached = getCachedMovies("series");
    if (cached.length) { setMovies(cached); setLoading(false); }

    loadMovies("series", 1)
      .then((items) => {
        setMovies(items);
        setHasMore(items.length === 24);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const token = getToken();
    const profileId = getActiveProfileId();
    if (token && profileId) {
      api.personalized(profileId, token)
        .then((items) => setRecommended(items.map(mapMovie).filter(Boolean)))
        .catch(() => {});
    }
  }, []);

  const featured = useMemo(() => movies[0] ?? null, [movies]);

  const filtered = useMemo(() => {
    if (!activeGenre) return movies;
    return movies.filter((m) =>
      (Array.isArray(m.genres) ? m.genres : [m.genre]).some(
        (g) => g?.toLowerCase() === activeGenre.toLowerCase()
      )
    );
  }, [movies, activeGenre]);

  function toggleGenre(genre) {
    setActiveGenre((prev) => (prev === genre ? null : genre));
  }

  function loadMoreMovies() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    loadMovies("series", nextPage)
      .then((items) => {
        setMovies((prev) => [...prev, ...items]);
        setPage(nextPage);
        setHasMore(items.length === 24);
        setLoadingMore(false);
      })
      .catch(() => setLoadingMore(false));
  }

  return (
    <div className="app-shell">
      <NavBar active="/series" />

      {/* Hero Section */}
      {loading ? (
        <div className="hero" style={{ alignItems: "center" }}>
          <div className="hero-content">
            <div className="skeleton skeleton-text" style={{ width: 120, height: 16 }} />
            <div className="skeleton skeleton-text" style={{ width: 400, height: 56, marginTop: 12 }} />
            <div className="skeleton skeleton-text" style={{ width: 280, height: 20, marginTop: 14 }} />
          </div>
        </div>
      ) : (
        <section
          className="hero"
          style={{ backgroundImage: featured?.backdropUrl ? `url(${featured.backdropUrl})` : undefined }}
        >
          <div className="hero-content">
            <div className="eyebrow">
              <span>Featured TV Series</span>
              {featured && <span className="pill">{featured.genre}</span>}
              {featured && <span className="muted">⭐ {featured.rating}</span>}
            </div>
            <h1 className="title-xl">{featured?.title ?? "TV Series"}</h1>
            <p className="lead">
              {featured?.description ?? "Explore our full catalog of TV series and episodes."}
            </p>
            <div className="actions">
              {featured ? (
                <>
                  <Link className="btn btn-primary" href={`/movie/${featured.id}`}>
                    <Icon name="play_arrow" filled />
                    Watch Now
                  </Link>
                  <Link className="btn btn-ghost" href={`/movie/${featured.id}`}>
                    <Icon name="info" />
                    Details
                  </Link>
                </>
              ) : (
                <Link className="btn btn-ghost" href="/browse">
                  <Icon name="search" />
                  Browse All
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Popular Rail */}
      {loading ? (
        <SkeletonRail count={5} />
      ) : recommended.length > 0 ? (
        <MovieRail title="Recommended For You (AI)" movies={recommended.slice(0, 10)} />
      ) : (
        <MovieRail title="Popular on IPANMOVIE" movies={movies.slice(0, 10)} />
      )}

      {/* Genre filter + All Movies grid */}
      <section className="section container">
        <div className="section-header">
          <h2 className="section-title">
            All TV Series
            {activeGenre && <span style={{ color: "var(--primary)", fontSize: "0.6em", marginLeft: 12 }}>— {activeGenre}</span>}
          </h2>
          {activeGenre && (
            <button className="pill chip-btn" onClick={() => setActiveGenre(null)} type="button">
              <Icon name="close" />
              Clear
            </button>
          )}
        </div>

        {/* Genre chips */}
        <div className="chips" style={{ marginBottom: 24 }}>
          {GENRES.map((genre) => (
            <button
              key={genre}
              className={`pill chip-btn${activeGenre === genre ? " active" : ""}`}
              onClick={() => toggleGenre(genre)}
              type="button"
            >
              {genre}
            </button>
          ))}
          <button
            className="pill chip-btn"
            onClick={() => router.push("/browse")}
            type="button"
          >
            <Icon name="tune" />
            Advanced Filter
          </button>
        </div>

        {loading ? (
          <SkeletonGrid count={12} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="movie_filter"
            title={`No ${activeGenre ?? ""} TV series found`}
            description="Try a different genre or browse the full catalog."
            action="Clear filter"
            onAction={() => setActiveGenre(null)}
          />
        ) : (
          <>
            <div className="grid-posters">
              {filtered.map((movie) => (
                <MovieCard key={movie.id ?? movie.title} movie={movie} />
              ))}
            </div>
            {hasMore && !activeGenre && (
              <div style={{ textAlign: "center", marginTop: 40 }}>
                <button
                  className="btn btn-primary"
                  onClick={loadMoreMovies}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
