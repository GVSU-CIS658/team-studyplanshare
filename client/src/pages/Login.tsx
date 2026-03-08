import React, { FormEvent, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/apiClient";
import { REDIRECT_KEY } from "../router";

function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.length > 0 && !isSubmitting,
    [email, password, isSubmitting],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) return;

    setIsSubmitting(true);
    setToast(null);

    try {
      await login(email.trim(), password);

      const redirectTarget = sessionStorage.getItem(REDIRECT_KEY) || "/browse";
      sessionStorage.removeItem(REDIRECT_KEY);
      globalThis.location.assign(redirectTarget);
    } catch (error) {
      setToast(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section style={{ maxWidth: 420, margin: "3rem auto", padding: "1rem" }}>
      <h1>Login</h1>

      {toast && (
        <output
          style={{
            marginBottom: "1rem",
            padding: "0.75rem",
            border: "1px solid #f5c2c7",
            background: "#f8d7da",
            color: "#842029",
            borderRadius: 8,
            display: "block",
          }}
        >
          {toast}
        </output>
      )}

      <form onSubmit={onSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: "0.75rem" }}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: "1rem" }}
        />

        <button type="submit" disabled={!canSubmit}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>

      <p style={{ marginTop: "1rem" }}>
        New here? <Link to="/register">Create an account</Link>
      </p>
    </section>
  );
}

export default LoginPage;
