import React from "react";
import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";

import type { AuthUser } from "./services/authService";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import ForgotPasswordPage from "./pages/ForgotPassword";
import HomePage from "./pages/Home";
import StudyPlansPage from "./pages/StudyPlans";
import PlanFormPage from "./pages/PlanForm";
import ProfilePage from "./pages/Profile";
import SavedPlansPage from "./pages/SavedPlans";
import { appBasePath } from "./lib/basePath";

type RouterContext = {
  auth: {
    user: AuthUser | null;
    loading: boolean;
  };
};

const REDIRECT_KEY = "sps.redirectAfterLogin";

const RootLayout = () => {
  return (
    <main>
      <Outlet />
    </main>
  );
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const browseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/browse",
  beforeLoad: ({ context, location }) => {
    if (!context.auth.loading && !context.auth.user) {
      sessionStorage.setItem(
        REDIRECT_KEY,
        `${location.pathname}${location.searchStr}`,
      );
      throw redirect({ to: "/login" });
    }
  },
  component: () => <div> Browse(protected)</div>,
});

const studyPlansRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/study-plans",
  beforeLoad: ({ context, location }) => {
    if (!context.auth.loading && !context.auth.user) {
      sessionStorage.setItem(
        REDIRECT_KEY,
        `${location.pathname}${location.searchStr}`,
      );
      throw redirect({ to: "/login" });
    }
  },
  component: StudyPlansPage,
});

const studyPlanNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/study-plans/new",
  beforeLoad: ({ context, location }) => {
    if (!context.auth.loading && !context.auth.user) {
      sessionStorage.setItem(
        REDIRECT_KEY,
        `${location.pathname}${location.searchStr}`,
      );
      throw redirect({ to: "/login" });
    }
  },
  component: PlanFormPage,
});

const studyPlanEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/study-plans/$planId/edit",
  beforeLoad: ({ context, location }) => {
    if (!context.auth.loading && !context.auth.user) {
      sessionStorage.setItem(
        REDIRECT_KEY,
        `${location.pathname}${location.searchStr}`,
      );
      throw redirect({ to: "/login" });
    }
  },
  component: PlanFormPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: ({ context, location }) => {
    if (!context.auth.loading && !context.auth.user) {
      sessionStorage.setItem(
        REDIRECT_KEY,
        `${location.pathname}${location.searchStr}`,
      );
      throw redirect({ to: "/login" });
    }
  },
  component: ProfilePage,
});

const savedPlansRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/saved-plans",
  beforeLoad: ({ context, location }) => {
    if (!context.auth.loading && !context.auth.user) {
      sessionStorage.setItem(
        REDIRECT_KEY,
        `${location.pathname}${location.searchStr}`,
      );
      throw redirect({ to: "/login" });
    }
  },
  component: SavedPlansPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: ForgotPasswordPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  browseRoute,
  studyPlanNewRoute,
  studyPlanEditRoute,
  studyPlansRoute,
  savedPlansRoute,
  profileRoute,
  loginRoute,
  registerRoute,
  forgotPasswordRoute,
]);

export const router = createRouter({
  routeTree,
  basepath: appBasePath,
  context: {
    auth: {
      user: null,
      loading: true,
    },
  },
});

export { REDIRECT_KEY };

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
