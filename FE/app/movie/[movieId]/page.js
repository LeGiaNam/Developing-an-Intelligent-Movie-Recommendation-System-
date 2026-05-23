"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { MovieRail } from "@/components/MovieCard";
import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
import { api, getCachedMovies, mapMovie } from "@/lib/api";
import { getActiveProfileId, getToken } from "@/lib/auth";

function formatDate(value) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function profileName(profile) {
  return profile?.name ?? "IPANMOVIE viewer";
}

function sourceIsPlayable(source) {
  return Boolean(source?.url && !source.url.includes("example.com"));
}

function bestPlayableSource(sources = []) {
  return sources.find(sourceIsPlayable);
}

function durationLabel(seconds) {
  if (!seconds) return "Duration pending";
  return `${Math.max(Math.round(seconds / 60), 1)} min`;
}

export default function MovieDetailsPage() {
  const { movieId } = useParams();
  const { toast } = useToast();
  const [cachedMovies, setCachedMovies] = useState([]);
  const [movie, setMovie] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [ratingScore, setRatingScore] = useState(5);
  const [userRating, setUserRating] = useState(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [activeProfileId, setActiveProfileId] = useState(null);
  
  const lastSyncTimeRef = useRef(0);

  const handleTimeUpdate = (e) => {
    const video = e.target;
    const currentTime = video.currentTime;
    const duration = video.duration;
    
    // Sync every 10 seconds or when video ends
    if (currentTime - lastSyncTimeRef.current >= 10 || currentTime >= duration - 1) {
      lastSyncTimeRef.current = currentTime;
      if (activeProfileId) {
        api.updateHistory(
          activeProfileId, 
          movieId, 
          currentTime, 
          duration, 
          getToken(), 
          selectedEpisode?._id
        ).catch(() => {});
      }
    }
  };

  useEffect(() => {
    if (!movieId) return;
    const cached = getCachedMovies();
    const profId = getActiveProfileId();
    setActiveProfileId(profId);
    queueMicrotask(() => {
      setCachedMovies(cached);
      setMovie(cached.find((item) => item.id === movieId) ?? null);
    });

    api
      .movie(movieId)
      .then((item) => { if (item) setMovie(mapMovie(item)); })
      .catch((error) => toast(error.message, "error"));

    const token = getToken();
    if (token && profId) {
      api.getRatings(profId, token).then((ratings) => {
        const rating = ratings.find((r) => r.movieId?._id === movieId || r.movieId === movieId);
        if (rating) { setRatingScore(rating.score); setUserRating(rating); }
      }).catch(() => {});

      // Check if already in watchlist
      api.watchlist(profId, token).then((items) => {
        const found = items.some((item) =>
          (item.movieId?._id ?? item.movieId ?? item._id ?? item.id) === movieId
        );
        setInWatchlist(found);
      }).catch(() => {});
    }

    api.episodes(movieId).then(setEpisodes).catch(() => setEpisodes([]));
    api.similar(movieId).then((items) => setSimilarMovies(items.map(mapMovie).filter(Boolean))).catch(() => setSimilarMovies([]));
    api.comments(movieId).then(setComments).catch(() => setComments([]));
  }, [movieId]);

  const similar = similarMovies.length ? similarMovies : cachedMovies.filter((item) => item.id !== movie?.id).slice(0, 10);
  const cast = movie?.raw?.cast ?? movie?.raw?.casts ?? [];
  const directors = movie?.raw?.directors ?? [];
  const countries = movie?.raw?.countries ?? [];
  const videoSources = movie?.raw?.videoSources ?? [];
  const isSeries = movie?.raw?.type === "series" || movie?.duration === "Series";
  const activeSources = selectedEpisode ? selectedEpisode.videoSources ?? [] : videoSources;
  const playableSource = bestPlayableSource(activeSources);
  const playerTitle = selectedEpisode
    ? `${movie?.title ?? "Series"} - S${selectedEpisode.seasonNumber ?? 1}:E${selectedEpisode.episodeNumber ?? 1} ${selectedEpisode.title ?? ""}`.trim()
    : movie?.title ?? "Movie";
  const trailerUrl = movie?.raw?.trailerUrl ?? "";
  const hasPlaybackSource = Boolean(playableSource?.url);

  async function runProfileAction(action) {
    const token = getToken();
    const profileId = getActiveProfileId();
    if (!token || !profileId) {
      toast("Sign in and choose a profile first.", "warn");
      return;
    }
    if (!movie?.id) {
      toast("Movie is still loading.", "warn");
      return;
    }
    try {
      await action(profileId, movie.id, token);
    } catch (error) {
      toast(error.message, "error");
    }
  }

  function toggleWatchlist() {
    runProfileAction(async (profileId, movieIdValue, token) => {
      if (inWatchlist) {
        await api.removeFromWatchlist(profileId, movieIdValue, token);
        setInWatchlist(false);
        toast("Removed from your list.", "info");
      } else {
        await api.addToWatchlist(profileId, movieIdValue, token);
        setInWatchlist(true);
        toast("Added to your list!", "success");
      }
    });
  }

  function rateMovie() {
    runProfileAction(async (profileId, movieIdValue, token) => {
      await api.rateMovie(profileId, movieIdValue, ratingScore, token);
      setUserRating(ratingScore);
      setMovie((current) => current ? {
        ...current,
        rating: ratingScore.toFixed(1),
        raw: { ...current.raw, averageRating: ratingScore },
      } : current);
      toast(`Rated ${ratingScore} stars! Thank you.`, "success");
    });
  }

  async function openPlayer(episode = null) {
    const targetEpisode = episode ?? (isSeries ? episodes[0] ?? null : null);
    setSelectedEpisode(targetEpisode);
    setShowPlayer(true);
    const token = getToken();
    const profileId = getActiveProfileId();
    if (!token || !profileId || !movie?.id) {
      if (isSeries && !targetEpisode) {
        toast("This series does not have episodes yet.", "warn");
      }
      return;
    }
    try {
      const durationSeconds = targetEpisode?.durationSeconds ?? movie?.raw?.durationSeconds ?? 3600;
      await api.updateHistory(profileId, movie.id, 60, durationSeconds, token, targetEpisode?._id ?? null);
    } catch {
      // silent
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    const token = getToken();
    const profileId = getActiveProfileId();
    const content = commentText.trim();
    if (!token || !profileId) {
      toast("Sign in and choose a profile before commenting.", "warn");
      return;
    }
    if (!content || !movie?.id) return;
    try {
      const created = await api.addComment(movie.id, profileId, content, token);
      setComments((current) => [created, ...current].slice(0, 10));
      setCommentText("");
      toast("Comment posted!", "success");
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function handleUpdateComment(commentId) {
    const token = getToken();
    const profileId = getActiveProfileId();
    const content = editCommentText.trim();
    if (!token || !profileId || !content) return;
    try {
      const updated = await api.updateComment(commentId, profileId, content, token);
      setComments((current) => current.map((c) => (c._id === commentId || c.id === commentId ? { ...c, content: updated.content } : c)));
      setEditingCommentId(null);
      setEditCommentText("");
      toast("Comment updated.", "success");
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function handleDeleteComment(commentId) {
    const token = getToken();
    const profileId = getActiveProfileId();
    if (!token || !profileId) return;
    if (!window.confirm("Delete this comment?")) return;
    try {
      await api.deleteComment(commentId, profileId, token);
      setComments((current) => current.filter((c) => c._id !== commentId && c.id !== commentId));
      toast("Comment deleted.", "success");
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function handleCommentAction(commentId, action) {
    const token = getToken();
    const profileId = getActiveProfileId();
    if (!token || !profileId) {
      toast(`Sign in to ${action} this comment.`, "warn");
      return;
    }
    try {
      const updated = await api.commentAction(commentId, profileId, action, token);
      setComments((current) => current.map((c) => (c._id === commentId || c.id === commentId ? updated : c)));
      if (action === "report") toast("Comment reported. Our team will review it.", "success");
    } catch (error) {
      toast(error.message, "error");
    }
  }

  return (
    <div className="app-shell">
      <NavBar active="/movies" />
      <section className="hero detail-hero" style={{ backgroundImage: movie?.backdropUrl ? `url(${movie.backdropUrl})` : undefined }}>
        <div className="hero-content">
          <div className="eyebrow">
            <span>IPANMOVIE Catalog</span>
            {movie ? <span className="pill">{movie.genre}</span> : null}
            {movie ? <span className="muted">{movie.year} / {movie.duration}</span> : null}
          </div>
          <h1 className="title-xl">{movie?.title ?? "Movie"}</h1>
          <p className="lead">{movie?.description ?? "Loading movie metadata from the backend catalog."}</p>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => openPlayer()} type="button">
              <Icon name="play_arrow" filled />
              {isSeries ? "Play Episode 1" : "Play"}
            </button>
            <button
              className={`btn btn-ghost${inWatchlist ? " btn-watchlist-active" : ""}`}
              onClick={toggleWatchlist}
              type="button"
            >
              <Icon name={inWatchlist ? "bookmark" : "bookmark_add"} />
              {inWatchlist ? "In My List" : "Add to My List"}
            </button>
            <div className="rating-control" aria-label="Rate movie">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  className={`rating-star ${ratingScore >= score ? "active" : ""}`}
                  key={score}
                  onClick={() => setRatingScore(score)}
                  type="button"
                  aria-label={`Choose ${score} stars`}
                >
                  <span aria-hidden="true">★</span>
                </button>
              ))}
              <span className="rating-value">{ratingScore}/5</span>
              <button className="btn btn-ghost" onClick={rateMovie} type="button">
                <Icon name={userRating ? "star" : "thumb_up"} />
                {userRating ? "Rated" : "Rate"}
              </button>
            </div>
          </div>
        </div>
      </section>
      <main className="container">
        <section className="section feature-grid">
          <div className="glass-panel">
            <h2 className="section-title">Synopsis</h2>
            <p className="lead">{movie?.description || "No synopsis available yet."}</p>
            <h2 className="section-title">Cast & Crew</h2>
            <div className="chips">
              {[...cast.slice(0, 4), ...directors.map((name) => `Director: ${name}`).slice(0, 2)].map((item) => (
                <span className="pill" key={item}>
                  {item}
                </span>
              ))}
              {cast.length === 0 && directors.length === 0 ? <span className="pill">Updating metadata</span> : null}
            </div>
          </div>
          <div className="glass-panel metadata-panel">
            <h2 className="section-title">Metadata</h2>
            <div className="metadata-grid detail-metadata">
              {[
                ["Rating", movie?.rating ?? "N/A", `${movie?.raw?.ratingCount ?? 0} votes`],
                ["Format", movie?.duration ?? "N/A", movie?.raw?.ageRating ?? "All viewers"],
                ["Release", movie?.year || "N/A", countries.join(", ") || "Global"],
                ["Episodes", isSeries ? episodes.length || "N/A" : "N/A", isSeries ? `${episodes.length} listed` : videoSources.length ? `${videoSources.length} sources` : "No stream"],
              ].map(([label, value, detail]) => (
                <div className="meta-box" key={label}>
                  <span className="meta-label">{label}</span>
                  <strong>{value}</strong>
                  <span className="muted">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="section glass-panel">
          <h2 className="section-title">Community Resonance</h2>
          <p className="muted">Viewers are rating this {movie?.rating ?? "N/A"} in the seeded catalog.</p>
        </section>
        {isSeries ? (
          <section className="section glass-panel">
            <div className="section-header">
              <h2 className="section-title">Episodes</h2>
              <span className="pill">{episodes.length}</span>
            </div>
            <div className="episode-list">
              {episodes.map((episode) => {
                const hasEpisodeSource = Boolean(bestPlayableSource(episode.videoSources ?? []));
                return (
                  <button className="episode-row" key={episode._id ?? `${episode.seasonNumber}-${episode.episodeNumber}`} onClick={() => openPlayer(episode)} type="button">
                    <span className="episode-number">S{episode.seasonNumber ?? 1}:E{episode.episodeNumber ?? 1}</span>
                    <span className="episode-copy">
                      <strong>{episode.title ?? `Episode ${episode.episodeNumber ?? ""}`}</strong>
                      <span className="muted">{durationLabel(episode.durationSeconds)} / {hasEpisodeSource ? `${episode.videoSources?.length ?? 1} source` : "Source pending"}</span>
                    </span>
                    <span className="episode-play">
                      <Icon name="play_arrow" filled />
                    </span>
                  </button>
                );
              })}
              {episodes.length === 0 ? <p className="muted">No episodes published yet.</p> : null}
            </div>
          </section>
        ) : null}
        <section className="section glass-panel">
          <div className="section-header">
            <h2 className="section-title">Comments</h2>
            <span className="pill">{comments.length}</span>
          </div>
          <form className="filter-stack" onSubmit={submitComment}>
            <textarea
              className="field"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Share a thought about this title..."
              maxLength={500}
              rows={3}
            />
            <div className="actions">
              <button className="btn btn-primary" type="submit">
                <Icon name="add" />
                Post Comment
              </button>
            </div>
          </form>
          <div className="notice-list" style={{ marginTop: 18 }}>
            {comments.map((comment) => (
              <article className="comment-card" key={comment._id ?? comment.id}>
                {comment.profileId?.avatarUrl ? (
                  <Image className="comment-avatar" src={comment.profileId.avatarUrl} alt={profileName(comment.profileId)} width={48} height={48} />
                ) : (
                  <span className="comment-avatar-fallback">{profileName(comment.profileId).slice(0, 1).toUpperCase()}</span>
                )}
                <div className="comment-body">
                  <div className="comment-meta">
                    <h3 className="card-title">{profileName(comment.profileId)}</h3>
                    <span className="muted">{formatDate(comment.createdAt)}</span>
                  </div>
                  {editingCommentId === (comment._id ?? comment.id) ? (
                    <div className="filter-stack" style={{ marginTop: 8 }}>
                      <textarea
                        className="field"
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                        rows={2}
                      />
                      <div className="actions" style={{ marginTop: 8 }}>
                        <button className="btn btn-primary" style={{ padding: "4px 12px", fontSize: 13 }} onClick={() => handleUpdateComment(comment._id ?? comment.id)}>Save</button>
                        <button className="btn btn-ghost" style={{ padding: "4px 12px", fontSize: 13 }} onClick={() => setEditingCommentId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className="muted">{comment.content}</p>
                  )}
                  {activeProfileId === (comment.profileId?._id ?? comment.profileId?.id ?? comment.profileId) && editingCommentId !== (comment._id ?? comment.id) ? (
                    <div className="actions" style={{ marginTop: 8 }}>
                      <button className="link-button" onClick={() => { setEditingCommentId(comment._id ?? comment.id); setEditCommentText(comment.content); }}>Edit</button>
                      <button className="link-button" onClick={() => handleDeleteComment(comment._id ?? comment.id)}>Delete</button>
                    </div>
                  ) : (
                    <div className="actions" style={{ marginTop: 8, gap: 16 }}>
                      <button
                        className="link-button"
                        style={{ display: "flex", alignItems: "center", gap: 4, color: comment.likes?.includes(activeProfileId) ? "var(--primary)" : "var(--muted)" }}
                        onClick={() => handleCommentAction(comment._id ?? comment.id, "like")}
                      >
                        <Icon name="thumb_up" style={{ width: 14, height: 14 }} /> {comment.likes?.length || 0}
                      </button>
                      <button
                        className="link-button"
                        style={{ display: "flex", alignItems: "center", gap: 4, color: comment.dislikes?.includes(activeProfileId) ? "var(--secondary)" : "var(--muted)" }}
                        onClick={() => handleCommentAction(comment._id ?? comment.id, "dislike")}
                      >
                        <Icon name="thumb_down" style={{ width: 14, height: 14 }} /> {comment.dislikes?.length || 0}
                      </button>
                      <button
                        className="link-button"
                        style={{ display: "flex", alignItems: "center", gap: 4, color: comment.reports?.includes(activeProfileId) ? "#ff8080" : "var(--muted)" }}
                        onClick={() => handleCommentAction(comment._id ?? comment.id, "report")}
                        title="Report this comment"
                      >
                        <Icon name="flag" style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
            {comments.length === 0 ? <p className="muted">No comments yet.</p> : null}
          </div>
        </section>
      </main>
      {showPlayer ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Movie player">
          <section className="player-modal">
            <div className="section-header">
              <div>
                <h2 className="section-title">{playerTitle}</h2>
                <p className="muted">{playableSource?.quality ?? (trailerUrl && !selectedEpisode ? "Trailer available" : "Source pending")}</p>
              </div>
              <button className="icon-button" onClick={() => setShowPlayer(false)} type="button" aria-label="Close player">
                <Icon name="close" />
              </button>
            </div>
            {playableSource?.url ? (
              <video className="movie-player" src={playableSource.url} controls autoPlay onTimeUpdate={handleTimeUpdate} onEnded={handleTimeUpdate} />
            ) : (
              <div className="player-empty">
                <Icon name="live_tv" />
                <strong>No playable stream available</strong>
                <span className="muted">{selectedEpisode ? "This episode exists, but its stream source has not been published." : "This title is in the catalog, but its stream source has not been published."}</span>
                {trailerUrl && !selectedEpisode ? (
                  <a className="btn btn-ghost" href={trailerUrl} target="_blank" rel="noreferrer">
                    Open Trailer
                  </a>
                ) : null}
              </div>
            )}
          </section>
        </div>
      ) : null}
      <MovieRail title="Similar Titles" movies={similar} />
    </div>
  );
}
