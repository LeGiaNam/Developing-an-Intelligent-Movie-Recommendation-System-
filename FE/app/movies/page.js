import { MovieCard, MovieRail } from "@/components/MovieCard";
import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icon";
import { images, movies } from "@/lib/data";

export default function MoviesPage() {
  return (
    <div className="app-shell">
      <NavBar active="/movies" />
      <section className="hero" style={{ backgroundImage: `url(${images.moviesHero})` }}>
        <div className="hero-content">
          <div className="eyebrow">
            <span>Featured Movie</span>
            <span className="pill">4K</span>
            <span className="muted">Recommendation score 97%</span>
          </div>
          <h1 className="title-xl">Echoes of Eternity</h1>
          <p className="lead">
            A curated cinema wall with editorial picks, popular titles, and fast scanning for repeat viewing sessions.
          </p>
          <div className="actions">
            <button className="btn btn-primary">
              <Icon name="play_arrow" filled />
              Watch Now
            </button>
            <button className="btn btn-ghost">
              <Icon name="info" />
              Details
            </button>
          </div>
        </div>
      </section>
      <MovieRail title="Popular on IPANMOVIE" movies={movies} />
      <section className="section container">
        <div className="section-header">
          <h2 className="section-title">All Movies</h2>
          <div className="chips">
            {["Action", "Sci-Fi", "Drama", "Fantasy"].map((chip) => (
              <span className="pill" key={chip}>
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div className="grid-posters">
          {[...movies, ...movies].map((movie, index) => (
            <MovieCard key={`${movie.title}-${index}`} movie={movie} />
          ))}
        </div>
      </section>
    </div>
  );
}
