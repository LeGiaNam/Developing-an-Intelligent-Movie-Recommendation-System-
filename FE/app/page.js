import { MovieRail } from "@/components/MovieCard";
import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icon";
import { images, movies } from "@/lib/data";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="app-shell">
      <NavBar active="/" />
      <section className="hero" style={{ backgroundImage: `url(${images.homeHero})` }}>
        <div className="hero-content">
          <div className="eyebrow">
            <span>New Release</span>
            <span className="pill">PG-13</span>
            <span className="muted">2h 15m</span>
          </div>
          <h1 className="title-xl">Echoes of Eternity</h1>
          <p className="lead">
            In a future where memories can be extracted and sold, a rogue archivist discovers a fragmented memory that holds
            the key to humanity&apos;s survival.
          </p>
          <div className="actions">
            <button className="btn btn-primary">
              <Icon name="play_arrow" filled />
              Play
            </button>
            <button className="btn btn-ghost">
              <Icon name="add" />
              My List
            </button>
          </div>
        </div>
      </section>
      <MovieRail title="Continue Watching" movies={movies.slice(2, 6)} wide />
      <section className="section container">
        <div className="section-header">
          <h2 className="section-title">Trending Now</h2>
          <span className="pill">
            <Icon name="local_fire_department" filled />
            #1 Trending
          </span>
        </div>
        <div className="feature-grid">
          <div className="poster-card" style={{ minHeight: 520, aspectRatio: "16 / 10" }}>
            <Image src={movies[0].image} alt="Neon Horizons poster" fill sizes="(max-width: 980px) 100vw, 60vw" />
            <div className="card-overlay">
              <span className="pill">Hybrid Match · 98%</span>
              <h3 className="section-title">Neon Horizons</h3>
              <p className="muted">Cyberpunk scale, intimate stakes, and electric-blue recommendation confidence.</p>
            </div>
          </div>
          <div className="grid-posters">
            {movies.slice(1, 5).map((movie) => (
              <div className="poster-card" key={movie.title}>
                <Image src={movie.image} alt={`${movie.title} poster`} fill sizes="220px" />
                <div className="card-overlay">
                  <h3 className="card-title">{movie.title}</h3>
                  <span className="muted">{movie.rating} rating</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <MovieRail title="Because You Watched Sci-Fi" movies={movies} />
    </div>
  );
}
