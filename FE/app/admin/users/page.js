"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

function mapUser(user) {
  return {
    id: user._id ?? user.id ?? user.email,
    name: user.email?.split("@")[0] ?? user.name ?? "User",
    email: user.email,
    role: user.role ?? "user",
    status: user.status ?? "active",
    lastSeen: user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "N/A",
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("Sign in as admin to load backend users.");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }

    api
      .adminUsers(token)
      .then((items) => {
        setUsers(items.map(mapUser));
        setStatus("");
      })
      .catch((error) => setStatus(error.message));
  }, []);

  async function toggleStatus(user) {
    const token = getToken();
    const nextStatus = user.status === "suspended" ? "active" : "suspended";
    if (!token) return;

    setUsers((current) => current.map((item) => (item.id === user.id ? { ...item, status: nextStatus } : item)));
    await api.updateUserStatus(user.id, nextStatus, token).catch((error) => setStatus(error.message));
  }

  return (
    <AdminShell active="/admin/users">
      <div className="section-header">
        <div>
          <h1 className="title-xl" style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>
            User Management
          </h1>
          <p className="muted">{status || "Review account status, role, subscriptions, and access controls."}</p>
        </div>
        <Link className="btn btn-primary" href="/admin/users/new">
          <Icon name="person_add" />
          Add New User
        </Link>
      </div>
      <section className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.email}>
                <td>
                  <strong>{user.name}</strong>
                  <br />
                  <span className="muted">{user.email}</span>
                </td>
                <td>{user.role}</td>
                <td>
                  <span className="pill">{user.status}</span>
                </td>
                <td>{user.lastSeen}</td>
                <td>
                  <button className="icon-button" aria-label="Edit user">
                    <Icon name="edit" />
                  </button>
                  <button className="icon-button" aria-label="Lock user" onClick={() => toggleStatus(user)}>
                    <Icon name={user.status === "suspended" || user.status === "Suspended" ? "lock" : "lock_open"} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
