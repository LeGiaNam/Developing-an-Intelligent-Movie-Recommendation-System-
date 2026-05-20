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
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
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
          setDisplayName(mappedProfile.name);
          const items = await api.watchlist(mappedProfile.id, token).catch(() => []);
          setWatchlist(items.map((item) => mapMovie(item.movieId ?? item)).filter(Boolean));
        }
        setUser(data.user ?? { email: "" });
        setStatus("");
      })
      .catch((error) => setStatus(error.message));
  }, []);

  async function saveChanges() {
    const token = getToken();
    if (!token || !profile?.id) {
      setStatus("Sign in and choose a profile first.");
      return;
    }

    setSavingProfile(true);
    setStatus("");
    try {
      if (displayName.trim() && displayName.trim() !== profile.name) {
        const updated = await api.updateProfile(profile.id, { name: displayName.trim() }, token);
        const mapped = mapProfile(updated);
        setProfile(mapped);
        setDisplayName(mapped.name);
      }
      if (currentPassword || newPassword) {
        await api.changePassword(currentPassword, newPassword, token);
        setCurrentPassword("");
        setNewPassword("");
      }
      setStatus("Changes saved.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSavingProfile(false);
    }
  }

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
                <input className="field" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              </label>
              <label className="field-label">
                Email
                <input className="field" value={user?.email ?? ""} readOnly />
              </label>
            </div>
            <h2 className="section-title">Change Password</h2>
            <div className="form-grid">
              <input className="field" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" type="password" />
              <input className="field" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" type="password" />
            </div>
            <div className="actions">
              <button className="btn btn-ghost" type="button" onClick={() => {
                setDisplayName(profile?.name ?? "");
                setCurrentPassword("");
                setNewPassword("");
              }}>Cancel</button>
              <button className="btn btn-primary" disabled={savingProfile} onClick={saveChanges} type="button">
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
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
