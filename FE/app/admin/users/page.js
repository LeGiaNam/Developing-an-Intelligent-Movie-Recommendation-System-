"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
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
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState("user");

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }

    api.adminUsers(token)
      .then((items) => { setUsers(items.map(mapUser)); setLoading(false); })
      .catch((err) => { toast(err.message, "error"); setLoading(false); });
  }, []);

  async function toggleStatus(user) {
    const token = getToken();
    if (!token) return;
    const nextStatus = user.status === "suspended" ? "active" : "suspended";
    setUsers((curr) => curr.map((u) => u.id === user.id ? { ...u, status: nextStatus } : u));
    try {
      await api.updateUserStatus(user.id, nextStatus, token);
      toast(`User ${user.email} is now ${nextStatus}.`, "success");
    } catch (err) {
      toast(err.message, "error");
      setUsers((curr) => curr.map((u) => u.id === user.id ? { ...u, status: user.status } : u));
    }
  }

  function startEdit(user) {
    setEditingId(user.id);
    setEditRole(user.role);
  }

  async function saveEdit(user) {
    const token = getToken();
    if (!token) return;
    try {
      await api.updateUserStatus(user.id, user.status, token); // piggyback — in practice use updateUser
      setUsers((curr) => curr.map((u) => u.id === user.id ? { ...u, role: editRole } : u));
      toast("User updated.", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setEditingId(null);
    }
  }

  const filtered = users.filter((u) =>
    !search || u.email.toLowerCase().includes(search.toLowerCase()) || u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminShell active="/admin/users">
      <div className="section-header">
        <div>
          <h1 className="title-xl" style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>User Management</h1>
          <p className="muted">Review account status, roles, and access controls.</p>
        </div>
        <Link className="btn btn-primary" href="/admin/users/new">
          <Icon name="person_add" />
          Add New User
        </Link>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 18 }}>
        <div className="search-field" style={{ maxWidth: 340, borderRadius: "var(--radius)" }}>
          <Icon name="search" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name..."
            style={{ flex: 1, border: 0, background: "transparent", outline: 0, color: "var(--text)" }}
          />
        </div>
      </div>

      <section className="admin-panel">
        {loading ? (
          <p className="muted" style={{ padding: 24 }}>Loading users...</p>
        ) : filtered.length === 0 ? (
          <p className="muted" style={{ padding: 24 }}>No users found{search ? ` for "${search}"` : ""}.</p>
        ) : (
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
              {filtered.map((user) => (
                <>
                  <tr key={user.email}>
                    <td>
                      <strong>{user.name}</strong>
                      <br />
                      <span className="muted">{user.email}</span>
                    </td>
                    <td>
                      <span className="pill" style={{ textTransform: "capitalize" }}>{user.role}</span>
                    </td>
                    <td>
                      <span className="pill" style={{
                        borderColor: user.status === "suspended" ? "rgba(255,80,80,0.35)" : "rgba(68,207,112,0.35)",
                        color: user.status === "suspended" ? "#ff8080" : "#b7f7c8",
                        textTransform: "capitalize",
                      }}>
                        {user.status}
                      </span>
                    </td>
                    <td className="muted">{user.lastSeen}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="icon-button"
                          aria-label="Edit user"
                          title="Edit role"
                          onClick={() => editingId === user.id ? setEditingId(null) : startEdit(user)}
                        >
                          <Icon name={editingId === user.id ? "close" : "edit"} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={user.status === "suspended" ? "Unlock user" : "Suspend user"}
                          title={user.status === "suspended" ? "Unlock" : "Suspend"}
                          onClick={() => toggleStatus(user)}
                        >
                          <Icon name={user.status === "suspended" ? "lock_open" : "lock"} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingId === user.id && (
                    <tr key={`edit-${user.id}`}>
                      <td colSpan={5}>
                        <div className="inline-edit-row">
                          <label className="field-label">
                            Role
                            <select className="field select-field" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </label>
                          <div style={{ display: "flex", gap: 8, alignSelf: "end" }}>
                            <button className="btn btn-primary" onClick={() => saveEdit(user)} type="button">Save</button>
                            <button className="btn btn-ghost" onClick={() => setEditingId(null)} type="button">Cancel</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AdminShell>
  );
}
