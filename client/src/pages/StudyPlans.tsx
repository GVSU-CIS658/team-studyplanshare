import React, { FormEvent, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/apiClient";
import {
  createStudyPlan,
  deleteStudyPlan,
  getMyStudyPlans,
  StudyPlan,
  StudyPlanInput,
  updateStudyPlan,
} from "../services/studyPlanService";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorToast } from "@/components/ui/error-toast";
import { Link } from "@tanstack/react-router";

const DEFAULT_PLAN_IMAGE = "/images/studyplan.png";

const emptyForm: StudyPlanInput = {
  title: "",
  courseName: "",
  semester: "",
  description: "",
  imageUrl: "",
};

function StudyPlansPage() {
  const { user, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [form, setForm] = useState<StudyPlanInput>(emptyForm);

  const isEditing = editingPlanId !== null;
  let submitLabel = "Save plan";
  if (busy && isEditing) {
    submitLabel = "Updating...";
  } else if (busy) {
    submitLabel = "Saving...";
  } else if (isEditing) {
    submitLabel = "Update plan";
  }

  const canSubmit = useMemo(() => {
    return (
      form.title.trim().length > 0 &&
      form.courseName.trim().length > 0 &&
      form.semester.trim().length > 0 &&
      form.description.trim().length > 0 &&
      !busy
    );
  }, [form, busy]);

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
    if (authLoading) return;
    loadPlans();
  }, [authLoading, user?.uid]);

  const onChange =
    (field: keyof StudyPlanInput) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingPlanId(null);
  };

  const onEdit = (plan: StudyPlan) => {
    setEditingPlanId(plan.id);
    setForm({
      title: plan.title ?? "",
      courseName: plan.courseName ?? "",
      semester: plan.semester ?? "",
      description: plan.description ?? "",
      imageUrl: plan.imageUrl ?? "",
    });
    setError(null);
  };

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

      if (editingPlanId === planId) {
        resetForm();
      }
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) return;

    const payload: StudyPlanInput = {
      title: form.title.trim(),
      courseName: form.courseName.trim(),
      semester: form.semester.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl?.trim() || "",
    };

    setBusy(true);
    setError(null);
    try {
      if (editingPlanId) {
        await updateStudyPlan(editingPlanId, payload);
      } else {
        await createStudyPlan(payload);
      }

      resetForm();
      await loadPlans();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
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
          <CardTitle>{isEditing ? "Edit plan" : "Create a new plan"}</CardTitle>
          <CardDescription>
            This is your personal workspace for creating and managing your own
            study plans.
          </CardDescription>
          <CardAction>
            <Link
              to="/"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Go to Home
            </Link>
          </CardAction>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={onChange("title")}
                required
                placeholder="e.g. CS 658 Midterm Plan"
              />
            </div>

            <div className="grid gap-2 md:grid-cols-2 md:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="courseName">Course Name</Label>
                <Input
                  id="courseName"
                  value={form.courseName}
                  onChange={onChange("courseName")}
                  required
                  placeholder="e.g. CIS 658"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="semester">Semester</Label>
                <Input
                  id="semester"
                  value={form.semester}
                  onChange={onChange("semester")}
                  required
                  placeholder="e.g. Spring 2026"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={onChange("description")}
                required
                className="px-3 py-2 text-sm bg-transparent border rounded-md shadow-xs outline-none min-h-28 border-input focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="Outline weekly goals, milestones, and study resources."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input
                id="imageUrl"
                value={form.imageUrl}
                onChange={onChange("imageUrl")}
                placeholder="https://example.com/plan-cover.png"
              />
            </div>

            <CardFooter className="flex justify-end gap-2 px-0 pb-0">
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={busy}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={!canSubmit}>
                {submitLabel}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Plans</CardTitle>
            <CardDescription>
              Review, update, or delete the study plans you have created.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {(loading || authLoading) && (
              <p className="text-sm text-muted-foreground">Loading plans...</p>
            )}

            {!loading && !authLoading && plans.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No plans yet. Create your first study plan above.
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(plan)}
                        disabled={busy}
                      >
                        Edit
                      </Button>
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
