import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "@tanstack/react-router";
import { Editor, EditorTextChangeEvent } from "primereact/editor";
import Layout from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { getPlainTextFromHtml } from "../lib/richText";
import { getApiErrorMessage } from "../services/apiClient";
import {
  createStudyPlan,
  getStudyPlan,
  StudyPlan,
  updateStudyPlan,
  StudyPlanInput,
} from "../services/studyPlanService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorToast } from "@/components/ui/error-toast";

const emptyForm: StudyPlanInput = {
  title: "",
  courseName: "",
  semester: "",
  description: "",
  imageUrl: "",
  status: "draft",
};

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
] as const satisfies ReadonlyArray<{
  value: StudyPlan["status"];
  label: string;
  description: string;
}>;

function PlanFormPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams({ strict: false }) as { planId?: string };
  const planId = params.planId ?? null;
  const isEditing = planId !== null;

  const [form, setForm] = useState<StudyPlanInput>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  let submitLabel = "Save plan";
  if (busy && isEditing) {
    submitLabel = "Updating...";
  } else if (busy) {
    submitLabel = "Saving...";
  } else if (isEditing) {
    submitLabel = "Update plan";
  }

  const canSubmit = useMemo(() => {
    const descriptionText = getPlainTextFromHtml(form.description);
    return (
      form.title.trim().length > 0 &&
      form.courseName.trim().length > 0 &&
      form.semester.trim().length > 0 &&
      descriptionText.length > 0 &&
      !busy &&
      !loadingPlan
    );
  }, [form, busy, loadingPlan]);

  useEffect(() => {
    if (!isEditing || !user) return;

    let cancelled = false;
    setLoadingPlan(true);
    setError(null);

    getStudyPlan(planId)
      .then((plan) => {
        if (cancelled) return;
        setForm({
          title: plan.title ?? "",
          courseName: plan.courseName ?? "",
          semester: plan.semester ?? "",
          description: plan.description ?? "",
          imageUrl: plan.imageUrl ?? "",
          status: plan.status ?? "draft",
        });
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(getApiErrorMessage(loadError));
      })
      .finally(() => {
        if (!cancelled) setLoadingPlan(false);
      });

    return () => {
      cancelled = true;
    };
  }, [planId, isEditing, user]);

  const onChange =
    (field: keyof StudyPlanInput) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const navigateToList = () => {
    router.navigate({ to: "/study-plans" });
  };

  const onDescriptionChange = (event: EditorTextChangeEvent) => {
    setForm((prev) => ({ ...prev, description: event.htmlValue || "" }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) return;

    const payload: StudyPlanInput = {
      title: form.title.trim(),
      courseName: form.courseName.trim(),
      semester: form.semester.trim(),
      description: form.description,
      imageUrl: form.imageUrl?.trim() || "",
      status: form.status,
    };

    setBusy(true);
    setError(null);
    try {
      if (planId) {
        await updateStudyPlan(planId, payload);
      } else {
        await createStudyPlan(payload);
      }

      navigateToList();
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
            <CardTitle>
              {isEditing ? "Edit plan" : "Create a new plan"}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? "Update the details of your study plan."
                : "Fill out the form below to create a new study plan."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loadingPlan ? (
              <p className="text-sm text-muted-foreground">Loading plan...</p>
            ) : (
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
                  <Label htmlFor="status">Visibility status</Label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={onChange("status")}
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {statusOptions.find(
                      (option) => option.value === form.status,
                    )?.description ??
                      "Only published plans are visible to everyone."}
                  </p>
                </div>

                <div className="rounded-lg border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-slate-700">
                  Only plans with status{" "}
                  <span className="font-semibold">Published</span> appear in the
                  shared feed. Drafts and archived plans stay in your private
                  workspace.
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Editor
                    id="description"
                    value={form.description}
                    onTextChange={onDescriptionChange}
                    style={{ height: "220px" }}
                    className="sps-editor"
                  />
                  <p className="text-xs text-muted-foreground">
                    Add headings, bullet points, and emphasis to structure your
                    study plan.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="imageUrl">Image URL (optional)</Label>
                  <Input
                    id="imageUrl"
                    value={form.imageUrl ?? ""}
                    onChange={onChange("imageUrl")}
                    placeholder="https://example.com/plan-cover.png"
                  />
                </div>

                <CardFooter className="flex justify-end gap-2 px-0 pb-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={navigateToList}
                    disabled={busy}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!canSubmit}>
                    {submitLabel}
                  </Button>
                </CardFooter>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}

export default PlanFormPage;
