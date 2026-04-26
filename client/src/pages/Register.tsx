import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import Layout from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/apiClient";
import { clearRedirectTarget, getRedirectTarget } from "../lib/authRedirect";
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
import { ArrowLeft } from "lucide-react";

function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
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

  useEffect(() => {
    if (loading || !user) return;

    const redirectTarget = getRedirectTarget("/");
    clearRedirectTarget();
    globalThis.location.replace(withAppBasePath(redirectTarget));
  }, [loading, user]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setToast(null);
    try {
      await register(email.trim(), password);
      const redirectTarget = getRedirectTarget("/");
      clearRedirectTarget();
      globalThis.location.assign(withAppBasePath(redirectTarget));
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
      <section className="relative flex min-h-[70vh] items-center justify-center rounded-3xl bg-linear-to-br from-blue-50 via-white to-indigo-100 p-4 md:p-10 dark:from-background dark:via-background dark:to-background">
        <ErrorToast
          message={passwordMismatch ? "Passwords do not match." : toast}
          onClose={() => {
            if (passwordMismatch) {
              setConfirmPassword("");
            } else {
              setToast(null);
            }
          }}
        />
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
                Create your free account
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
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="m@example.com"
                    className="px-0 bg-transparent border-0 border-b rounded-none shadow-none focus-visible:ring-0"
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
                    className="px-0 bg-transparent border-0 border-b rounded-none shadow-none focus-visible:ring-0"
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
                    className="px-0 bg-transparent border-0 border-b rounded-none shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full text-base font-semibold rounded-full h-11"
              >
                {isSubmitting ? "Creating account..." : "Register"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-2 px-6 pt-2 pb-6">
            <span className="text-sm text-muted-foreground">
              Already have an account?
            </span>
            <Link
              to="/login"
              className={
                buttonVariants({ variant: "outline", size: "default" }) +
                " h-11 w-full rounded-full text-center text-base font-semibold"
              }
            >
              Login
            </Link>
          </CardFooter>
        </Card>
      </section>
    </Layout>
  );
}

export default RegisterPage;
