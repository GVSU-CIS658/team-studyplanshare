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
  component: () => <div>StudyPlanShare</div>,
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
    }
    throw redirect({ to: "/login" });
  },
  component: () => <div> Browse(protected)</div>,
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

const routeTree = rootRoute.addChildren({
  homeRoute,
  browseRoute,
  loginRoute,
  registerRoute,
});

export const router = createRouter({
  routeTree,
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
