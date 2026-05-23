"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

const adminLinks = [
  { href: "/admin", label: "Movie Manager", icon: "movie" },
  { href: "/admin/users", label: "User Management", icon: "group" },
  { href: "/admin/recommendations", label: "Recommendation Engine", icon: "recommend" },
  { href: "/", label: "Viewer App", icon: "live_tv" },
];

export function AdminShell({ active = "/admin", children }) {
  const [status, setStatus] = useState("Checking admin access...");
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      queueMicrotask(() => {
        setStatus("Sign in with an admin account to use this area.");
        setAllowed(false);
      });
      return;
    }

    api
      .me(token)
      .then((data) => {
        if (data.user?.role !== "admin") {
          setStatus("Your current account does not have admin access.");
          setAllowed(false);
          return;
        }
        setAllowed(true);
        setStatus("");
      })
      .catch((error) => {
        setAllowed(false);
        setStatus(error.message);
      });
  }, []);

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand" href="/admin">
          IPANMOVIE
        </Link>
        <nav className="admin-menu">
          {adminLinks.map((link) => (
            <Link className={active === link.href ? "active" : ""} href={link.href} key={link.href}>
              <Icon name={link.icon} />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="admin-main">
        {allowed ? children : (
          <section className="admin-panel">
            <h1 className="section-title">Admin Access</h1>
            <p className="muted">{status}</p>
            <div className="actions">
              <Link className="btn btn-primary" href="/auth">
                <Icon name="login" />
                Sign In
              </Link>
              <Link className="btn btn-ghost" href="/">
                Viewer App
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
