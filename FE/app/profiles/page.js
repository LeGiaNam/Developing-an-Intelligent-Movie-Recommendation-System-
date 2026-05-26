"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { api, getCachedProfiles, loadProfiles, mapProfile, saveCachedProfiles } from "@/lib/api";
import { clearToken, getToken, saveActiveProfileId, getActiveProfileId } from "@/lib/auth";

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [status, setStatus] = useState("");
  const [newProfileName, setNewProfileName] = useState("");
  const [manageMode, setManageMode] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // profile id to delete

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus("Sign in to load your profiles.");
      return;
    }
    const cached = getCachedProfiles();
    queueMicrotask(() => {
      if (cached.length) {
        setProfiles(cached);
        setStatus("");
      }
    });

    loadProfiles(token)
      .then((data) => {
        setProfiles(data.profiles ?? []);
        setStatus("");
      })
      .catch((error) => {
        setStatus(cached.length ? "" : error.message);
      });
  }, []);

  function selectProfile(profileId) {
    if (manageMode) return;
    saveActiveProfileId(profileId);
    router.push("/");
  }

  async function confirmDeleteProfile() {
    const profileId = confirmTarget;
    setConfirmTarget(null);

    const token = getToken();
    if (!token || !profileId) return;

    try {
      await api.deleteProfile(profileId, token);

      const activeId = getActiveProfileId();
      const remaining = profiles.filter((p) => p.id !== profileId);
      if (activeId === profileId) {
        saveActiveProfileId(remaining.length > 0 ? remaining[0].id : null);
      }

      saveCachedProfiles(remaining.map((p) => p.raw));
      setProfiles(remaining);
      if (remaining.length === 0) setManageMode(false);
    } catch (error) {
      setStatus(error.message);
    }
  }

  function logout() {
    clearToken();
    setProfiles([]);
    setStatus("Signed out.");
  }

  async function addProfile() {
    const token = getToken();
    const name = newProfileName.trim() || `Profile ${profiles.length + 1}`;
    if (!token) {
      setStatus("Sign in before creating profiles.");
      return;
    }

    try {
      const profile = await api.createProfile({ name }, token);
      const mapped = mapProfile(profile);
      setProfiles((current) => {
        const next = [...current, mapped];
        saveCachedProfiles(next.map((p) => p.raw));
        return next;
      });
      setNewProfileName("");
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  }

  const isLoggedIn = profiles.length > 0;

  return (
    <main className="profiles-page">
      <ConfirmDialog
        open={confirmTarget !== null}
        title="Delete Profile"
        message="This profile and all its data will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDeleteProfile}
        onCancel={() => setConfirmTarget(null)}
        danger
      />

      <section className="container" style={{ textAlign: "center" }}>
        <Link className="brand" href="/" style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
          <Image src="/logo.png" alt="IPANMOVIE Logo" width={40} height={40} style={{ borderRadius: "50%" }} />
          IPANMOVIE
        </Link>
        <h1 className="title-xl" style={{ margin: "54px auto 18px", fontSize: "clamp(34px, 5vw, 64px)" }}>
          Who&apos;s watching?
        </h1>
        {status ? <p className="muted">{status}</p> : null}
        <div className="profile-grid">
          {profiles.map((profile) => (
            <div className="profile-tile-wrapper" key={profile.id}>
              <button
                className="profile-tile"
                type="button"
                onClick={() => selectProfile(profile.id)}
                style={{ cursor: manageMode ? "default" : "pointer" }}
              >
                {profile.image ? (
                  <Image src={profile.image} alt={`${profile.name} profile`} width={140} height={140} />
                ) : (
                  <span className="profile-placeholder">{profile.name.slice(0, 1)}</span>
                )}
                <strong>{profile.name}</strong>
              </button>
              {manageMode && profiles.length > 1 && (
                <button
                  className="profile-delete-btn"
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setConfirmTarget(profile.id); }}
                  title="Delete Profile"
                  aria-label={`Delete ${profile.name}`}
                >
                  <Icon name="delete" />
                </button>
              )}
            </div>
          ))}
          {!manageMode && (
            <button className="profile-tile" type="button" onClick={addProfile}>
              <span className="icon-button" style={{ width: 140, height: 140 }}>
                <Icon name="add" />
              </span>
              <strong>{newProfileName.trim() ? `Add "${newProfileName}"` : "Add Profile"}</strong>
            </button>
          )}
        </div>

        {!manageMode && (
          <div className="actions" style={{ justifyContent: "center", marginTop: 22 }}>
            <input
              className="field"
              style={{ maxWidth: 260 }}
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="New profile name"
              maxLength={40}
            />
          </div>
        )}

        <div className="actions" style={{ justifyContent: "center", marginTop: 34 }}>
          {isLoggedIn && (
            <button className="btn btn-ghost" onClick={() => setManageMode((v) => !v)} type="button">
              {manageMode ? "Done" : "Manage Profiles"}
            </button>
          )}
          {!isLoggedIn && (
            <Link className="btn btn-primary" href="/auth">
              <Icon name="login" />
              Sign In
            </Link>
          )}
          {isLoggedIn && (
            <button className="btn btn-ghost" onClick={logout} type="button">
              <Icon name="logout" />
              Sign Out
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
