"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

const initialForm = {
  email: "",
  password: "Password@123",
  profileName: "Main Profile",
  role: "user",
  status: "active",
};

export default function AddUserPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    const token = getToken();
    if (!token) {
      setStatus("Sign in as admin first.");
      return;
    }

    setLoading(true);
    setStatus("");
    try {
      await api.createAdminUser(form, token);
      router.push("/admin/users");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell active="/admin/users/new">
      <div className="section-header">
        <div>
          <h1 className="title-xl" style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>
            Create New User
          </h1>
          <p className="muted">{status || "Create an account with an initial profile and role."}</p>
        </div>
      </div>
      <section className="admin-panel">
        <form className="filter-stack" onSubmit={submit}>
          <div className="form-grid">
            <label className="field-label">
              Email
              <input className="field" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="alex@example.com" type="email" required />
            </label>
            <label className="field-label">
              Password
              <input className="field" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="Password@123" type="password" required />
            </label>
            <label className="field-label">
              Profile name
              <input className="field" value={form.profileName} onChange={(event) => updateField("profileName", event.target.value)} placeholder="Main Profile" required />
            </label>
            <label className="field-label">
              Role
              <select className="select-field" value={form.role} onChange={(event) => updateField("role", event.target.value)}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="field-label">
              Status
              <select className="select-field" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-ghost" type="button" onClick={() => router.push("/admin/users")}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={loading} type="submit">
              <Icon name="person_add" />
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </section>
    </AdminShell>
  );
}
