import React, { FormEvent, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/apiClient";
import { REDIRECT_KEY } from "../router";

function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const canSubmit = useMemo(
    () =>
      email.trim().length > 0 &&
      password.length >= 6 &&
      confirmPassword.length > 0 &&
      !passwordMismatch &&
      !isSubmitting,
    [email, password, confirmPassword, passwordMismatch, isSubmitting],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) return;

    setIsSubmitting(true);
    setToast(null);

    try {
      await register(email.trim(), password);

      const redirectTarget = sessionStorage.getItem(REDIRECT_KEY) || "/";
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
      <h1>Create Account</h1>

      {toast && (
        <div
          role="status"
          style={{
            marginBottom: "1rem",
            padding: "0.75rem",
            border: "1px solid #f5c2c7",
            background: "#f8d7da",
            color: "#842029",
            borderRadius: 8,
          }}
        >
          {toast}
        </div>
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

        <label htmlFor="password">Password (min 6 chars)</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
          style={{ display: "block", width: "100%", marginBottom: "0.75rem" }}
        />

        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: "0.5rem" }}
        />
        {passwordMismatch && (
          <div style={{ color: "#842029", marginBottom: "0.75rem" }}>
            Passwords do not match.
          </div>
        )}

        <button type="submit" disabled={!canSubmit}>
          {isSubmitting ? "Creating account..." : "Register"}
        </button>
      </form>

      <p style={{ marginTop: "1rem" }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </section>
  );
}

export default RegisterPage;
