import React, { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  LogOut,
  ThumbsDown,
  ThumbsUp,
  Users,
} from "lucide-react";

import Layout from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/apiClient";
import {
  getAllStudyPlans,
  removeStudyPlanUpvote,
  StudyPlan,
  upvoteStudyPlan,
} from "../services/studyPlanService";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const stats = [
  {
    label: "Shared plans",
    description: "Browse study plans your classmates already posted.",
    icon: BookOpen,
  },
  {
    label: "Popular picks",
    description: "Plans with the most votes rise to the top.",
    icon: Users,
  },
  {
    label: "Semester ready",
    description: "See what people are using before building your own.",
    icon: GraduationCap,
  },
];

function HomePage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const firstName =
    user?.name?.split(" ").find(Boolean) ||
    user?.email?.split("@")[0] ||
    "student";

  const loadPlans = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllStudyPlans();
      setPlans(data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [user?.uid]);

  const totalVotes = useMemo(
    () => plans.reduce((sum, plan) => sum + (plan.upvoteCount || 0), 0),
    [plans],
  );

  const handleVote = async (plan: StudyPlan) => {
    if (!user) {
      router.navigate({ to: "/login" });
      return;
    }

    if (busyPlanId) return;

    setBusyPlanId(plan.id);
    setError(null);

    try {
      if (plan.hasUpvoted) {
        await removeStudyPlanUpvote(plan.id);
        setPlans((prev) =>
          prev.map((item) =>
            item.id === plan.id
              ? {
                  ...item,
                  hasUpvoted: false,
                  upvoteCount: Math.max(0, (item.upvoteCount || 0) - 1),
                }
              : item,
          ),
        );
      } else {
        await upvoteStudyPlan(plan.id);
        setPlans((prev) =>
          prev.map((item) =>
            item.id === plan.id
              ? {
                  ...item,
                  hasUpvoted: true,
                  upvoteCount: (item.upvoteCount || 0) + 1,
                }
              : item,
          ),
        );
      }
    } catch (voteError) {
      setError(getApiErrorMessage(voteError));
      await loadPlans();
    } finally {
      setBusyPlanId(null);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
      await router.navigate({ to: "/" });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Layout>
      <section className="space-y-8">
        <div className="relative px-6 py-8 overflow-hidden border shadow-sm rounded-4xl border-border/60 bg-linear-to-br from-sky-50 via-white to-emerald-50 md:px-10 md:py-12">
          <div className="absolute w-32 h-32 rounded-full -left-10 top-8 bg-sky-200/40 blur-3xl" />
          <div className="absolute bottom-0 w-40 h-40 rounded-full -right-12 bg-emerald-200/40 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center rounded-full border border-sky-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                Public study plans
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {user
                    ? `Welcome back, ${firstName}.`
                    : "Browse what other students have already shared."}
                </p>
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                  Find posted study plans before you build your own.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                  The home page is now a simple public feed. Anyone can see the
                  plans and vote totals, while signed-in users can upvote or
                  remove their vote.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {user ? (
                  <>
                    <Link
                      to="/study-plans"
                      className={buttonVariants({ size: "lg" }) + " px-5"}
                    >
                      Open my study plans
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      <LogOut className="w-4 h-4" />
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className={buttonVariants({ size: "lg" }) + " px-5"}
                    >
                      Login to vote
                    </Link>
                    <Link
                      to="/register"
                      className={buttonVariants({
                        variant: "outline",
                        size: "lg",
                      })}
                    >
                      Create an account
                    </Link>
                  </>
                )}
              </div>
            </div>

            <Card className="shadow-lg border-white/80 bg-white/85 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900">
                  Community activity
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-slate-600">
                  Popular plans stay visible here, and your vote state appears
                  directly on the icons when you are signed in.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="p-5 text-white rounded-2xl bg-slate-900">
                  <p className="text-sm text-slate-300">Plans posted</p>
                  <p className="mt-2 text-3xl font-semibold">{plans.length}</p>
                </div>
                <div className="p-5 bg-white border rounded-2xl border-slate-200">
                  <p className="text-sm text-slate-500">Total upvotes shown</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {totalVotes}
                  </p>
                </div>
                <div className="p-5 bg-white border rounded-2xl border-slate-200">
                  <p className="text-sm text-slate-500">Voting access</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {user ? "Enabled for your account" : "Login required"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map(({ label, description, icon: Icon }) => (
            <Card key={label} className="border-border/60 bg-card/80">
              <CardContent className="flex gap-4 p-6">
                <div className="flex items-center justify-center h-11 w-11 rounded-2xl bg-sky-100 text-sky-700">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-semibold text-slate-900">{label}</h2>
                  <p className="text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Posted study plans</CardTitle>
            <CardDescription>
              Everyone can browse these plans. Voting is only available when you
              are logged in.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {error && (
              <output aria-live="polite" className="text-sm text-destructive">
                {error}
              </output>
            )}

            {(loading || authLoading) && (
              <p className="text-sm text-muted-foreground">
                Loading study plans...
              </p>
            )}

            {!loading && !authLoading && plans.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No public study plans have been posted yet.
              </p>
            )}

            {!loading &&
              !authLoading &&
              plans.map((plan) => {
                const hasUpvoted = Boolean(plan.hasUpvoted);
                const isBusy = busyPlanId === plan.id;

                return (
                  <article
                    key={plan.id}
                    className="p-5 bg-white border shadow-sm rounded-2xl border-border/70"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-sky-700">
                          <span>{plan.courseName}</span>
                          <span className="text-slate-300">•</span>
                          <span>{plan.semester}</span>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">
                          {plan.title}
                        </h3>
                        <p className="max-w-3xl text-sm leading-7 text-slate-600">
                          {plan.description}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-3 p-4 min-w-52 rounded-2xl bg-slate-50">
                        <div className="text-sm font-medium text-slate-700">
                          {plan.upvoteCount} people voted for this
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={hasUpvoted ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleVote(plan)}
                            disabled={isBusy}
                            className={
                              hasUpvoted
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : ""
                            }
                          >
                            <ThumbsUp
                              className={
                                hasUpvoted
                                  ? "h-4 w-4 text-white"
                                  : "h-4 w-4 text-emerald-600"
                              }
                            />
                            {hasUpvoted ? "Upvoted" : "Upvote"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleVote(plan)}
                            disabled={!hasUpvoted || isBusy}
                            className={
                              hasUpvoted
                                ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                                : ""
                            }
                          >
                            <ThumbsDown
                              className={
                                hasUpvoted
                                  ? "h-4 w-4 text-rose-600"
                                  : "h-4 w-4 text-slate-400"
                              }
                            />
                            Downvote
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {user
                            ? hasUpvoted
                              ? "Your upvote is active. Use downvote to remove it."
                              : "You can vote on this plan."
                            : "Login to vote. Vote totals are visible to everyone."}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}

export default HomePage;
