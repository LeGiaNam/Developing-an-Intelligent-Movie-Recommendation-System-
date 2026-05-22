"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/api";
import { images } from "@/lib/data";
import { saveActiveProfileId, saveToken } from "@/lib/auth";

function getErrorMessage(error) {
  if (error.details?.length) {
    return error.details.map((item) => item.message).join(". ");
  }
  return error.message;
}

function firstProfileId(data) {
  return data.profiles?.[0]?._id ?? data.profiles?.[0]?.id ?? null;
}

export default function AuthPage({ initialMode = "login" }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState(initialMode === "register" ? "" : "user@ipanmovie.local");
  const [password, setPassword] = useState(initialMode === "register" ? "" : "Password@123");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileName, setProfileName] = useState("Main Profile");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";
  const passwordChecks = [
    ["At least 8 characters", password.length >= 8],
    ["Uppercase letter", /[A-Z]/.test(password)],
    ["Number", /[0-9]/.test(password)],
    ["Special character", /[^A-Za-z0-9]/.test(password)],
  ];

  function switchMode(nextMode) {
    setMode(nextMode);
    setStatus("");
    setConfirmPassword("");
    if (nextMode === "register") {
      setEmail("");
      setPassword("");
      return;
    }
    setEmail("user@ipanmovie.local");
    setPassword("Password@123");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          setStatus("Passwords do not match.");
          return;
        }
        if (passwordChecks.some(([, passed]) => !passed)) {
          setStatus("Password does not meet the requirements.");
          return;
        }

        const data = await api.register(email.trim(), password, profileName.trim() || "Main Profile");
        saveToken(data.accessToken);
        const profileId = firstProfileId(data);
        if (profileId) saveActiveProfileId(profileId);
        router.push("/profiles");
        return;
      }

      const data = await api.login(email.trim(), password);
      saveToken(data.accessToken);
      const profileId = firstProfileId(data);
      if (profileId) saveActiveProfileId(profileId);
      router.push("/profiles");
    } catch (error) {
      setStatus(getErrorMessage(error));
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
          <div>
            <h1 className="section-title">{isRegister ? "Create Account" : "Sign In"}</h1>
            <p className="muted auth-copy">{isRegister ? "Start with one profile. You can add more later." : "Use your email and password to continue."}</p>
          </div>
          <button className="pill" type="button" onClick={() => switchMode(isRegister ? "login" : "register")}>
            {isRegister ? "Sign In" : "Sign Up"}
          </button>
        </div>
        <form className="filter-stack" onSubmit={handleSubmit}>
          <label className="field-label">
            Email
            <input className="field" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="alex@example.com" type="email" autoComplete="email" required />
          </label>
          <label className="field-label">
            Password
            <input className="field" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password@123" type="password" autoComplete={isRegister ? "new-password" : "current-password"} required />
          </label>
          {isRegister ? (
            <>
              <label className="field-label">
                Confirm password
                <input className="field" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" type="password" autoComplete="new-password" required />
              </label>
              <label className="field-label">
                Profile name
                <input className="field" value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Main Profile" maxLength={40} required />
              </label>
              <div className="password-checks" aria-label="Password requirements">
                {passwordChecks.map(([label, passed]) => (
                  <span className={passed ? "passed" : ""} key={label}>
                    <Icon name={passed ? "check" : "close"} />
                    {label}
                  </span>
                ))}
              </div>
            </>
          ) : null}
          {!isRegister ? <div className="section-header">
            <label className="muted">
              <input type="checkbox" /> Remember me
            </label>
          </div> : null}
          {status ? <p className="muted">{status}</p> : null}
          <button className="btn btn-primary" disabled={loading} type="submit">
            <Icon name="login" />
            {loading ? "Connecting..." : isRegister ? "Create Account" : "Sign In"}
          </button>
          <div className="section-header" style={{ justifyContent: "center", margin: "8px 0" }}>
            <span className="muted" style={{ fontSize: 13 }}>OR</span>
          </div>
          <button className="btn btn-ghost" type="button" onClick={() => alert("Google OAuth flow is pending real Client ID setup. Please use Email/Password.")}>
            <Icon name="add" />
            Continue with Google
          </button>
          <p className="muted auth-copy">
            {isRegister ? "Already have an account?" : "New to IPANMOVIE?"}{" "}
            <button className="link-button" type="button" onClick={() => switchMode(isRegister ? "login" : "register")}>
              {isRegister ? "Sign in" : "Create one"}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}
