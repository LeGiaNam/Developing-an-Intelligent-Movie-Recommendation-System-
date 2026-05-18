import { MovieRail } from "@/components/MovieCard";
import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icon";
import { images, movieImages, movies } from "@/lib/data";
import Image from "next/image";

export default function UserProfilePage() {
  return (
    <div className="app-shell profile-page">
      <NavBar />
      <section className="profile-hero" style={{ backgroundImage: `url(${movieImages[3]})` }}>
        <div className="container">
          <Image className="avatar" src={images.avatar} alt="Alex Mercer" width={92} height={92} style={{ width: 92, height: 92 }} />
          <h1 className="title-xl" style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>
            Alex Mercer
          </h1>
          <p className="muted">Premium profile · Sci-Fi, Thriller, Animation · 312 watched titles</p>
        </div>
      </section>
      <main className="container section">
        <div className="feature-grid">
          <section className="glass-panel filter-stack">
            <h2 className="section-title">Personal Information</h2>
            <div className="form-grid">
              <label className="field-label">
                Display name
                <input className="field" defaultValue="Alex Mercer" />
              </label>
              <label className="field-label">
                Email
                <input className="field" defaultValue="alex@example.com" />
              </label>
            </div>
            <h2 className="section-title">Change Password</h2>
            <div className="form-grid">
              <input className="field" placeholder="Current password" type="password" />
              <input className="field" placeholder="New password" type="password" />
            </div>
            <div className="actions">
              <button className="btn btn-ghost">Cancel</button>
              <button className="btn btn-primary">Save Changes</button>
            </div>
          </section>
          <aside className="glass-panel filter-stack">
            <h2 className="section-title">Watch Preferences</h2>
            {["Autoplay trailers", "Kids content hidden", "Vietnamese subtitles", "Email recommendations"].map((item) => (
              <label className="section-header" key={item}>
                <span>{item}</span>
                <input type="checkbox" defaultChecked />
              </label>
            ))}
            <div className="chips">
              {["Privacy Policy", "Terms of Service", "Cookie Preferences", "Help Center"].map((item) => (
                <span className="pill" key={item}>
                  <Icon name="chevron_right" />
                  {item}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </main>
      <MovieRail title="Your Watchlist" movies={movies.slice(0, 6)} />
    </div>
  );
}
