"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icon";
import { EmptyState } from "@/components/EmptyState";
import { getToken, getActiveProfileId } from "@/lib/auth";
import { api } from "@/lib/api";

// Fallback static notifications khi backend chưa có notifications endpoint
const STATIC_NOTIFICATIONS = [
  {
    id: "n1",
    type: "new_episode",
    title: "New Episode Available: Nhập Mộng",
    body: "Episode 7 has been added to your watchlist series.",
    action: "Watch Now",
    href: "/browse",
    image: null,
    time: "2 hours ago",
    read: false,
  },
  {
    id: "n2",
    type: "recommendation",
    title: "Recommended for You: Kỷ Nguyên Số",
    body: "Based on your recent sci-fi and thriller watch history.",
    action: "View Details",
    href: "/browse?genre=Sci-Fi",
    image: null,
    time: "5 hours ago",
    read: false,
  },
  {
    id: "n3",
    type: "system",
    title: "New movies added this week",
    body: "15 new titles have been added to the catalog. Explore now.",
    action: "Browse",
    href: "/browse",
    image: null,
    time: "1 day ago",
    read: true,
  },
  {
    id: "n4",
    type: "recommendation",
    title: "Because you watched Action movies",
    body: "We found 8 new action films you might enjoy.",
    action: "See All",
    href: "/browse?genre=Action",
    image: null,
    time: "2 days ago",
    read: true,
  },
];

const TYPE_ICONS = {
  new_episode: "play_circle",
  recommendation: "recommend",
  system: "notifications",
  default: "notifications",
};

const TYPE_COLORS = {
  new_episode: "var(--primary)",
  recommendation: "var(--secondary)",
  system: "var(--muted)",
};

function NotifIcon({ type }) {
  return (
    <span style={{
      width: 48, height: 48, borderRadius: "999px",
      display: "grid", placeItems: "center", flexShrink: 0,
      background: "rgba(255,255,255,0.06)",
      color: TYPE_COLORS[type] ?? "var(--muted)",
    }}>
      <Icon name={TYPE_ICONS[type] ?? TYPE_ICONS.default} filled />
    </span>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(STATIC_NOTIFICATIONS);
  const [filter, setFilter] = useState("all"); // all | unread
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const profileId = getActiveProfileId();
    // Try to load personalized recommendations as notifications
    if (token && profileId) {
      api.personalized(profileId, token)
        .then((items) => {
          if (items?.length) {
            const recNotifs = items.slice(0, 5).map((item, i) => ({
              id: `rec-${item._id ?? i}`,
              type: "recommendation",
              title: `Recommended: ${item.title ?? "A Movie for You"}`,
              body: `Based on your watch history. ${item.genres?.join(", ") ?? ""}`.trim(),
              action: "Watch Now",
              href: `/movie/${item._id ?? item.id ?? ""}`,
              image: item.posterUrl || null,
              time: "Just now",
              read: false,
            }));
            setNotifications((prev) => [...recNotifs, ...prev.slice(recNotifs.length)]);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  const displayed = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="app-shell">
      <NavBar active="/notifications" />
      <main className="container section">
        <div className="section-header">
          <div>
            <h1 className="title-xl" style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>
              Notifications
            </h1>
            <p className="lead">
              Updates, new content and personalized recommendations for your profile.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {unreadCount > 0 && (
              <button className="btn btn-ghost" onClick={markAllRead} type="button">
                <Icon name="done_all" />
                Mark all read
              </button>
            )}
            <select
              className="select-field"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ minWidth: 120, height: 46 }}
            >
              <option value="all">All</option>
              <option value="unread">Unread {unreadCount > 0 ? `(${unreadCount})` : ""}</option>
            </select>
          </div>
        </div>

        <section className="glass-panel">
          {/* Tabs */}
          <div className="admin-tabs">
            {["all", "unread"].map((f) => (
              <button
                key={f}
                className={`admin-tab${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
                type="button"
              >
                {f === "all" ? "All Notifications" : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
              </button>
            ))}
          </div>

          {displayed.length === 0 ? (
            <EmptyState
              icon="notifications_off"
              title="No notifications"
              description={filter === "unread" ? "You've read everything! Check back later." : "No notifications yet."}
            />
          ) : (
            <div className="notice-list">
              {displayed.map((notice) => (
                <article
                  key={notice.id}
                  className="notice"
                  style={{
                    opacity: notice.read ? 0.65 : 1,
                    borderLeft: notice.read ? "" : "3px solid var(--primary)",
                    cursor: "default",
                  }}
                  onClick={() => markRead(notice.id)}
                >
                  {notice.image ? (
                    <Image src={notice.image} alt="" width={72} height={72} style={{ borderRadius: "var(--radius)", objectFit: "cover" }} />
                  ) : (
                    <NotifIcon type={notice.type} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <h3 className="card-title" style={{ fontSize: 15 }}>{notice.title}</h3>
                    <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>{notice.body}</p>
                    <span className="muted" style={{ fontSize: 12 }}>{notice.time}</span>
                  </div>
                  <Link
                    className="btn btn-ghost"
                    href={notice.href ?? "/browse"}
                    style={{ flexShrink: 0 }}
                    onClick={(e) => { e.stopPropagation(); markRead(notice.id); }}
                  >
                    {notice.action}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
