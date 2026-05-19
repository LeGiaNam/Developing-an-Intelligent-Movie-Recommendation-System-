"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MovieRail } from "@/components/MovieCard";
import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icon";
import { api, mapMovie, mapProfile } from "@/lib/api";
import { getActiveProfileId, getToken } from "@/lib/auth";

export default function UserProfilePage() {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [status, setStatus] = useState("Sign in to load backend profile data.");

  useEffect(() => {
    const token = getToken();
    const activeProfileId = getActiveProfileId();
    if (!token) return;

    api
      .me(token)
      .then(async (data) => {
        const selected = data.profiles?.find((item) => item._id === activeProfileId) ?? data.profiles?.[0];
        if (selected) {
          const mappedProfile = mapProfile(selected);
          setProfile(mappedProfile);
          const items = await api.watchlist(mappedProfile.id, token).catch(() => []);
          setWatchlist(items.map((item) => mapMovie(item.movieId ?? item)).filter(Boolean));
        }
        setUser(data.user ?? { email: "" });
        setStatus("");
      })
      .catch((error) => setStatus(error.message));
  }, []);

  return (
    <div className="app-shell profile-page">
      <NavBar />
      <section className="profile-hero">
        <div className="container">
          {profile?.image ? <Image className="avatar" src={profile.image} alt={profile.name} width={92} height={92} style={{ width: 92, height: 92 }} /> : null}
          <h1 className="title-xl" style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>
            {profile?.name ?? "Profile"}
          </h1>
          <p className="muted">{status || `Signed in as ${user?.email ?? "IPANMOVIE user"}`}</p>
        </div>
      </section>
      <main className="container section">
        <div className="feature-grid">
          <section className="glass-panel filter-stack">
            <h2 className="section-title">Personal Information</h2>
            <div className="form-grid">
              <label className="field-label">
                Display name
                <input className="field" value={profile?.name ?? ""} readOnly />
              </label>
              <label className="field-label">
                Email
                <input className="field" value={user?.email ?? ""} readOnly />
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
      <MovieRail title="Your Watchlist" movies={watchlist} />
    </div>
  );
}
