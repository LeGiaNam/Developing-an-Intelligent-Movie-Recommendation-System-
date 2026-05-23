"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function AdminNewUserPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: "", password: "", role: "user", profileName: "Main Profile" });
  const [saving, setSaving] = useState(false);

  function setField(key) {
    return (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) { toast("Admin access required.", "error"); return; }
    if (!form.email.trim() || !form.password.trim()) {
      toast("Email and password are required.", "warn"); return;
    }
    setSaving(true);
    try {
      await api.createAdminUser(
        { email: form.email.trim(), password: form.password, role: form.role, profileName: form.profileName.trim() || "Main Profile" },
        token
      );
      toast(`User "${form.email}" created successfully.`, "success");
      router.push("/admin/users");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell active="/admin/users">
      <div className="section-header">
        <div>
          <h1 className="title-xl" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>Add New User</h1>
          <p className="muted">Create a new user account with a default profile.</p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => router.push("/admin/users")}>
          <Icon name="arrow_back" />Back
        </button>
      </div>
      <form className="glass-panel filter-stack" onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
        <div className="form-grid">
          <label className="field-label" style={{ gridColumn: "1 / -1" }}>
            Email Address *
            <input className="field" type="email" value={form.email} onChange={setField("email")} placeholder="user@example.com" required autoComplete="off" />
          </label>
          <label className="field-label" style={{ gridColumn: "1 / -1" }}>
            Password *
            <input className="field" type="password" value={form.password} onChange={setField("password")} placeholder="Min 8 chars, uppercase, number, special char" required autoComplete="new-password" />
          </label>
          <label className="field-label">
            Profile Name
            <input className="field" type="text" value={form.profileName} onChange={setField("profileName")} placeholder="Main Profile" maxLength={40} />
          </label>
          <label className="field-label">
            Role
            <select className="field select-field" value={form.role} onChange={setField("role")}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
        <div className="actions">
          <button className="btn btn-ghost" type="button" onClick={() => router.push("/admin/users")}>Cancel</button>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            <Icon name="person_add" />{saving ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
