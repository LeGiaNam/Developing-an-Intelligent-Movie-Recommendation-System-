"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

const CACHE_ENDPOINT = process.env.NEXT_PUBLIC_RS_URL ?? "http://localhost:8001";

export default function AdminRecommendationsPage() {
  const { toast } = useToast();
  const [summary, setSummary] = useState(null);
  const [cacheStatus, setCacheStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flushing, setFlushing] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }

    Promise.allSettled([
      api.recommendationSummary(token),
      fetch(`${CACHE_ENDPOINT}/cache/status`).then((r) => r.json()).catch(() => null),
    ]).then(([sumRes, cacheRes]) => {
      if (sumRes.status === "fulfilled") setSummary(sumRes.value);
      if (cacheRes.status === "fulfilled" && cacheRes.value) setCacheStatus(cacheRes.value);
      setLoading(false);
    });
  }, []);

  async function flushCache() {
    setFlushing(true);
    try {
      const res = await fetch(`${CACHE_ENDPOINT}/cache/flush`, { method: "DELETE" });
      if (!res.ok) throw new Error("Flush failed");
      const data = await res.json().catch(() => ({}));
      toast(data.message ?? "Cache flushed successfully.", "success");
      // Reload cache status
      const cRes = await fetch(`${CACHE_ENDPOINT}/cache/status`).then((r) => r.json()).catch(() => null);
      if (cRes) setCacheStatus(cRes);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setFlushing(false);
    }
  }

  const kpis = summary
    ? [
        { label: "Total Events", value: summary.total ?? "—", icon: "analytics" },
        { label: "Unique Users", value: summary.uniqueUsers ?? "—", icon: "people" },
        { label: "Unique Movies", value: summary.uniqueMovies ?? "—", icon: "movie" },
        { label: "Avg Score", value: summary.avgScore ? Number(summary.avgScore).toFixed(2) : "—", icon: "star" },
      ]
    : [];

  const cacheKeys = cacheStatus?.keys ?? [];
  const cacheCount = cacheStatus?.count ?? cacheStatus?.total_keys ?? cacheKeys.length ?? 0;

  return (
    <AdminShell active="/admin/recommendations">
      <div className="section-header">
        <div>
          <h1 className="title-xl" style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>Recommendation Engine</h1>
          <p className="muted">Monitor AI recommendation events, cache usage and engine performance.</p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={flushCache}
          disabled={flushing}
          type="button"
        >
          <Icon name="refresh" />
          {flushing ? "Flushing..." : "Flush Cache"}
        </button>
      </div>

      {loading ? (
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="kpi skeleton" style={{ height: 88 }} />
          ))}
        </div>
      ) : (
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          {kpis.map(({ label, value, icon }) => (
            <div key={label} className="kpi">
              <div className="meta-label">
                <Icon name={icon} style={{ width: 14, height: 14, verticalAlign: "middle" }} /> {label}
              </div>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      )}

      {/* Cache Status */}
      <section className="admin-panel" style={{ marginBottom: 24 }}>
        <div className="section-header" style={{ padding: "18px 22px 0" }}>
          <h2 className="section-title" style={{ fontSize: 20 }}>
            Redis Cache Status
            <span style={{
              marginLeft: 12, fontSize: 13,
              color: cacheCount > 0 ? "#44cf70" : "var(--muted)",
              fontFamily: "sans-serif", fontWeight: 600,
            }}>
              {cacheCount} active keys
            </span>
          </h2>
          <button className="btn btn-ghost btn-danger" onClick={flushCache} disabled={flushing} type="button" style={{ minHeight: 36 }}>
            <Icon name="delete_sweep" />
            Clear All Cache
          </button>
        </div>
        {cacheKeys.length > 0 ? (
          <div style={{ padding: "0 22px 22px", marginTop: 14 }}>
            <div style={{ display: "grid", gap: 8 }}>
              {cacheKeys.slice(0, 20).map((key) => (
                <div key={key} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", borderRadius: "var(--radius)",
                  background: "rgba(255,255,255,0.04)", fontFamily: "monospace", fontSize: 13,
                }}>
                  <span style={{ color: "var(--secondary)" }}>{key}</span>
                  <span className="pill" style={{ fontSize: 11 }}>cached</span>
                </div>
              ))}
              {cacheKeys.length > 20 && (
                <p className="muted" style={{ fontSize: 13, textAlign: "center" }}>
                  +{cacheKeys.length - 20} more keys
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="muted" style={{ padding: "18px 22px" }}>
            {loading ? "Loading..." : "Cache is empty or Redis not available."}
          </p>
        )}
      </section>

      {/* Top Recommended */}
      {summary?.topMovies?.length > 0 && (
        <section className="admin-panel">
          <h2 className="section-title" style={{ padding: "18px 22px 0", fontSize: 20 }}>Top Recommended Movies</h2>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Movie ID</th>
                <th>Event Count</th>
                <th>Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {summary.topMovies.slice(0, 10).map((item, i) => (
                <tr key={item.movieId ?? i}>
                  <td className="muted">{i + 1}</td>
                  <td><code style={{ fontSize: 13 }}>{item.movieId ?? "—"}</code></td>
                  <td><strong>{item.count ?? "—"}</strong></td>
                  <td>{item.avgScore ? Number(item.avgScore).toFixed(2) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {!loading && !summary && (
        <div className="glass-panel" style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
          <Icon name="analytics" style={{ width: 48, height: 48, opacity: 0.4 }} />
          <p style={{ marginTop: 12 }}>Recommendation event data unavailable. The recommendation service may be offline.</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Check that the recommendation service is running at <code>{CACHE_ENDPOINT}</code>.</p>
        </div>
      )}
    </AdminShell>
  );
}
