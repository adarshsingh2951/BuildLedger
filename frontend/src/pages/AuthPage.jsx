import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getError } from "@/lib/api";

export default function AuthPage({ register = false, onAuth }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const response = await api.post(`/auth/${register ? "register" : "login"}`, form);
      onAuth(response.data);
      navigate("/");
    } catch (err) {
      setError(getError(err));
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-art">
        <div className="eyebrow">BUILDLEDGER / SITE OPERATIONS</div>
        <h1>
          Keep the site<br />
          <em>moving.</em>
        </h1>
        <p>One calm ledger for materials, people, and the work between them.</p>
        <div className="blueprint-mark">
          BL<span>+</span>
        </div>
      </section>
      <section className="auth-form">
        <div className="auth-form-inner">
          <div className="eyebrow">
            {register ? "CREATE FIELD ACCESS" : "WELCOME BACK"}
          </div>
          <h2>{register ? "Register your account" : "Sign in to BuildLedger"}</h2>
          <p className="muted">
            {register
              ? "New accounts start as Engineer. The first admin is assigned manually."
              : "Your site command center is waiting."}
          </p>
          <form onSubmit={submit}>
            {register && (
              <label>
                Full name
                <input
                  data-testid="register-name-input"
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </label>
            )}
            <label>
              Email
              <input
                data-testid="auth-email-input"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </label>
            <label>
              Password
              <input
                data-testid="auth-password-input"
                type="password"
                required
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
              />
            </label>
            {error && (
              <div className="error" data-testid="auth-error" aria-live="polite">
                {error}
              </div>
            )}
            <button className="primary-btn" data-testid="auth-submit-button">
              {register ? "Create access" : "Open dashboard"}
            </button>
          </form>
          <button
            className="text-btn"
            data-testid="auth-mode-toggle"
            onClick={() => navigate(register ? "/login" : "/register")}
          >
            {register
              ? "Already have access? Sign in"
              : "Need an account? Register"}
          </button>
        </div>
      </section>
    </main>
  );
}
