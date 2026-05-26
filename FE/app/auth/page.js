"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
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
  const { toast } = useToast();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileName, setProfileName] = useState("Main Profile");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isRegister = mode === "register";
  const passwordChecks = [
    ["At least 8 characters", password.length >= 8],
    ["Uppercase letter", /[A-Z]/.test(password)],
    ["Number", /[0-9]/.test(password)],
    ["Special character", /[^A-Za-z0-9]/.test(password)],
  ];

  function switchMode(nextMode) {
    setMode(nextMode);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          toast("Passwords do not match.", "warn");
          setLoading(false);
          return;
        }
        if (passwordChecks.some(([, passed]) => !passed)) {
          toast("Password does not meet the requirements.", "warn");
          setLoading(false);
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
      toast(`Welcome back!`, "success");
    } catch (error) {
      toast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page" style={{ backgroundImage: `linear-gradient(90deg, rgba(14,14,15,.92), rgba(14,14,15,.34)), url(${images.auth})` }}>
      <section className="auth-card">
        <Link className="brand" href="/" style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
          <Image src="/logo.png" alt="IPANMOVIE Logo" width={40} height={40} style={{ borderRadius: "50%" }} />
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
            <div className="password-input-container">
              <input className="field" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password@123" type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} required />
              <button className="password-toggle-btn" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                <Icon name={showPassword ? "eye_off" : "eye"} />
              </button>
            </div>
          </label>
          {isRegister ? (
            <>
              <label className="field-label">
                Confirm password
                <div className="password-input-container">
                  <input className="field" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" required />
                  <button className="password-toggle-btn" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                    <Icon name={showConfirmPassword ? "eye_off" : "eye"} />
                  </button>
                </div>
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
          <button className="btn btn-primary" disabled={loading} type="submit">
            <Icon name="login" />
            {loading ? "Connecting..." : isRegister ? "Create Account" : "Sign In"}
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
