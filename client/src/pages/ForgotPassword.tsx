import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSent(false);
    // TODO: Integrate with authService for password reset
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    // Simulate sending
    setTimeout(() => {
      setSent(true);
    }, 800);
  };

  return (
    <section className="flex flex-col max-w-md gap-6 p-6 mx-auto">
      <h2 className="text-2xl font-semibold text-primary">Forgot Password</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label htmlFor="email" className="text-sm font-medium">
          Email address
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />
        {error && <output className="text-sm text-destructive">{error}</output>}
        <Button type="submit" disabled={sent}>
          Send reset link
        </Button>
      </form>
      {sent && (
        <p className="text-sm text-green-600">
          If your email is registered, a reset link has been sent.
        </p>
      )}
      <Link to="/login" className="text-sm underline text-primary">
        Back to login
      </Link>
    </section>
  );
}
