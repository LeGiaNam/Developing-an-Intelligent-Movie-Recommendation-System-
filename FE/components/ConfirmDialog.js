"use client";

import { Icon } from "./Icon";

/**
 * Custom Confirm Dialog thay thế window.confirm()
 * Props: open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, danger
 */
export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel, danger = false }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "grid", placeItems: "center" }}>
          <span style={{
            width: 56, height: 56, borderRadius: "999px",
            display: "grid", placeItems: "center",
            background: danger ? "rgba(255,80,80,0.12)" : "rgba(255,181,154,0.1)",
            color: danger ? "#ff8080" : "var(--primary)",
            marginBottom: 8,
          }}>
            <Icon name={danger ? "delete_forever" : "help"} filled style={{ width: 28, height: 28 }} />
          </span>
        </div>
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onCancel} type="button">
            {cancelLabel}
          </button>
          <button
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
