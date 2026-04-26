import { useEffect, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Eye,
  LogOut,
  Search,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import Layout from "../components/Layout";
import RichTextContent from "../components/RichTextContent";
import { useAuth } from "../hooks/useAuth";
import { useStudyPlans } from "../hooks/useStudyPlans";
import { useVotes } from "../hooks/useVotes";
import { useSavedPlans } from "../hooks/useSavedPlans";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatWelcomeName } from "@/lib/utils";
import { withAppBasePath } from "../lib/basePath";
import type { StudyPlan } from "../services/studyPlanService";

const DEFAULT_PLAN_IMAGE = withAppBasePath("/images/studyplan.png");

function HomePage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);

  const {
    displayedPlans,
    loading,
    error,
    search,
    setSearch,
    sortBy,
    setSortBy,
    loadPlans,
    updatePlan,
    clearError,
  } = useStudyPlans();

  const { busyPlanId, vote, getVoteState } = useVotes({
    userId: user?.uid,
    authLoading,
    onRequireAuth: () => router.navigate({ to: "/login" }),
    onError: clearError,
    onPlanUpdate: updatePlan,
    onReload: loadPlans,
  });

  const { savedPlanMap, savingPlanId, loadSavedPlans, toggleSave, isSaved, isSaving } =
    useSavedPlans({
      userId: user?.uid,
      onRequireAuth: () => router.navigate({ to: "/login" }),
      onError: clearError,
    });

  const firstName =
    formatWelcomeName(user?.name) ||
    formatWelcomeName(user?.email?.split("@")[0]) ||
    "there";

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

  const hasPlans = !loading && displayedPlans.length > 0;
  const showEmptyState = !loading && displayedPlans.length === 0 && search.trim() === "";
  const showNoResults = !loading && displayedPlans.length === 0 && search.trim() !== "";

  return (
    <Layout>
      <ErrorToast message={error} onClose={clearError} />
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
                </>
              ) : (
                <Link
                  to="/login"
                  className={buttonVariants({ size: "lg" }) + " w-full sm:w-auto"}
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
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="az">A-Z</option>
          </select>
        </div>

        {(loading || authLoading) && (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Loading shared study plans...
            </CardContent>
          </Card>
        )}

        {showEmptyState && (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              No shared study plans yet.
            </CardContent>
          </Card>
        )}

        {showNoResults && (
          <p className="text-sm text-muted-foreground">
            No plans match your search.
          </p>
        )}

        {hasPlans && (
          <div className="grid gap-4 lg:grid-cols-2">
            {displayedPlans.map((plan) => {
              const voteState = getVoteState(plan);
              const hasUpvoted = voteState === "up";
              const hasDownvoted = voteState === "down";
              const isBusy = busyPlanId === plan.id;
              const saved = isSaved(plan.id);
              const saving = isSaving(plan.id);

              return (
                <Card key={plan.id} className="overflow-hidden border-border/70">
                  <div className="flex flex-col h-full">
                    <img
                      src={plan.imageUrl || DEFAULT_PLAN_IMAGE}
                      alt={plan.title}
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_PLAN_IMAGE;
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
                        <RichTextContent
                          content={plan.description}
                          className="text-sm leading-6 text-slate-600 sps-rich-text-preview"
                        />
                      </div>

                      <div className="px-3 py-3 mt-auto space-y-3 rounded-xl bg-slate-50">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-700">
                            <span className="font-bold">Score:</span>{" "}
                            {plan.score ?? plan.upvoteCount ?? 0}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPlan(plan)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
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
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant={hasUpvoted ? "default" : "outline"}
                                disabled={isBusy || authLoading}
                                onClick={() => vote(plan, "up")}
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
                                onClick={() => vote(plan, "down")}
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
                            variant={saved ? "default" : "outline"}
                            disabled={saving}
                            onClick={() => toggleSave(plan.id)}
                            className="w-8 h-8"
                            style={saved ? { backgroundColor: "#2563eb" } : undefined}
                          >
                            {saved ? (
                              <BookmarkCheck className="w-4 h-4 text-white" />
                            ) : (
                              <Bookmark className="w-4 h-4 text-slate-400" />
                            )}
                          </Button>
                        </div>

                        {!user && (
                          <p className="text-xs text-muted-foreground">
                            Login to upvote or downvote.
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

        <Dialog
          open={selectedPlan !== null}
          onOpenChange={(open) => !open && setSelectedPlan(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
            {selectedPlan && (
              <>
                <img
                  src={selectedPlan.imageUrl || DEFAULT_PLAN_IMAGE}
                  alt={selectedPlan.title}
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_PLAN_IMAGE;
                  }}
                  className="object-cover w-full h-48"
                />

                <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-12rem)]">
                  <DialogHeader className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-sky-700">
                      <span>{selectedPlan.courseName}</span>
                      <span className="text-slate-300">•</span>
                      <span>{selectedPlan.semester}</span>
                    </div>
                    <DialogTitle className="text-xl font-semibold text-slate-900">
                      {selectedPlan.title}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="sps-rich-text">
                    <RichTextContent
                      content={selectedPlan.description}
                      className="text-sm leading-6 text-slate-700"
                    />
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </section>
    </Layout>
  );
}

export default HomePage;
