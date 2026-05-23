"use client";

import { Icon } from "./Icon";

/**
 * EmptyState component
 * Props: icon, title, description, action (optional button label), onAction
 */
export function EmptyState({ icon = "movie", title = "Nothing here yet", description, action, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon name={icon} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && onAction && (
        <button className="btn btn-ghost" onClick={onAction} type="button" style={{ marginTop: 8 }}>
          {action}
        </button>
      )}
    </div>
  );
}

/**
 * Skeleton rail for movie cards (horizontal scroll placeholder)
 */
export function SkeletonRail({ count = 5, wide = false }) {
  return (
    <section className="section container">
      <div className="section-header">
        <div className="skeleton skeleton-text" style={{ width: 160, height: 28 }} />
      </div>
      <div className="rail">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className={`skeleton ${wide ? "skeleton-wide" : "skeleton-card"}`}
            style={{ flex: wide ? "0 0 clamp(300px, 27vw, 420px)" : "0 0 clamp(180px, 15vw, 230px)" }}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Skeleton grid for movie cards (poster grid placeholder)
 */
export function SkeletonGrid({ count = 12 }) {
  return (
    <div className="grid-posters">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </div>
  );
}
