import React, { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import Layout from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/apiClient";
import { getSavedPlans, removeSavedPlan, SavedPlan } from "../services/savedPlanService";
import { StudyPlan } from "../services/studyPlanService";
import apiClient from "../services/apiClient";
import { Button, buttonVariants } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const DEFAULT_PLAN_IMAGE = "/images/studyplan.png";

interface SavedPlanWithDetails extends SavedPlan {
  plan?: StudyPlan;
}

function SavedPlansPage() {
  const { user, loading: authLoading } = useAuth();
  const [savedPlans, setSavedPlans] = useState<SavedPlanWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const saves = await getSavedPlans();

        // Fetch the full study plan details for each saved plan
        const withDetails = await Promise.all(
          saves.map(async (save) => {
            try {
              const res = await apiClient.get<StudyPlan>(`/studyPlans/${save.planId}`);
              return { ...save, plan: res.data };
            } catch {
              return { ...save, plan: undefined };
            }
          }),
        );

        setSavedPlans(withDetails);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const handleRemove = async (saveId: string) => {
    if (busyId) return;
    setBusyId(saveId);
    setError(null);

    try {
      await removeSavedPlan(saveId);
      setSavedPlans((prev) => prev.filter((s) => s.id !== saveId));
    } catch (removeError) {
      setError(getApiErrorMessage(removeError));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Layout>
      <ErrorToast message={error} onClose={() => setError(null)} />
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Saved Plans</CardTitle>
                <CardDescription>
                  Study plans you have bookmarked from other users.
                </CardDescription>
              </div>
              <Link
                to="/"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Browse plans
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {(loading || authLoading) && (
              <p className="text-sm text-muted-foreground">Loading saved plans...</p>
            )}

            {!loading && !authLoading && savedPlans.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You haven't saved any plans yet. Browse the home page to find plans to save.
              </p>
            )}

            {!loading && !authLoading && savedPlans.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {savedPlans.map((saved) => {
                  const plan = saved.plan;
                  const isBusy = busyId === saved.id;

                  return (
                    <Card key={saved.id} className="overflow-hidden border-border/70">
                      <div className="flex flex-col h-full">
                        <img
                          src={plan?.imageUrl || DEFAULT_PLAN_IMAGE}
                          alt={plan?.title || "Study plan"}
                          onError={(event) => {
                            event.currentTarget.src = DEFAULT_PLAN_IMAGE;
                          }}
                          className="object-cover w-full h-36"
                        />
                        <CardContent className="flex flex-col flex-1 gap-3 p-4">
                          {plan ? (
                            <>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-sky-700">
                                  <span>{plan.courseName}</span>
                                  <span className="text-slate-300">•</span>
                                  <span>{plan.semester}</span>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                  {plan.title}
                                </h3>
                              </div>
                              <p className="text-sm leading-6 text-slate-600 line-clamp-2">
                                {plan.description}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              This plan may have been deleted.
                            </p>
                          )}
                          <div className="mt-auto">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() => handleRemove(saved.id)}
                              className="text-rose-600 border-rose-200 hover:bg-rose-50"
                            >
                              {isBusy ? "Removing..." : "Remove"}
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}

export default SavedPlansPage;
