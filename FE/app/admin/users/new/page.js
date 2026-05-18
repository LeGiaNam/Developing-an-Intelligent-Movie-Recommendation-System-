import { AdminShell } from "@/components/AdminShell";
import { Icon } from "@/components/Icon";

export default function AddUserPage() {
  return (
    <AdminShell active="/admin/users/new">
      <div className="section-header">
        <div>
          <h1 className="title-xl" style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>
            Create New User
          </h1>
          <p className="muted">Create a subscriber, moderator, or admin account with profile-level options.</p>
        </div>
      </div>
      <section className="admin-panel">
        <form className="filter-stack">
          <div className="form-grid">
            <label className="field-label">
              Full name
              <input className="field" placeholder="Alex Mercer" />
            </label>
            <label className="field-label">
              Email
              <input className="field" placeholder="alex@example.com" type="email" />
            </label>
            <label className="field-label">
              Role
              <select className="select-field">
                <option>Subscriber</option>
                <option>Moderator</option>
                <option>Administrator</option>
              </select>
            </label>
            <label className="field-label">
              Subscription
              <select className="select-field">
                <option>Premium</option>
                <option>Standard</option>
                <option>Trial</option>
              </select>
            </label>
          </div>
          <label className="field-label">
            Notes
            <textarea className="field textarea-field" placeholder="Internal moderation note..." />
          </label>
          <div className="actions">
            <button className="btn btn-ghost" type="button">
              Cancel
            </button>
            <button className="btn btn-primary" type="button">
              <Icon name="person_add" />
              Create User
            </button>
          </div>
        </form>
      </section>
    </AdminShell>
  );
}
