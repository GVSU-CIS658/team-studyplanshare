import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getAllStudyPlans, StudyPlan } from "../services/studyPlanService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Modal({
  open,
  onClose,
  children,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}>) {
  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg p-6 bg-white rounded-lg shadow-lg dark:bg-background">
        <button
          onClick={onClose}
          className="absolute text-lg font-bold top-2 right-2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selected, setSelected] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllStudyPlans()
      .then(setPlans)
      .finally(() => setLoading(false));
  }, []);

  let studyPlansContent;
  if (loading) {
    studyPlansContent = <p className="text-muted-foreground">Loading...</p>;
  } else if (plans.length === 0) {
    studyPlansContent = (
      <p className="text-muted-foreground">No study plans found.</p>
    );
  } else {
    studyPlansContent = (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className="transition outline-none cursor-pointer hover:shadow-lg focus:shadow-lg"
            tabIndex={0}
            role="button"
            aria-label={`View details for ${plan.title}`}
            onClick={() => setSelected(plan)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setSelected(plan);
            }}
          >
            <div className="flex flex-col gap-2 p-4">
              <h4 className="text-lg font-semibold truncate text-primary">
                {plan.title}
              </h4>
              <p className="text-sm truncate text-muted-foreground">
                {plan.courseName} • {plan.semester}
              </p>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Layout>
      <section className="flex flex-col items-center w-full max-w-4xl gap-8 py-10 mx-auto">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-3xl font-semibold text-primary">
            StudyPlanShare
          </h2>
          <p className="max-w-md text-base text-center text-muted-foreground">
            Create, share, and discover study plans for your courses and
            semesters.
          </p>
        </div>
        <div className="w-full">
          <h3 className="mb-4 text-xl font-bold">All Study Plans</h3>
          {studyPlansContent}
        </div>
        <Modal open={!!selected} onClose={() => setSelected(null)}>
          {selected && (
            <div className="flex flex-col gap-4">
              <h4 className="mb-2 text-2xl font-bold text-primary">
                {selected.title}
              </h4>
              <p className="text-sm text-muted-foreground">
                {selected.courseName} • {selected.semester}
              </p>
              <p className="mt-2 whitespace-pre-line">{selected.description}</p>
              {selected.imageUrl && (
                <img
                  src={selected.imageUrl}
                  alt={
                    selected.title ? `${selected.title} cover` : "Plan cover"
                  }
                  className="object-cover w-full mt-2 rounded max-h-60"
                  loading="lazy"
                />
              )}
              <Button
                onClick={() => setSelected(null)}
                className="self-end mt-4"
              >
                Close
              </Button>
            </div>
          )}
        </Modal>
      </section>
    </Layout>
  );
}
