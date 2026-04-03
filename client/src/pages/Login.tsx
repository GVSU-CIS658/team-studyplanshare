import React, { FormEvent, useMemo, useState } from "react";
import { useRouter, Link } from "@tanstack/react-router";
import Layout from "../components/Layout";
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
import { ErrorToast } from "@/components/ui/error-toast";
import { ArrowLeft } from "lucide-react";

function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
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
      const redirectTarget = sessionStorage.getItem(REDIRECT_KEY) || "/";
      sessionStorage.removeItem(REDIRECT_KEY);
      globalThis.location.assign(redirectTarget);
    } catch (error) {
      setToast(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    if (globalThis.history.length > 1) {
      router.history.back();
      return;
    }

    router.navigate({ to: "/" });
  };

  return (
    <Layout>
      <section className="relative flex min-h-[70vh] items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-4 md:p-10 dark:from-background dark:via-background dark:to-background">
        <ErrorToast message={toast} onClose={() => setToast(null)} />
        <div className="absolute left-4 top-4 md:left-6 md:top-6 z-10">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1 rounded-md bg-white/80 px-2 py-1 text-sm font-medium text-muted-foreground shadow transition-colors hover:text-primary dark:bg-background/80 md:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Back Home</span>
          </button>
        </div>
        <Card className="w-full max-w-md mx-auto shadow-xl border-0">
          <CardHeader className="flex flex-col items-center gap-2 pb-2">
            <div className="flex flex-col items-center gap-2 w-full">
              <span className="text-3xl font-extrabold tracking-tight text-primary">
                StudyPlanShare
              </span>
              <span className="text-xs text-muted-foreground font-medium tracking-wide">
                Welcome back! Please sign in to continue.
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
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      className="ml-auto text-xs text-primary underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full text-base font-semibold py-2"
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
          <div className="px-6">
            <hr className="my-2 border-muted/40" />
          </div>
          <CardFooter className="flex flex-col gap-2 p-6 pt-0 items-center">
            <span className="text-sm text-muted-foreground">
              Don't have an account?
            </span>
            <Link
              to="/register"
              className={
                buttonVariants({ variant: "outline", size: "sm" }) +
                " w-full text-center"
              }
            >
              Sign up
            </Link>
          </CardFooter>
        </Card>
      </section>
    </Layout>
  );
}

export default LoginPage;
