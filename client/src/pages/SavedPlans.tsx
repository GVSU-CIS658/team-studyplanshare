import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import RichTextContent from "../components/RichTextContent";
import Layout from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/apiClient";
import {
  getSavedPlans,
  removeSavedPlan,
  SavedPlan,
} from "../services/savedPlanService";
import { getStudyPlan, StudyPlan } from "../services/studyPlanService";
import { Button, buttonVariants } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { withAppBasePath } from "../lib/basePath";

const DEFAULT_PLAN_IMAGE = withAppBasePath("/images/studyplan.png");

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

        const withDetails = await Promise.all(
          saves.map(async (save) => {
            try {
              const plan = await getStudyPlan(save.planId);
              return { ...save, plan };
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
      <section className="flex flex-col w-full max-w-4xl gap-6 p-6 mx-auto md:p-10">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Saved Plans</CardTitle>
              <CardDescription className="mt-1">
                Study plans you've bookmarked for later.
              </CardDescription>
            </div>
            <CardAction>
              <Link
                to="/"
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                Browse plans
              </Link>
            </CardAction>
          </CardHeader>

          <CardContent className="grid gap-3">
            {(loading || authLoading) && (
              <p className="text-sm text-muted-foreground">
                Loading saved plans...
              </p>
            )}

            {!loading && !authLoading && savedPlans.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No saved plans yet. Browse the shared feed to bookmark plans.
              </p>
            )}

            {!loading && !authLoading && savedPlans.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {savedPlans.map((saved) => {
                  const plan = saved.plan;
                  const isBusy = busyId === saved.id;

                  return (
                    <Card key={saved.id} className="overflow-hidden">
                      <img
                        src={plan?.imageUrl || DEFAULT_PLAN_IMAGE}
                        alt={plan?.title || "Study plan"}
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_PLAN_IMAGE;
                        }}
                        className="h-40 w-full object-cover"
                      />
                      <CardContent className="flex flex-col gap-3 p-4">
                        <div>
                          {plan ? (
                            <>
                              <p className="text-xs text-muted-foreground">
                                {plan.courseName} • {plan.semester}
                              </p>
                              <h3 className="mt-0.5 text-sm font-semibold line-clamp-1">
                                {plan.title}
                              </h3>
                              <RichTextContent
                                content={plan.description}
                                className="mt-1 text-xs text-muted-foreground sps-rich-text-preview"
                              />
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              This plan is no longer available.
                            </p>
                          )}
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => handleRemove(saved.id)}
                            className="border-rose-200 text-rose-600 hover:bg-rose-50"
                          >
                            {isBusy ? "Removing..." : "Remove"}
                          </Button>
                        </div>
                      </CardContent>
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
