import React, { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  LogOut,
  Search,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import Layout from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/apiClient";
import {
  getAllStudyPlans,
  removeStudyPlanVote,
  StudyPlan,
  StudyPlanVote,
  voteStudyPlan,
} from "../services/studyPlanService";
import {
  getSavedPlans,
  savePlan,
  removeSavedPlan,
} from "../services/savedPlanService";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

  return null;
}

function getVoteMessage(
  user: typeof import("@/hooks/useAuth").useAuth extends () => infer R
    ? R extends { user: infer U }
      ? U
      : never
    : never,
): string {
  if (!user) {
    return "Login to upvote or downvote.";
  }

  return "";
}

function HomePage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [savedPlanMap, setSavedPlanMap] = useState<Map<string, string>>(
    new Map(),
  );
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "oldest" | "az">(
    "popular",
  );

  const displayedPlans = useMemo(() => {
    let result = plans;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.courseName.toLowerCase().includes(q) ||
          p.semester.toLowerCase().includes(q),
      );
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (
            (b.score ?? b.upvoteCount ?? 0) - (a.score ?? a.upvoteCount ?? 0)
          );
        case "newest":
          return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
        case "oldest":
          return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
        case "az":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [plans, search, sortBy]);

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

  const loadSavedPlans = async () => {
    if (!user) return;
    try {
      const saves = await getSavedPlans();
      setSavedPlanMap(new Map(saves.map((s) => [s.planId, s.id])));
    } catch {
      // Non-critical, don't block the page
    }
  };

  useEffect(() => {
    loadPlans();
    loadSavedPlans();
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

  const handleVote = async (plan: StudyPlan, direction: "up" | "down") => {
    if (authLoading) return;

    if (!user) {
      await router.navigate({ to: "/login" });
      return;
    }

    if (busyPlanId) return;

    setBusyPlanId(plan.id);
    setError(null);

    try {
      if (plan.myVote === direction) {
        // Toggle off: remove existing vote
        await removeStudyPlanVote(plan.id);
        const scoreDelta = direction === "up" ? -1 : 1;
        setPlans((prev) =>
          prev.map((item) =>
            item.id === plan.id
              ? {
                  ...item,
                  myVote: null,
                  score: (item.score ?? 0) + scoreDelta,
                  upvoteCount:
                    direction === "up"
                      ? Math.max(0, (item.upvoteCount || 0) - 1)
                      : item.upvoteCount,
                  downvoteCount:
                    direction === "down"
                      ? Math.max(0, (item.downvoteCount || 0) - 1)
                      : item.downvoteCount,
                }
              : item,
          ),
        );
      } else {
        // Cast or change vote
        await voteStudyPlan(plan.id, direction);
        setPlans((prev) =>
          prev.map((item) => {
            if (item.id !== plan.id) return item;
            const prevVote = item.myVote;
            const scoreDelta =
              (direction === "up" ? 1 : -1) -
              (prevVote === "up" ? 1 : prevVote === "down" ? -1 : 0);
            return {
              ...item,
              myVote: direction,
              score: (item.score ?? 0) + scoreDelta,
              upvoteCount:
                (item.upvoteCount || 0) +
                (direction === "up" ? 1 : 0) -
                (prevVote === "up" ? 1 : 0),
              downvoteCount:
                (item.downvoteCount || 0) +
                (direction === "down" ? 1 : 0) -
                (prevVote === "down" ? 1 : 0),
            };
          }),
        );
      }
    } catch (voteError) {
      setError(getApiErrorMessage(voteError));
      await loadPlans();
    } finally {
      setBusyPlanId(null);
    }
  };

  const handleToggleSave = async (planId: string) => {
    if (!user) {
      await router.navigate({ to: "/login" });
      return;
    }
    if (savingPlanId) return;

    setSavingPlanId(planId);
    setError(null);

    try {
      const existingSaveId = savedPlanMap.get(planId);
      if (existingSaveId) {
        await removeSavedPlan(existingSaveId);
        setSavedPlanMap((prev) => {
          const next = new Map(prev);
          next.delete(planId);
          return next;
        });
      } else {
        const saved = await savePlan(planId);
        setSavedPlanMap((prev) => new Map(prev).set(planId, saved.id));
      }
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSavingPlanId(null);
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
                  {user ? `Welcome back, ${firstName}` : "StudyPlanShare"}
                </CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-6 text-slate-600">
                  Browse the latest plans your classmates shared, open your own
                  study plans, and keep everything easy to find.
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {user ? (
                <>
                  <Link
                    to="/study-plans"
                    className={
                      buttonVariants({ size: "lg" }) + " w-full sm:w-auto"
                    }
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
                </>
              ) : (
                <Link
                  to="/login"
                  className={
                    buttonVariants({ size: "lg" }) + " w-full sm:w-auto"
                  }
                >
                  Sign in to get started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </CardHeader>
        </Card>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, course, or semester..."
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            Simple list with optional plan images
          </div>
        </div>

        {(loading || authLoading) && (
          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="animate-pulse space-y-3 rounded-lg border border-border/70 p-0 overflow-hidden">
                <div className="h-44 sm:h-52 lg:h-56 bg-muted" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-1/3 rounded bg-muted" />
                  <div className="h-5 w-2/3 rounded bg-muted" />
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-4/5 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && plans.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No shared plans yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Be the first to share a study plan with your classmates. Create one from your plans page and publish it.
            </p>
          </div>
        )}

        {!loading && plans.length > 0 && displayedPlans.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No plans match your search.
          </p>
        )}

        {!loading && !authLoading && displayedPlans.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {displayedPlans.map((plan) => {
              const voteState = getVoteState(plan);
              const hasUpvoted = voteState === "up";
              const hasDownvoted = voteState === "down";
              const isBusy = busyPlanId === plan.id;
              const isSaved = savedPlanMap.has(plan.id);
              const isSaving = savingPlanId === plan.id;

              const voteMessage = getVoteMessage(user);

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
                            <span className="font-bold">Score:</span>{" "}
                            {plan.score ?? plan.upvoteCount ?? 0}
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

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant={hasUpvoted ? "default" : "outline"}
                                disabled={isBusy || authLoading}
                                onClick={() => handleVote(plan, "up")}
                                className={`h-8 w-8 ${
                                  hasUpvoted
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : ""
                                }`}
                              >
                                <ThumbsUp
                                  className={
                                    hasUpvoted
                                      ? "h-4 w-4 text-white"
                                      : "h-4 w-4 text-emerald-600"
                                  }
                                />
                              </Button>
                              <span className="text-sm font-medium text-slate-600">
                                {plan.upvoteCount ?? 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant={hasDownvoted ? "default" : "outline"}
                                disabled={isBusy || authLoading}
                                onClick={() => handleVote(plan, "down")}
                                className={`h-8 w-8 ${
                                  hasDownvoted
                                    ? "bg-rose-600 hover:bg-rose-700"
                                    : ""
                                }`}
                              >
                                <ThumbsDown
                                  className={
                                    hasDownvoted
                                      ? "h-4 w-4 text-white"
                                      : "h-4 w-4 text-rose-600"
                                  }
                                />
                              </Button>
                              <span className="text-sm font-medium text-slate-600">
                                {plan.downvoteCount ?? 0}
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant={isSaved ? "default" : "outline"}
                            disabled={isSaving}
                            onClick={() => handleToggleSave(plan.id)}
                            className="w-8 h-8"
                            style={
                              isSaved
                                ? { backgroundColor: "#2563eb" }
                                : undefined
                            }
                          >
                            {isSaved ? (
                              <BookmarkCheck className="w-4 h-4 text-white" />
                            ) : (
                              <Bookmark className="w-4 h-4 text-slate-400" />
                            )}
                          </Button>
                        </div>

                        {voteMessage && (
                          <p className="text-xs text-muted-foreground">
                            {voteMessage}
                          </p>
                        )}
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
