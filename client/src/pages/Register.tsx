import React, { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/apiClient";
import { REDIRECT_KEY } from "../router";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

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

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
    <section className="relative flex min-h-screen items-center justify-center p-4 md:p-10 bg-linear-to-br from-blue-50 via-white to-indigo-100 dark:from-background dark:via-background dark:to-background">
      <div className="absolute left-4 top-4 md:left-6 md:top-6 z-10">
        <Link
          to="/"
          className="flex items-center gap-1 text-muted-foreground hover:text-primary text-sm font-medium px-2 py-1 rounded-md bg-white/80 dark:bg-background/80 shadow md:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden xs:inline">Back Home</span>
        </Link>
      </div>
      <Card className="w-full max-w-md mx-auto shadow-xl border-0">
        <CardHeader className="flex flex-col items-center gap-2 pb-2">
          <div className="flex flex-col items-center gap-2 w-full">
            {/* Logo or App Name */}
            <span className="text-3xl font-extrabold tracking-tight text-primary">
              StudyPlanShare
            </span>
            <span className="text-xs text-muted-foreground font-medium tracking-wide">
              Create your free account
            </span>
          </div>
        </CardHeader>
        <div className="px-6">
          <hr className="my-2 border-muted/40" />
        </div>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="m@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password (min 6 chars)</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>
            </div>
            {passwordMismatch && (
              <p className="block text-sm text-destructive">
                Passwords do not match.
              </p>
            )}
            {toast && (
              <output
                aria-live="polite"
                className="block text-sm text-destructive"
              >
                {toast}
              </output>
            )}
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full text-base font-semibold py-2"
            >
              {isSubmitting ? "Creating account..." : "Register"}
            </Button>
          </form>
        </CardContent>
        <div className="px-6">
          <hr className="my-2 border-muted/40" />
        </div>
        <CardFooter className="flex flex-col gap-2 p-6 pt-0 items-center">
          <span className="text-sm text-muted-foreground">
            Already have an account?
          </span>
          <Link
            to="/login"
            className={
              buttonVariants({ variant: "outline", size: "sm" }) +
              " w-full text-center"
            }
          >
            Login
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
}

export default RegisterPage;
