import React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  LogOut,
  NotebookPen,
  Users,
} from "lucide-react";

import Layout from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const highlights = [
  {
    title: "Plan by semester",
    description:
      "Keep each course organized with one simple place for goals, milestones, and deadlines.",
    icon: CalendarRange,
  },
  {
    title: "Track what matters",
    description:
      "Write short study notes, break work into manageable pieces, and stay focused each week.",
    icon: NotebookPen,
  },
  {
    title: "Share with your team",
    description:
      "Compare plans with classmates and build a more consistent routine together.",
    icon: Users,
  },
];

const checklist = [
  "Create a study plan for each course",
  "Set weekly goals before assignments pile up",
  "Keep your semester progress easy to review",
];

function HomePage() {
  const { user, logout } = useAuth();
  const firstName =
    user?.name?.split(" ").find(Boolean) ||
    user?.email?.split("@")[0] ||
    "there";

  const handleLogout = async () => {
    await logout();
    globalThis.location.assign("/login");
  };

  return (
    <Layout>
      <section className="relative px-6 py-8 overflow-hidden border shadow-sm rounded-xl border-border/60 bg-linear-to-br from-sky-50 via-white to-emerald-50 md:px-10 md:py-12">
        <div className="absolute w-32 h-32 rounded-full -left-10 top-8 bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-0 w-40 h-40 rounded-full -right-12 bg-emerald-200/40 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-sky-700 uppercase">
              Semester planning made simple
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Welcome back, {firstName}.
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                Build a calm, clear home base for your study plans.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg">
                StudyPlanShare helps your group stay organized without feeling
                cluttered. Create plans, track your semester, and keep everyone
                moving in the same direction.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/study-plans"
                className={buttonVariants({ size: "lg" }) + " px-5"}
              >
                Open my study plans
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <Button variant="outline" size="lg" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {checklist.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 p-4 border rounded-2xl border-white/80 bg-white/70 backdrop-blur"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="shadow-lg border-white/80 bg-white/85 backdrop-blur">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-center w-12 h-12 text-white rounded-2xl bg-slate-900">
                <BookOpen className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl text-slate-900">
                A better start to the semester
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-600">
                Keep the homepage polished and useful with a short overview of
                what the app helps students do best.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-5 text-white rounded-2xl bg-slate-900">
                <p className="text-sm text-slate-300">Main goal</p>
                <p className="mt-2 text-xl font-semibold">
                  Stay organized and finish the semester strong.
                </p>
              </div>
              <div className="grid gap-3">
                {highlights.map(({ title, description, icon: Icon }) => (
                  <div
                    key={title}
                    className="p-4 bg-white border rounded-2xl border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-100 text-sky-700">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-slate-900">
                          {title}
                        </h2>
                        <p className="text-sm leading-6 text-slate-600">
                          {description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}

export default HomePage;
