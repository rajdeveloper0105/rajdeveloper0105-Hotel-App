import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import DiningAnimation from "./DiningAnimation";

export const loginSessionKey = "zealit-local-login";
export function hasLoginSession() {
  try { return sessionStorage.getItem(loginSessionKey) === "AvnFood"; }
  catch { return false; }
}

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(onLogin, 1200);
    return () => window.clearTimeout(timer);
  }, [loading, onLogin]);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    if (username.trim() !== "AvnFood" || password !== "Avn@123") {
      setError("Incorrect username or password. Please try again.");
      return;
    }
    try { sessionStorage.setItem(loginSessionKey, "AvnFood"); }
    catch { /* Login remains valid in memory when browser storage is unavailable. */ }
    setPassword("");
    setLoading(true);
  }
  if (loading) return <div className="login-loading" role="status" aria-live="polite" aria-busy="true">
    <DiningAnimation />
    <div className="login-kicker">LOGIN SUCCESSFUL</div>
    <h1>Welcome, AvnFood</h1>
    <p>Getting your workspace ready…</p>
    <div className="login-loading-dots" aria-hidden="true"><i /><i /><i /></div>
  </div>;
  return <div className="login-page">
    <aside className="login-visual" aria-label="South Indian breakfast food photograph">
      <div className="login-visual-brand"><span className="brand-mark">AVN</span>AVN<span>.</span></div>
      <div className="login-visual-copy"><span>CRAFTED FOR EVERY SERVICE</span><h2>Good food.<br /><em>Great management.</em></h2><p>Your menu, orders and business.<br />Beautifully brought together.</p></div>
      <div className="login-visual-footer"><span>01 / EVERY SERVICE, CONNECTED</span><p>Manage your menu. Keep orders moving.<br />See every sale clearly.</p></div>
    </aside>
    <div className="login-form-side">
    <div className="login-form-top"><span>AVN / RESTAURANT MANAGEMENT</span><span className="login-workspace-tag">AvnFood</span></div>
    <section className="login-card" aria-labelledby="login-title">
      <div className="login-entry-icon" aria-hidden="true">AVN</div>
      <div className="login-kicker">SIGN IN TO YOUR WORKSPACE</div>
      <h1 id="login-title">Welcome back</h1>
      <p>Enter your credentials to continue to AvnFood.</p>
      <form onSubmit={submit}>
        <label htmlFor="login-username">Username</label>
        <div className="login-username-field"><svg className="login-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/></svg><input id="login-username" placeholder="Enter your username" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} /></div>
        <label htmlFor="login-password">Password</label>
        <div className="login-password">
          <svg className="login-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>
          <input id="login-password" placeholder="Enter your password" autoComplete="current-password" required type={showPassword ? "text" : "password"} value={password} aria-invalid={!!error} aria-describedby={error ? "login-error" : undefined} onChange={(e) => { setPassword(e.target.value); setError(""); }} />
          <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{showPassword && <path d="m3 3 18 18"/>}</svg></button>
        </div>
        {error && <p className="login-error" id="login-error" role="alert">{error}</p>}
        <button className="login-submit" type="submit"><span>Sign in to workspace</span><span aria-hidden="true">→</span></button>
      </form>
      <small className="login-footer">Good food starts with a well-run kitchen.</small>
    </section>
    <div className="login-copyright">© {new Date().getFullYear()} AVN · Restaurant management</div>
    </div>
  </div>;
}
