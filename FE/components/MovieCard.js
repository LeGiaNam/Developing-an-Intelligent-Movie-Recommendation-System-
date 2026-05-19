import Image from "next/image";
import Link from "next/link";
import { Icon } from "./Icon";

export function MovieCard({ movie, wide = false, progress }) {
  const href = movie?.id ? `/movie/${movie.id}` : `/movie/${movie?.slug ?? "neon-horizons"}`;

  return (
    <Link className={wide ? "wide-card" : "poster-card"} href={href}>
      <Image src={movie.image} alt={`${movie.title} artwork`} fill sizes={wide ? "320px" : "220px"} />
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

export function MovieRail({ title, movies, wide = false }) {
  return (
    <section className="section container">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <span className="pill">Explore all</span>
      </div>
      <div className="rail">
        {movies.map((movie, index) => (
          <MovieCard key={`${title}-${movie.title}`} movie={movie} wide={wide} progress={wide ? (index + 2) * 13 : undefined} />
        ))}
      </div>
    </section>
  );
}
