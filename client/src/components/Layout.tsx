import { useRouter, Link } from "@tanstack/react-router";
import {
  Bookmark,
  House,
  LogIn,
  LogOut,
  NotebookText,
  UserRound,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Avatar from "./ui/avatar";
import { Button, buttonVariants } from "./ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/study-plans", label: "My Plans" },
  { to: "/saved-plans", label: "Saved" },
];

export default function Layout({ children }) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const pathname = router.state.location.pathname;
  const isAuthScreen =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password";

  const handleLogout = async () => {
    await logout();
    await router.navigate({ to: "/login" });
  };

  const authControls = (() => {
    if (!loading && user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar alt={user.name || user.email || "User"} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{user.name || user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.navigate({ to: "/profile" })}
              >
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    if (!loading && !isAuthScreen) {
      return (
        <Link to="/login">
          <Button size="sm">Sign In</Button>
        </Link>
      );
    }

    return null;
  })();

  const mobileLinks = [
    { to: "/", label: "Home", icon: House },
    { to: "/study-plans", label: "Plans", icon: NotebookText },
    { to: "/saved-plans", label: "Saved", icon: Bookmark },
  ];

  const mobileAuthControls = (() => {
    if (loading || isAuthScreen || !user) {
      return (
        <Link
          to="/login"
          className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogIn className="h-5 w-5" />
          <span>Sign In</span>
        </Link>
      );
    }

    return (
      <>
        <Link
          to="/profile"
          className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <UserRound className="h-5 w-5" />
          <span>Profile</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </>
    );
  })();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 w-full border-b border-border bg-white/90 backdrop-blur dark:bg-background/90">
        <div className="flex items-center justify-between w-full max-w-6xl gap-4 px-4 py-4 mx-auto sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight"
          >
            <svg
              className="w-6 h-6 shrink-0"
              viewBox="0 0 32 32"
              aria-hidden="true"
            >
              <rect width="32" height="32" rx="6" fill="#4f46e5" />
              <path
                d="M7 8a2 2 0 0 1 2-2h6l1 2h7a2 2 0 0 1 2 2v4H7V8z"
                fill="#a5b4fc"
              />
              <rect x="7" y="13" width="18" height="13" rx="1" fill="#e0e7ff" />
              <path
                d="M11 17h10M11 20h7"
                stroke="#4f46e5"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            StudyPlanShare
          </Link>

          <nav aria-label="Desktop navigation" className="hidden gap-2 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">{authControls}</div>
        </div>
      </header>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 px-3 py-2 backdrop-blur md:hidden dark:bg-background/95"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-5 gap-1">
          {mobileLinks.map((link) => {
            const Icon = link.icon;

            return (
              <Link
                key={link.to}
                to={link.to}
                className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {mobileAuthControls}
        </div>
      </nav>

      <main className="flex-1 w-full max-w-6xl px-4 py-6 pb-24 mx-auto sm:px-6 sm:py-8 md:pb-8">
        {children}
      </main>

      <footer className="w-full px-6 py-4 text-xs text-center bg-white border-t border-border dark:bg-background">
        &copy; {new Date().getFullYear()} StudyPlanShare
      </footer>
    </div>
  );
}
