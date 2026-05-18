import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { Icon } from "@/components/Icon";
import { users } from "@/lib/data";

export default function AdminUsersPage() {
  return (
    <AdminShell active="/admin/users">
      <div className="section-header">
        <div>
          <h1 className="title-xl" style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>
            User Management
          </h1>
          <p className="muted">Review account status, role, subscriptions, and access controls.</p>
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
                  <button className="icon-button" aria-label="Lock user">
                    <Icon name={user.status === "Suspended" ? "lock" : "lock_open"} />
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
