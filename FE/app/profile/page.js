"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { MovieRail } from "@/components/MovieCard";
import { NavBar } from "@/components/NavBar";
import { SkeletonRail } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { api, mapMovie, mapProfile, saveCachedProfiles } from "@/lib/api";
import { getActiveProfileId, getToken, saveActiveProfileId } from "@/lib/auth";

export default function UserProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [user, setUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [ratedMovies, setRatedMovies] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info"); // "info" | "history" | "ratings"
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const token = getToken();
    const activeProfileId = getActiveProfileId();
    if (!token) { setLoading(false); return; }

    api.me(token)
      .then(async (data) => {
        setProfiles(data.profiles ?? []);
        const selected = data.profiles?.find((p) => p._id === activeProfileId) ?? data.profiles?.[0];
        if (selected) {
          const mapped = mapProfile(selected);
          setProfile(mapped);
          setDisplayName(mapped.name);
          setAvatarUrl(mapped.image || "");

          const [wl, ratings, history] = await Promise.allSettled([
            api.watchlist(mapped.id, token),
            api.getRatings(mapped.id, token),
            api.history(mapped.id, token),
          ]);

          if (wl.status === "fulfilled") {
            setWatchlist(wl.value.map((item) => mapMovie(item.movieId ?? item)).filter(Boolean));
          }
          if (ratings.status === "fulfilled") {
            setRatedMovies(ratings.value.map((r) => mapMovie(r.movieId)).filter(Boolean));
          }
          if (history.status === "fulfilled") {
            setWatchHistory(
              history.value
                .map((h) => {
                  const movie = mapMovie(h.movieId ?? h);
                  if (!movie) return null;
                  const pct = h.durationSeconds > 0
                    ? Math.round((h.progressSeconds / h.durationSeconds) * 100)
                    : 0;
                  return { ...movie, progress: Math.min(pct, 100) };
                })
                .filter(Boolean)
                .slice(0, 20)
            );
          }
        }
        setUser(data.user ?? { email: "" });
      })
      .catch((err) => toast(err.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  async function saveChanges() {
    const token = getToken();
    if (!token || !profile?.id) {
      toast("Sign in and choose a profile first.", "warn");
      return;
    }
    setSavingProfile(true);
    try {
      const patch = {};
      if (displayName.trim() && displayName.trim() !== profile.name) patch.name = displayName.trim();
      if (avatarUrl.trim() !== (profile.image || "")) patch.avatarUrl = avatarUrl.trim() || null;

      if (Object.keys(patch).length > 0) {
        const updated = await api.updateProfile(profile.id, patch, token);
        const mapped = mapProfile(updated);

        const updatedRaw = profiles.map((p) =>
          (p._id ?? p.id) === profile.id ? updated : p
        );
        setProfiles(updatedRaw);
        saveCachedProfiles(updatedRaw);

        setProfile(mapped);
        setDisplayName(mapped.name);
        setAvatarUrl(mapped.image || "");
      }

      if (currentPassword && newPassword) {
        await api.changePassword(currentPassword, newPassword, token);
        setCurrentPassword("");
        setNewPassword("");
      }
      toast("Changes saved successfully.", "success");
    } catch (error) {
      toast(error.message, "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleDeleteProfile() {
    const token = getToken();
    if (!token || !profile?.id) return;

    try {
      await api.deleteProfile(profile.id, token);
      toast("Profile deleted successfully.", "success");

      const remaining = profiles.filter((p) => (p._id ?? p.id) !== profile.id);
      saveCachedProfiles(remaining);
      saveActiveProfileId(remaining.length > 0 ? (remaining[0]._id ?? remaining[0].id) : null);

      router.push("/profiles");
    } catch (error) {
      toast(error.message, "error");
    }
  }

  function cancelChanges() {
    setDisplayName(profile?.name ?? "");
    setAvatarUrl(profile?.image || "");
    setCurrentPassword("");
    setNewPassword("");
  }

  const avatarSrc = avatarUrl || profile?.image || null;
  const initials = (profile?.name ?? "U").charAt(0).toUpperCase();
  const canDelete = profiles.length > 1;

  return (
    <div className="app-shell profile-page">
      <NavBar />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Profile"
        message={`"${profile?.name}" and all its watch history, ratings, and watchlist will be permanently deleted.`}
        confirmLabel="Delete Profile"
        onConfirm={() => { setShowDeleteConfirm(false); handleDeleteProfile(); }}
        onCancel={() => setShowDeleteConfirm(false)}
        danger
      />

      {/* Hero */}
      <section className="profile-hero">
        <div className="container">
          {avatarSrc ? (
            <Image
              className="avatar"
              src={avatarSrc}
              alt={profile?.name ?? "Profile"}
              width={92}
              height={92}
              style={{ width: 92, height: 92, marginBottom: 12 }}
            />
          ) : (
            <div style={{
              width: 92, height: 92, borderRadius: "999px",
              display: "grid", placeItems: "center",
              background: "rgba(255,181,154,0.14)", color: "var(--primary)",
              fontFamily: "Montserrat,sans-serif", fontSize: 36, fontWeight: 800, marginBottom: 12,
            }}>{initials}</div>
          )}
          <h1 className="title-xl" style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>
            {profile?.name ?? "Profile"}
          </h1>
          <p className="muted">{user?.email ? `Signed in as ${user.email}` : "Loading..."}</p>
        </div>
      </section>

      {/* Tabs */}
      <main className="container section">
        <div className="admin-tabs">
          {[
            { id: "info", label: "Personal Info", icon: "person" },
            { id: "history", label: `Continue Watching${watchHistory.length ? ` (${watchHistory.length})` : ""}`, icon: "history" },
            { id: "ratings", label: `Your Ratings${ratedMovies.length ? ` (${ratedMovies.length})` : ""}`, icon: "star" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`admin-tab${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <Icon name={tab.icon} />
              {" "}{tab.label}
            </button>
          ))}
        </div>

        {/* Personal Info Tab */}
        {activeTab === "info" && (
          <div className="feature-grid">
            <section className="glass-panel filter-stack">
              <h2 className="section-title">Personal Information</h2>
              <div className="form-grid">
                <label className="field-label">
                  Display Name
                  <input className="field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} />
                </label>
                <label className="field-label">
                  Email
                  <input className="field" value={user?.email ?? ""} readOnly style={{ opacity: 0.6 }} />
                </label>
                <label className="field-label" style={{ gridColumn: "1 / -1" }}>
                  Avatar URL
                  <input
                    className="field"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    type="url"
                  />
                  {avatarUrl && (
                    <img
                      src={avatarUrl}
                      alt="Avatar preview"
                      style={{ width: 80, height: 80, borderRadius: "999px", objectFit: "cover", marginTop: 8 }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  )}
                </label>
              </div>

              <h2 className="section-title" style={{ marginTop: 8 }}>Change Password</h2>
              <div className="form-grid">
                <input
                  className="field"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  type="password"
                  autoComplete="current-password"
                />
                <input
                  className="field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  type="password"
                  autoComplete="new-password"
                />
              </div>

              <div className="actions">
                <button className="btn btn-ghost" type="button" onClick={cancelChanges}>Cancel</button>
                <button className="btn btn-primary" disabled={savingProfile} onClick={saveChanges} type="button">
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
                {canDelete && (
                  <button
                    className="btn btn-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                    type="button"
                    style={{ marginLeft: "auto" }}
                  >
                    <Icon name="delete" />
                    Delete Profile
                  </button>
                )}
              </div>
            </section>

            <aside className="glass-panel filter-stack">
              <h2 className="section-title">Quick Stats</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Watchlist", value: watchlist.length, icon: "bookmark" },
                  { label: "Rated", value: ratedMovies.length, icon: "star" },
                  { label: "Watched", value: watchHistory.length, icon: "history" },
                  { label: "Completed", value: watchHistory.filter((h) => h.progress >= 90).length, icon: "check_circle" },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="kpi" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Icon name={icon} />
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "Montserrat,sans-serif" }}>{value}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <h2 className="section-title" style={{ marginTop: 8 }}>Links</h2>
              <div className="chips">
                {[
                  { label: "Privacy Policy", href: "#" },
                  { label: "Terms of Service", href: "#" },
                  { label: "Help Center", href: "#" },
                  { label: "Cookie Settings", href: "#" },
                ].map(({ label, href }) => (
                  <a key={label} className="pill" href={href} style={{ textDecoration: "none" }}>
                    <Icon name="chevron_right" />
                    {label}
                  </a>
                ))}
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Continue Watching Tab */}
      {activeTab === "history" && (
        loading ? <SkeletonRail count={5} wide /> : (
          <MovieRail title="Continue Watching" movies={watchHistory} wide />
        )
      )}

      {/* Ratings Tab */}
      {activeTab === "ratings" && (
        loading ? <SkeletonRail count={5} /> : (
          <MovieRail title="Your Ratings" movies={ratedMovies} />
        )
      )}

      {/* Watchlist always visible at bottom */}
      {loading ? <SkeletonRail count={5} /> : <MovieRail title="Your Watchlist" movies={watchlist} />}
    </div>
  );
}
