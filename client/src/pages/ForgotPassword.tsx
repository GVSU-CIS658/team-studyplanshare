import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast";
import { Link } from "@tanstack/react-router";
import { getApiErrorMessage } from "../services/apiClient";
import { requestPasswordReset } from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { clearRedirectTarget, getRedirectTarget } from "../lib/authRedirect";
import { withAppBasePath } from "../lib/basePath";

export default function ForgotPasswordPage() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    const redirectTarget = getRedirectTarget("/");
    clearRedirectTarget();
    globalThis.location.replace(withAppBasePath(redirectTarget));
  }, [loading, user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSent(false);

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setIsSubmitting(true);

    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-6 rounded-3xl bg-linear-to-br from-blue-50 via-white to-indigo-100 p-6 dark:from-background dark:via-background dark:to-background">
        <ErrorToast message={error} onClose={() => setError(null)} />
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
          <Button type="submit" disabled={sent || isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        {sent && (
          <p className="text-sm text-green-600">
            Reset instructions have been sent to your email address.
          </p>
        )}
        <Link to="/login" className="text-sm underline text-primary">
          Back to login
        </Link>
      </section>
    </Layout>
  );
}
