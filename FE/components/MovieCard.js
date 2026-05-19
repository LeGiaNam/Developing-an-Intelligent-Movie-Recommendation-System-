import Image from "next/image";
import Link from "next/link";
import { Icon } from "./Icon";

export function MovieCard({ movie, wide = false, progress }) {
  if (!movie) return null;

  const href = movie.id ? `/movie/${movie.id}` : `/movie/${movie.slug ?? ""}`;

  return (
    <Link className={wide ? "wide-card" : "poster-card"} href={href}>
      {movie.image ? <Image src={movie.image} alt={`${movie.title} artwork`} fill sizes={wide ? "320px" : "220px"} /> : <div className="poster-fallback" />}
      <span className="poster-play" aria-hidden="true">
        <Icon name="play_arrow" filled />
      </span>
      <div className="card-overlay">
        <h3 className="card-title">{movie.title}</h3>
        <span className="muted">
          {movie.genre} / {movie.year} / {movie.rating}
        </span>
      </div>
      {progress ? (
        <div className="progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </Link>
  );
}

export function MovieRail({ title, movies, wide = false, exploreHref = "/browse" }) {
  if (!movies?.length) return null;

  return (
    <section className="section container">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <Link className="pill" href={exploreHref}>
          Explore all
        </Link>
      </div>
      <div className="rail">
        {movies.map((movie, index) => (
          <MovieCard key={`${title}-${movie.id ?? movie.title}`} movie={movie} wide={wide} progress={wide ? (index + 2) * 13 : undefined} />
        ))}
      </div>
    </section>
  );
}
