import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/apiClient";
import {
  deleteStudyPlan,
  getMyStudyPlans,
  StudyPlan,
  updateStudyPlan,
} from "../services/studyPlanService";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorToast } from "@/components/ui/error-toast";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const DEFAULT_PLAN_IMAGE = "/images/studyplan.png";

const statusOptions = [
  {
    value: "draft",
    label: "Draft",
    description: "Only you can see it while you work on it.",
  },
  {
    value: "published",
    label: "Published",
    description: "Visible to everyone in the shared plans feed.",
  },
  {
    value: "archived",
    label: "Archived",
    description: "Hidden from the public feed but kept in your workspace.",
  },
] as const;

const filterOptions = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
] as const;

type StudyPlanFilter = (typeof filterOptions)[number]["value"];

function getStatusBadgeVariant(status: StudyPlan["status"]) {
  switch (status) {
    case "published":
      return "default";
    case "archived":
      return "secondary";
    case "draft":
    default:
      return "outline";
  }
}

function formatStatusLabel(status: StudyPlan["status"]) {
  const option = statusOptions.find((item) => item.value === status);
  return option?.label ?? status;
}

function getQuickStatusActions(status: StudyPlan["status"]) {
  switch (status) {
    case "draft":
      return ["published", "archived"] as const;
    case "published":
      return ["draft", "archived"] as const;
    case "archived":
      return ["draft", "published"] as const;
    default:
      return [] as const;
  }
}

function StudyPlansPage() {
  const { user, loading: authLoading, sessionKey } = useAuth();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<StudyPlanFilter>("all");

  const filteredPlans = useMemo(() => {
    if (activeFilter === "all") {
      return plans;
    }

    return plans.filter((plan) => plan.status === activeFilter);
  }, [activeFilter, plans]);

  const loadPlans = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getMyStudyPlans();
      setPlans(data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setPlans([]);
      setLoading(false);
      setBusy(false);
      setError(null);
      return;
    }

    if (authLoading) return;
    loadPlans();
  }, [authLoading, sessionKey, user]);

  useEffect(() => {
    setPlans([]);
    setError(null);
    setBusy(false);
  }, [sessionKey]);

  const onDelete = async (planId: string) => {
    const confirmed = globalThis.confirm(
      "Delete this study plan? This action cannot be undone.",
    );
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    try {
      await deleteStudyPlan(planId);
      setPlans((prev) => prev.filter((plan) => plan.id !== planId));
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setBusy(false);
    }
  };

  const onChangeStatus = async (
    plan: StudyPlan,
    status: StudyPlan["status"],
  ) => {
    if (busy || plan.status === status) return;

    setBusy(true);
    setError(null);
    try {
      await updateStudyPlan(plan.id, { status });
      setPlans((prev) =>
        prev.map((item) =>
          item.id === plan.id
            ? {
                ...item,
                status,
              }
            : item,
        ),
      );
    } catch (statusError) {
      setError(getApiErrorMessage(statusError));
      await loadPlans();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <section className="flex flex-col w-full max-w-4xl gap-6 p-6 mx-auto md:p-10">
        <ErrorToast message={error} onClose={() => setError(null)} />
        <Card>
          <CardHeader>
            <CardTitle>My Plans</CardTitle>
            <CardDescription>
              Review, update, publish, archive, or return plans to draft.
            </CardDescription>
            <CardAction>
              <Link
                to="/study-plans/new"
                className={buttonVariants({ variant: "default", size: "sm" })}
              >
                Create new plan
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={activeFilter === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(option.value)}
                  disabled={busy}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            {(loading || authLoading) && (
              <p className="text-sm text-muted-foreground">Loading plans...</p>
            )}

            {!loading && !authLoading && plans.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No plans yet. Create your first study plan!
              </p>
            )}

            {!loading && !authLoading && plans.length > 0 && filteredPlans.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No plans match the current filter.
              </p>
            )}

            {!loading &&
              !authLoading &&
              filteredPlans.map((plan) => (
                <article key={plan.id} className="p-4 border rounded-md">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">{plan.title}</h3>
                        <Badge variant={getStatusBadgeVariant(plan.status)}>
                          {formatStatusLabel(plan.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {plan.courseName} • {plan.semester}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/study-plans/$planId/edit"
                        params={{ planId: plan.id }}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Edit
                      </Link>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(plan.id)}
                        disabled={busy}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <img
                    src={plan.imageUrl || DEFAULT_PLAN_IMAGE}
                    alt={plan.title}
                    onError={(event) => {
                      event.currentTarget.src = DEFAULT_PLAN_IMAGE;
                    }}
                    className="mt-3 h-44 w-full rounded-md object-cover sm:h-52"
                  />
                  <p className="mt-3 text-sm">{plan.description}</p>
                  {plan.imageUrl ? (
                    <p className="mt-2 text-xs break-all text-muted-foreground">
                      Image: {plan.imageUrl}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {getQuickStatusActions(plan.status).map((status) => (
                      <Button
                        key={status}
                        type="button"
                        size="sm"
                        variant={status === "published" ? "default" : "outline"}
                        onClick={() => onChangeStatus(plan, status)}
                        disabled={busy}
                        className={cn(
                          status === "archived" &&
                            "border-slate-300 text-slate-700 hover:bg-slate-100",
                        )}
                      >
                        {status === "draft" && "Move to draft"}
                        {status === "published" && "Publish"}
                        {status === "archived" && "Archive"}
                      </Button>
                    ))}
                  </div>
                </article>
              ))}
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}

export default StudyPlansPage;
