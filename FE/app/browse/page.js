import { MovieCard } from "@/components/MovieCard";
import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icon";
import { movies } from "@/lib/data";

export default function BrowsePage() {
  return (
    <div className="app-shell">
      <NavBar active="/browse" />
      <main className="container section">
        <div className="section-header">
          <div>
            <h1 className="title-xl" style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>
              Search & Browse
            </h1>
            <p className="lead">Find movies by title, genre, rating, release year, or hybrid recommendation signal.</p>
          </div>
          <button className="btn btn-primary">
            <Icon name="tune" />
            Apply
          </button>
        </div>
        <div className="split">
          <aside className="glass-panel filter-stack">
            <div className="section-header">
              <h2 className="section-title">Filters</h2>
              <button className="btn btn-ghost">Reset</button>
            </div>
            <label className="field-label">
              Search
              <input className="field" placeholder="Actor, director, title..." />
            </label>
            <label className="field-label">
              Genre
              <select className="select-field">
                <option>All genres</option>
                <option>Sci-Fi</option>
                <option>Thriller</option>
                <option>Drama</option>
              </select>
            </label>
            <div className="field-label">
              Rating
              <div className="chips">
                {["4+ Stars", "3+ Stars", "All"].map((item) => (
                  <span className="pill" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <label className="field-label">
              Release Year
              <input className="field" defaultValue="2026" />
            </label>
          </aside>
          <section>
            <div className="section-header">
              <h2 className="section-title">Results</h2>
              <span className="muted">{movies.length * 2} titles</span>
            </div>
            <div className="grid-posters">
              {[...movies, ...movies].map((movie, index) => (
                <MovieCard key={`${movie.title}-browse-${index}`} movie={movie} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
