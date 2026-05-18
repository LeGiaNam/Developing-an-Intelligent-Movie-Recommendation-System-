import Link from "next/link";
import { Icon } from "@/components/Icon";
import { images } from "@/lib/data";

export default function AuthPage() {
  return (
    <main className="auth-page" style={{ backgroundImage: `linear-gradient(90deg, rgba(14,14,15,.92), rgba(14,14,15,.34)), url(${images.auth})` }}>
      <section className="auth-card">
        <Link className="brand" href="/">
          IPANMOVIE
        </Link>
        <div className="section-header" style={{ marginTop: 30 }}>
          <h1 className="section-title">Sign In</h1>
          <span className="pill">Register</span>
        </div>
        <form className="filter-stack">
          <label className="field-label">
            Email
            <input className="field" placeholder="alex@example.com" type="email" />
          </label>
          <label className="field-label">
            Password
            <input className="field" placeholder="••••••••" type="password" />
          </label>
          <div className="section-header">
            <label className="muted">
              <input type="checkbox" /> Remember me
            </label>
            <Link className="muted" href="#">
              Forgot?
            </Link>
          </div>
          <button className="btn btn-primary" type="button">
            <Icon name="login" />
            Sign In
          </button>
          <button className="btn btn-ghost" type="button">
            <Icon name="mail" />
            Continue with Google
          </button>
        </form>
      </section>
    </main>
  );
}
