import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/apiClient";
import {
  deleteStudyPlan,
  getMyStudyPlans,
  StudyPlan,
} from "../services/studyPlanService";
import { Button, buttonVariants } from "@/components/ui/button";
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

const DEFAULT_PLAN_IMAGE = "/images/studyplan.png";

function StudyPlansPage() {
  const { user, loading: authLoading, sessionKey } = useAuth();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Layout>
      <section className="flex flex-col w-full max-w-4xl gap-6 p-6 mx-auto md:p-10">
        <ErrorToast message={error} onClose={() => setError(null)} />
        <Card>
          <CardHeader>
            <CardTitle>My Plans</CardTitle>
            <CardDescription>
              Review, update, or delete the study plans you have created.
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
            {(loading || authLoading) && (
              <p className="text-sm text-muted-foreground">Loading plans...</p>
            )}

            {!loading && !authLoading && plans.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No plans yet. Create your first study plan!
              </p>
            )}

            {!loading &&
              !authLoading &&
              plans.map((plan) => (
                <article key={plan.id} className="p-4 border rounded-md">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold">{plan.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {plan.courseName} • {plan.semester}
                      </p>
                    </div>
                    <div className="flex gap-2">
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
                </article>
              ))}
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}

export default StudyPlansPage;
