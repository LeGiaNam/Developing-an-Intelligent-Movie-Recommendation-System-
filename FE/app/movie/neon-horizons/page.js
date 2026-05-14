import { MovieRail } from "@/components/MovieCard";
import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icon";
import { images, movies } from "@/lib/data";

export default function MovieDetailsPage() {
  return (
    <div className="app-shell">
      <NavBar active="/movies" />
      <section className="hero detail-hero" style={{ backgroundImage: `url(${images.detailsHero})` }}>
        <div className="hero-content">
          <div className="eyebrow">
            <span>IPANMOVIE Original</span>
            <span className="pill">4K HDR</span>
            <span className="muted">2026 · 2h 18m</span>
          </div>
          <h1 className="title-xl">Neon Horizons</h1>
          <p className="lead">
            A courier in a rain-lit megacity finds a living algorithm that can predict desire, forcing every faction in the
            city to chase the one person who no longer wants to be found.
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
            <button className="btn btn-ghost">
              <Icon name="thumb_up" />
              Rate
            </button>
          </div>
        </div>
      </section>
      <main className="container">
        <section className="section feature-grid">
          <div className="glass-panel">
            <h2 className="section-title">Synopsis</h2>
            <p className="lead">
              Built from the Stitch movie-detail screen, this page keeps the cinematic backdrop, cast area, metadata panel,
              comments, and similar-title rail. It is ready for trailer and recommendation APIs later.
            </p>
            <h2 className="section-title">Cast & Crew</h2>
            <div className="chips">
              {["Lina Park", "Orion Vale", "Mika Stone", "Director: Hana Cruz"].map((item) => (
                <span className="pill" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="glass-panel">
            <h2 className="section-title">Metadata</h2>
            <div className="metadata-grid">
              {[
                ["Match", "98%"],
                ["IMDb", "8.9"],
                ["Audio", "Dolby"],
                ["Quality", "4K"],
              ].map(([label, value]) => (
                <div className="meta-box" key={label}>
                  <span className="muted">{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="section glass-panel">
          <h2 className="section-title">Community Resonance</h2>
          <p className="muted">Viewers who liked cerebral sci-fi and noir thrillers are rating this highly this week.</p>
        </section>
      </main>
      <MovieRail title="Similar Horizons" movies={movies.slice(1)} />
    </div>
  );
}
