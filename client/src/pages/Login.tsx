import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, Link } from "@tanstack/react-router";
import Layout from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/apiClient";
import { getRedirectTarget, clearRedirectTarget } from "../lib/authRedirect";
import { withAppBasePath } from "../lib/basePath";
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
import { ArrowLeft, Github } from "lucide-react";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path
        d="M21.805 10.023H12.24v3.955h5.48c-.236 1.273-.96 2.352-2.007 3.075v2.55h3.255c1.906-1.755 3.007-4.338 3.007-7.403 0-.72-.065-1.41-.17-2.077Z"
        fill="#4285F4"
      />
      <path
        d="M12.24 22c2.73 0 5.02-.905 6.695-2.447l-3.255-2.55c-.906.607-2.063.967-3.44.967-2.644 0-4.884-1.785-5.686-4.185H3.194v2.63A10.108 10.108 0 0 0 12.24 22Z"
        fill="#34A853"
      />
      <path
        d="M6.554 13.785A6.073 6.073 0 0 1 6.236 12c0-.62.112-1.222.318-1.785v-2.63H3.194A10.106 10.106 0 0 0 2.24 12c0 1.63.39 3.172.954 4.415l3.36-2.63Z"
        fill="#FBBC05"
      />
      <path
        d="M12.24 6.03c1.485 0 2.815.51 3.863 1.51l2.897-2.898C17.255 2.964 14.965 2 12.24 2A10.108 10.108 0 0 0 3.194 7.585l3.36 2.63C7.356 7.815 9.596 6.03 12.24 6.03Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginPage() {
  const { login, loginWithGithub, loginWithGoogle, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isGithubSubmitting, setIsGithubSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const redirectToPath = (path: string) => {
    clearRedirectTarget();
    globalThis.location.replace(withAppBasePath(path));
  };

  // Redirect to home when authenticated
  useEffect(() => {
    if (!user) return;

    const redirectPath = getRedirectTarget("/");
    redirectToPath(redirectPath);
  }, [loading, user, router]);

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
      // Redirect handled by useEffect
    } catch (error) {
      setToast(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    if (globalThis.history.length > 1) {
      router.history.back();
    } else {
      redirectToPath("/");
    }
  };

  const handleGoogleLogin = async () => {
    if (isSubmitting || isGoogleSubmitting || isGithubSubmitting) return;
    setIsGoogleSubmitting(true);
    setToast(null);

    try {
      await loginWithGoogle();
      // Page will redirect to Google, then back here
      // Auth state listener will catch the user and useEffect will redirect
    } catch (error) {
      setToast(getApiErrorMessage(error));
      setIsGoogleSubmitting(false);
    }
  };

  const handleGithubLogin = async () => {
    if (isSubmitting || isGoogleSubmitting || isGithubSubmitting) return;
    setIsGithubSubmitting(true);
    setToast(null);

    try {
      await loginWithGithub();
      // Page will redirect to GitHub, then back here
      // Auth state listener will catch the user and useEffect will redirect
    } catch (error) {
      setToast(getApiErrorMessage(error));
      setIsGithubSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className="relative flex min-h-[70vh] items-center justify-center rounded-3xl bg-linear-to-br from-blue-50 via-white to-indigo-100 p-4 md:p-10 dark:from-background dark:via-background dark:to-background">
        <ErrorToast message={toast} onClose={() => setToast(null)} />
        <div className="absolute z-10 left-4 top-4 md:left-6 md:top-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGoBack}
            className="rounded-full shadow bg-white/80 text-muted-foreground hover:text-primary dark:bg-background/80 md:text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Back Home</span>
          </Button>
        </div>
        <Card className="w-full max-w-md mx-auto border-0 shadow-xl">
          <CardHeader className="pb-4 space-y-2 text-center">
            <div className="flex flex-col gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-primary">
                StudyPlanShare
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Welcome back! Please sign in to continue.
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="m@example.com"
                    className="px-0 bg-transparent border-0 border-b rounded-none shadow-none focus-visible:ring-0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="px-0 bg-transparent border-0 border-b rounded-none shadow-none focus-visible:ring-0"
                  />
                  <Link
                    to="/forgot-password"
                    className="text-xs w-fit text-primary underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full text-base font-semibold rounded-full h-11"
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </Button>
              <div className="pt-2 text-sm text-center text-muted-foreground">
                <span>Or Sign Up using Social App</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleGoogleLogin}
                  disabled={
                    isSubmitting || isGoogleSubmitting || isGithubSubmitting
                  }
                  aria-label="Sign in with Google"
                  className="border rounded-full size-10 border-border bg-background hover:bg-muted"
                >
                  <GoogleIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleGithubLogin}
                  disabled={
                    isSubmitting || isGoogleSubmitting || isGithubSubmitting
                  }
                  aria-label="Sign in with GitHub"
                  className="border rounded-full size-10 border-border bg-background text-foreground hover:bg-muted"
                >
                  <Github className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-2 px-6 pt-2 pb-6">
            <span className="text-sm text-muted-foreground">
              Don't have an account?
            </span>
            <Link
              to="/register"
              className={
                buttonVariants({ variant: "outline", size: "default" }) +
                " h-11 w-full rounded-full text-center text-base font-semibold"
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
