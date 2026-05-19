"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { images } from "@/lib/data";
import { Icon } from "./Icon";
import { api } from "@/lib/api";
import { clearToken, getActiveProfileId, getToken } from "@/lib/auth";

const links = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/browse", label: "Browse" },
  { href: "/notifications", label: "Notifications" },
];

export function NavBar({ active = "/" }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [session, setSession] = useState({ user: null, profile: null });

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    api
      .me(token)
      .then((data) => {
        const activeProfileId = getActiveProfileId();
        const profile = data.profiles?.find((item) => item._id === activeProfileId) ?? data.profiles?.[0] ?? null;
        setSession({ user: data.user ?? null, profile });
      })
      .catch(() => {
        clearToken();
        setSession({ user: null, profile: null });
      });
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/browse?q=${encodeURIComponent(q)}` : "/browse");
  }

  return (
    <nav className="top-nav">
      <div className="nav-left">
        <Link className="brand" href="/">
          IPANMOVIE
        </Link>
        <div className="nav-links">
          {links.map((link) => (
            <Link className={`nav-link ${active === link.href ? "active" : ""}`} href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="nav-right">
        <form className="search-field" onSubmit={submitSearch}>
          <button className="search-submit" type="submit" aria-label="Search movies">
            <Icon name="search" />
          </button>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search..." />
        </form>
        <Link className="icon-button" href="/notifications" aria-label="Notifications">
          <Icon name="notifications" />
        </Link>
        {session.user?.role === "admin" ? (
          <Link className="icon-button" href="/admin" aria-label="Admin">
            <Icon name="settings" />
          </Link>
        ) : null}
        {session.user ? (
          <Link className="profile-chip" href="/profile" aria-label="User profile">
            <Image className="avatar" src={session.profile?.avatarUrl || images.avatar} alt={session.profile?.name || "User profile"} width={42} height={42} />
            <span>{session.profile?.name || session.user.email.split("@")[0]}</span>
          </Link>
        ) : (
          <Link className="btn btn-primary nav-auth-button" href="/auth">
            <Icon name="login" />
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
