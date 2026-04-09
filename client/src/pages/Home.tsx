import React, { useEffect, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  LogOut,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import Layout from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/apiClient";
import {
  getAllStudyPlans,
  removeStudyPlanUpvote,
  StudyPlan,
  StudyPlanVote,
  upvoteStudyPlan,
} from "../services/studyPlanService";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorToast } from "@/components/ui/error-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatWelcomeName } from "@/lib/utils";

const DEFAULT_PLAN_IMAGE = "/images/studyplan.png";

function getVoteState(plan: StudyPlan): StudyPlanVote {
  if (plan.myVote === "up" || plan.myVote === "down") {
    return plan.myVote;
  }

  if (plan.hasUpvoted) {
    return "up";
  }

  return null;
}

function getVoteMessage(
  user: typeof import("@/hooks/useAuth").useAuth extends () => infer R
    ? R extends { user: infer U }
      ? U
      : never
    : never,
  hasDownvoted: boolean,
): string {
  if (!user) {
    return "Login to upvote or downvote.";
  }

  if (hasDownvoted) {
    return "The current response includes your vote state.";
  }

  return "For now, downvote removes your upvote.";
}

function HomePage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);

  const firstName =
    formatWelcomeName(user?.name) ||
    formatWelcomeName(user?.email?.split("@")[0]) ||
    "there";

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

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
      await router.navigate({ to: "/login" });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleUpvote = async (plan: StudyPlan) => {
    if (authLoading) return;

    if (!user) {
      await router.navigate({ to: "/login" });
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
        return;
      }

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
    } catch (voteError) {
      const message = getApiErrorMessage(voteError);
      if (message.toLowerCase().includes("already upvoted")) {
        setPlans((prev) =>
          prev.map((item) =>
            item.id === plan.id ? { ...item, hasUpvoted: true } : item,
          ),
        );
        await loadPlans();
      } else {
        setError(message);
      }
    } finally {
      setBusyPlanId(null);
    }
  };

  const handleDownvote = async (plan: StudyPlan) => {
    if (authLoading) return;

    if (!user) {
      await router.navigate({ to: "/login" });
      return;
    }

    if (busyPlanId) return;

    setBusyPlanId(plan.id);
    setError(null);

    try {
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
    } catch (voteError) {
      const message = getApiErrorMessage(voteError);
      if (message.toLowerCase().includes("upvote not found")) {
        setPlans((prev) =>
          prev.map((item) =>
            item.id === plan.id ? { ...item, hasUpvoted: false } : item,
          ),
        );
        await loadPlans();
      } else {
        setError(message);
      }
    } finally {
      setBusyPlanId(null);
    }
  };

  return (
    <Layout>
      <ErrorToast message={error} onClose={() => setError(null)} />
      <section className="space-y-6">
        <Card className="overflow-hidden shadow-sm border-border/70 bg-linear-to-br from-sky-50 via-white to-emerald-50">
          <CardHeader className="gap-5 p-5 sm:p-6 lg:grid lg:grid-cols-[1.3fr_auto] lg:items-end">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="border-sky-200 bg-white/80 text-sky-700"
              >
                Shared study plans
              </Badge>
              <div className="space-y-2">
                <CardTitle className="text-3xl leading-tight text-slate-900 sm:text-4xl">
                  Welcome back, {firstName}
                </CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-6 text-slate-600">
                  Browse the latest plans your classmates shared, open your own
                  study plans, and keep everything easy to find.
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                to="/study-plans"
                className={buttonVariants({ size: "lg" }) + " w-full sm:w-auto"}
              >
                My study plans
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full sm:w-auto"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Shared plans
            </h2>
            <p className="text-sm text-muted-foreground">
              {plans.length} plan{plans.length === 1 ? "" : "s"} available
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            Simple list with optional plan images
          </div>
        </div>

        {(loading || authLoading) && (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Loading shared study plans...
            </CardContent>
          </Card>
        )}

        {!loading && plans.length === 0 && (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              No shared study plans yet.
            </CardContent>
          </Card>
        )}

        {!loading && !authLoading && plans.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {plans.map((plan) => {
              const voteState = getVoteState(plan);
              const hasUpvoted = voteState === "up";
              const hasDownvoted = voteState === "down";
              const isBusy = busyPlanId === plan.id;

              const voteMessage = getVoteMessage(user, hasDownvoted);

              return (
                <Card
                  key={plan.id}
                  className="overflow-hidden border-border/70"
                >
                  <div className="flex flex-col h-full">
                    <img
                      src={plan.imageUrl || DEFAULT_PLAN_IMAGE}
                      alt={plan.title}
                      onError={(event) => {
                        event.currentTarget.src = DEFAULT_PLAN_IMAGE;
                      }}
                      className="object-cover w-full h-44 sm:h-52 lg:h-56"
                    />

                    <CardContent className="flex flex-col flex-1 gap-4 p-5">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-sky-700">
                          <span>{plan.courseName}</span>
                          <span className="text-slate-300">•</span>
                          <span>{plan.semester}</span>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">
                          {plan.title}
                        </h3>
                        <p className="text-sm leading-6 text-slate-600">
                          {plan.description}
                        </p>
                      </div>

                      <div className="px-3 py-3 mt-auto space-y-3 rounded-xl bg-slate-50">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-700">
                            Score {plan.score ?? plan.upvoteCount ?? 0}
                          </p>
                          <Link
                            to="/study-plans"
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                            })}
                          >
                            Open plans
                          </Link>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={hasUpvoted ? "default" : "outline"}
                            disabled={isBusy || authLoading}
                            onClick={() => handleUpvote(plan)}
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
                            Upvote
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBusy || authLoading}
                            onClick={() => handleDownvote(plan)}
                            className={
                              hasDownvoted || hasUpvoted
                                ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                                : ""
                            }
                          >
                            <ThumbsDown
                              className={
                                hasDownvoted || hasUpvoted
                                  ? "h-4 w-4 text-rose-600"
                                  : "h-4 w-4 text-slate-400"
                              }
                            />
                            Downvote
                          </Button>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{plan.upvoteCount ?? 0} upvotes</span>
                          <span>{plan.downvoteCount ?? 0} downvotes</span>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {voteMessage}
                        </p>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </Layout>
  );
}

export default HomePage;
