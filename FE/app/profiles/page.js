"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { api, fallback, mapProfile } from "@/lib/api";
import { clearToken, getToken, saveActiveProfileId } from "@/lib/auth";

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState(fallback.profiles);
  const [status, setStatus] = useState("Using demo profiles until backend auth is available.");

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    api
      .me(token)
      .then((data) => {
        setProfiles((data.profiles ?? []).map(mapProfile));
        setStatus("");
      })
      .catch((error) => {
        setStatus(`${error.message}. Showing mock profiles.`);
      });
  }, []);

  function selectProfile(profileId) {
    saveActiveProfileId(profileId);
    router.push("/");
  }

  function logout() {
    clearToken();
    setProfiles(fallback.profiles);
    setStatus("Signed out. Showing mock profiles.");
  }

  return (
    <main className="profiles-page">
      <section className="container" style={{ textAlign: "center" }}>
        <Link className="brand" href="/">
          IPANMOVIE
        </Link>
        <h1 className="title-xl" style={{ margin: "54px auto 18px", fontSize: "clamp(34px, 5vw, 64px)" }}>
          Who&apos;s watching?
        </h1>
        {status ? <p className="muted">{status}</p> : null}
        <div className="profile-grid">
          {profiles.map((profile) => (
            <button className="profile-tile" type="button" onClick={() => selectProfile(profile.id)} key={profile.id}>
              <Image src={profile.image} alt={`${profile.name} profile`} width={140} height={140} />
              <strong>{profile.name}</strong>
            </button>
          ))}
          <button className="profile-tile" type="button">
            <span className="icon-button" style={{ width: 140, height: 140 }}>
              <Icon name="add" />
            </span>
            <strong>Add Profile</strong>
          </button>
        </div>
        <div className="actions" style={{ justifyContent: "center", marginTop: 34 }}>
          <Link className="btn btn-primary" href="/auth">
            <Icon name="login" />
            Sign In
          </Link>
          <button className="btn btn-ghost" onClick={logout} type="button">
            Manage Profiles
          </button>
        </div>
      </section>
    </main>
  );
}
