"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/api";
import { images } from "@/lib/data";
import { saveToken } from "@/lib/auth";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("user@ipanmovie.local");
  const [password, setPassword] = useState("Password@123");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    try {
      if (mode === "register") {
        await api.register(email, password);
        setMode("login");
        setStatus("Account created. Use OTP 123456 in backend flow, or seed an active demo account.");
        return;
      }

      const data = await api.login(email, password);
      saveToken(data.accessToken);
      router.push("/profiles");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleMock() {
    setLoading(true);
    setStatus("");
    try {
      const data = await api.googleMockLogin();
      saveToken(data.accessToken);
      router.push("/profiles");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page" style={{ backgroundImage: `linear-gradient(90deg, rgba(14,14,15,.92), rgba(14,14,15,.34)), url(${images.auth})` }}>
      <section className="auth-card">
        <Link className="brand" href="/">
          IPANMOVIE
        </Link>
        <div className="section-header" style={{ marginTop: 30 }}>
          <h1 className="section-title">{mode === "login" ? "Sign In" : "Register"}</h1>
          <button className="pill" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Register" : "Sign In"}
          </button>
        </div>
        <form className="filter-stack" onSubmit={handleSubmit}>
          <label className="field-label">
            Email
            <input className="field" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="alex@example.com" type="email" />
          </label>
          <label className="field-label">
            Password
            <input className="field" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password@123" type="password" />
          </label>
          <div className="section-header">
            <label className="muted">
              <input type="checkbox" /> Remember me
            </label>
            <Link className="muted" href="#">
              Forgot?
            </Link>
          </div>
          {status ? <p className="muted">{status}</p> : null}
          <button className="btn btn-primary" disabled={loading} type="submit">
            <Icon name="login" />
            {loading ? "Connecting..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
          <button className="btn btn-ghost" disabled={loading} onClick={handleGoogleMock} type="button">
            <Icon name="mail" />
            Continue with Google Mock
          </button>
        </form>
      </section>
    </main>
  );
}
