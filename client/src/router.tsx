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
import { setRedirectTarget } from "./lib/authRedirect";

type RouterContext = {
  auth: {
    user: AuthUser | null;
    loading: boolean;
  };
};

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

const requireAuth = ({ context, location }: { context: RouterContext; location: { pathname: string; searchStr: string } }) => {
  if (!context.auth.loading && !context.auth.user) {
    setRedirectTarget(location.pathname, location.searchStr);
    throw redirect({ to: "/login" });
  }
};

const requireGuest = ({ context }: { context: RouterContext }) => {
  if (!context.auth.loading && context.auth.user) {
    throw redirect({ to: "/" });
  }
};

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const browseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/browse",
  beforeLoad: requireAuth,
  component: () => <div>Browse (protected)</div>,
});

const studyPlansRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/study-plans",
  beforeLoad: requireAuth,
  component: StudyPlansPage,
});

const studyPlanNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/study-plans/new",
  beforeLoad: requireAuth,
  component: PlanFormPage,
});

const studyPlanEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/study-plans/$planId/edit",
  beforeLoad: requireAuth,
  component: PlanFormPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: requireAuth,
  component: ProfilePage,
});

const savedPlansRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/saved-plans",
  beforeLoad: requireAuth,
  component: SavedPlansPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: requireGuest,
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  beforeLoad: requireGuest,
  component: RegisterPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  beforeLoad: requireGuest,
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

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
