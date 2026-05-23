"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { images } from "@/lib/data";
import { Icon } from "./Icon";
import { api } from "@/lib/api";
import { clearToken, getActiveProfileId, getToken } from "@/lib/auth";

const links = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/movies", label: "Movies", icon: "movie" },
  { href: "/browse", label: "Browse", icon: "search" },
  { href: "/notifications", label: "Notifications", icon: "notifications" },
];

const SESSION_CACHE_KEY = "ipanmovie.session";

function getCachedSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > 120_000) return null; // 2 min cache
    return data;
  } catch { return null; }
}

function setCachedSession(data) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
}

function clearCachedSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_CACHE_KEY);
}

export function NavBar({ active = "/" }) {
  const router = useRouter();
  const searchInputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestStatus, setSuggestStatus] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [session, setSession] = useState({ user: null, profile: null });
  const [sessionChecked, setSessionChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Load session — try cache first for instant render
  useEffect(() => {
    const cached = getCachedSession();
    if (cached) {
      setSession(cached);
      setSessionChecked(true);
    }

    const token = getToken();
    if (!token) {
      setSessionChecked(true);
      return;
    }

    api.me(token)
      .then((data) => {
        const activeProfileId = getActiveProfileId();
        const profile = data.profiles?.find((item) => item._id === activeProfileId) ?? data.profiles?.[0] ?? null;
        const sess = { user: data.user ?? null, profile };
        setSession(sess);
        setCachedSession(sess);
        setSessionChecked(true);
      })
      .catch(() => {
        clearToken();
        clearCachedSession();
        setSession({ user: null, profile: null });
        setSessionChecked(true);
      });
  }, []);

  // Search suggestions with debounce
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) { setSuggestions([]); setSuggestStatus(""); return; }

    let ignore = false;
    const timer = window.setTimeout(() => {
      api.searchSuggest(q)
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

    return () => { ignore = true; window.clearTimeout(timer); };
  }, [query]);

  // Cmd+K / Ctrl+K to focus search
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      if (e.key === "Escape") {
        setShowSuggestions(false);
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const q = query.trim();
    setShowSuggestions(false);
    setMenuOpen(false);
    router.push(q ? `/browse?q=${encodeURIComponent(q)}` : "/browse");
  }

  function openSuggestion(movie) {
    setQuery(movie.title ?? "");
    setShowSuggestions(false);
    router.push(`/movie/${movie._id ?? movie.id}`);
  }

  function logout() {
    clearToken();
    clearCachedSession();
    setSession({ user: null, profile: null });
    setSessionChecked(true);
    setShowSuggestions(false);
    setMenuOpen(false);
    router.push("/auth");
  }

  const isMac = typeof navigator !== "undefined" && navigator.platform.includes("Mac");

  return (
    <>
      <nav className="top-nav">
        <div className="nav-left">
          <Link className="brand" href="/">IPANMOVIE</Link>
          <div className="nav-links">
            {links.map((link) => (
              <Link
                className={`nav-link${active === link.href ? " active" : ""}`}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="nav-right">
          {/* Search */}
          <div className="search-shell">
            <form className="search-field" onSubmit={submitSearch}>
              <button className="search-submit" type="submit" aria-label="Search movies">
                <Icon name="search" />
              </button>
              <input
                ref={searchInputRef}
                value={query}
                onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
                onChange={(e) => {
                  const v = e.target.value;
                  setQuery(v);
                  if (v.trim().length >= 3) setSuggestStatus("Searching...");
                  setShowSuggestions(v.trim().length >= 3);
                }}
                onFocus={() => { if (query.trim().length >= 3) setShowSuggestions(true); }}
                placeholder="Search..."
                aria-label="Search movies"
              />
              <span className="search-kbd">{isMac ? "⌘" : "Ctrl"}K</span>
            </form>

            {showSuggestions && query.trim().length >= 3 && (
              <div className="search-suggestions" role="listbox" aria-label="Movie suggestions">
                {suggestions.map((movie) => (
                  <button
                    className="suggestion-item"
                    key={movie._id ?? movie.id}
                    onMouseDown={() => openSuggestion(movie)}
                    type="button"
                  >
                    <span className="suggestion-poster">
                      {movie.posterUrl
                        ? <Image src={movie.posterUrl} alt="" width={42} height={58} />
                        : <span className="suggestion-poster-fallback" />
                      }
                    </span>
                    <span className="suggestion-copy">
                      <span className="suggestion-title">{movie.title}</span>
                      <span className="muted">{movie.releaseYear ?? "Movie"}</span>
                    </span>
                  </button>
                ))}
                {suggestStatus && <div className="suggestion-empty">{suggestStatus}</div>}
              </div>
            )}
          </div>

          {/* Notifications with badge */}
          <Link className="icon-button notif-badge" href="/notifications" aria-label="Notifications">
            <Icon name="notifications" />
          </Link>

          {/* Admin link */}
          {session.user?.role === "admin" && (
            <Link className="icon-button" href="/admin" aria-label="Admin">
              <Icon name="settings" />
            </Link>
          )}

          {/* Auth state */}
          {!sessionChecked ? (
            <span className="nav-auth-placeholder" aria-hidden="true" />
          ) : session.user ? (
            <div className="session-actions">
              <Link className="profile-chip" href="/profile" aria-label="User profile">
                <Image
                  className="avatar"
                  src={session.profile?.avatarUrl || images.avatar}
                  alt={session.profile?.name || "Profile"}
                  width={42}
                  height={42}
                />
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

          {/* Hamburger button */}
          <button
            className="hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            type="button"
          >
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      <div className={`mobile-nav${menuOpen ? " open" : ""}`} aria-hidden={!menuOpen}>
        {links.map((link) => (
          <Link
            className={`mobile-nav-link${active === link.href ? " active" : ""}`}
            href={link.href}
            key={link.href}
            onClick={() => setMenuOpen(false)}
          >
            <Icon name={link.icon} />
            {link.label}
          </Link>
        ))}
        {session.user && (
          <button
            className="mobile-nav-link"
            style={{ border: 0, background: "transparent", cursor: "pointer", textAlign: "left" }}
            onClick={logout}
            type="button"
          >
            <Icon name="logout" />
            Sign Out
          </button>
        )}
      </div>
    </>
  );
}
