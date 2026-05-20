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
  const [suggestions, setSuggestions] = useState([]);
  const [suggestStatus, setSuggestStatus] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [session, setSession] = useState({ user: null, profile: null });
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.setTimeout(() => setSessionChecked(true), 0);
      return;
    }

    api
      .me(token)
      .then((data) => {
        const activeProfileId = getActiveProfileId();
        const profile = data.profiles?.find((item) => item._id === activeProfileId) ?? data.profiles?.[0] ?? null;
        setSession({ user: data.user ?? null, profile });
        setSessionChecked(true);
      })
      .catch(() => {
        clearToken();
        setSession({ user: null, profile: null });
        setSessionChecked(true);
      });
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      return;
    }

    let ignore = false;
    const timer = window.setTimeout(() => {
      api
        .searchSuggest(q)
        .then((items) => {
          if (ignore) return;
          setSuggestions(items);
          setSuggestStatus(items.length ? "" : "No matches");
          setShowSuggestions(true);
        })
        .catch(() => {
          if (ignore) return;
          setSuggestions([]);
          setSuggestStatus("Suggestions unavailable");
          setShowSuggestions(true);
        });
    }, 250);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  function submitSearch(event) {
    event.preventDefault();
    const q = query.trim();
    setShowSuggestions(false);
    router.push(q ? `/browse?q=${encodeURIComponent(q)}` : "/browse");
  }

  function openSuggestion(movie) {
    setQuery(movie.title ?? "");
    setShowSuggestions(false);
    router.push(`/movie/${movie._id ?? movie.id}`);
  }

  function logout() {
    clearToken();
    setSession({ user: null, profile: null });
    setSessionChecked(true);
    setShowSuggestions(false);
    router.push("/auth");
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
        <div className="search-shell">
          <form className="search-field" onSubmit={submitSearch}>
            <button className="search-submit" type="submit" aria-label="Search movies">
              <Icon name="search" />
            </button>
            <input
              value={query}
              onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                if (value.trim().length < 3) {
                  setSuggestions([]);
                  setSuggestStatus("");
                } else {
                  setSuggestStatus("Searching...");
                }
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (query.trim().length >= 3) setShowSuggestions(true);
              }}
              placeholder="Search..."
            />
          </form>
          {showSuggestions && query.trim().length >= 3 ? (
            <div className="search-suggestions" role="listbox" aria-label="Movie suggestions">
              {suggestions.map((movie) => (
                <button className="suggestion-item" key={movie._id ?? movie.id} onMouseDown={() => openSuggestion(movie)} type="button">
                  <span className="suggestion-poster">
                    {movie.posterUrl ? (
                      <Image src={movie.posterUrl} alt="" width={42} height={58} />
                    ) : (
                      <span className="suggestion-poster-fallback" />
                    )}
                  </span>
                  <span className="suggestion-copy">
                    <span className="suggestion-title">{movie.title}</span>
                    <span className="muted">{movie.releaseYear ?? "Movie"}</span>
                  </span>
                </button>
              ))}
              {suggestStatus ? <div className="suggestion-empty">{suggestStatus}</div> : null}
            </div>
          ) : null}
        </div>
        <Link className="icon-button" href="/notifications" aria-label="Notifications">
          <Icon name="notifications" />
        </Link>
        {session.user?.role === "admin" ? (
          <Link className="icon-button" href="/admin" aria-label="Admin">
            <Icon name="settings" />
          </Link>
        ) : null}
        {!sessionChecked ? (
          <span className="nav-auth-placeholder" aria-hidden="true" />
        ) : session.user ? (
          <div className="session-actions">
            <Link className="profile-chip" href="/profile" aria-label="User profile">
              <Image className="avatar" src={session.profile?.avatarUrl || images.avatar} alt={session.profile?.name || "User profile"} width={42} height={42} />
              <span>{session.profile?.name || session.user.email.split("@")[0]}</span>
            </Link>
            <button className="icon-button" onClick={logout} type="button" aria-label="Sign out">
              <Icon name="logout" />
            </button>
          </div>
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
