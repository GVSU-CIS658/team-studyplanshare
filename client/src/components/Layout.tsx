import { useRouter, Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
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

  let navContent;
  if (loading) {
    navContent = <span className="text-muted-foreground">Loading...</span>;
  } else if (user) {
    navContent = (
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Open profile menu"
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar alt={user.name || user.email || "User"} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              {user.name || user.email || "Account"}
            </DropdownMenuLabel>
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
  } else if (isAuthScreen) {
    navContent = null;
  } else {
    navContent = (
      <Link to="/login" aria-label="Login or Signup">
        <Button
          variant="default"
          size="sm"
          className="h-10 rounded-2xl border-0 bg-slate-900 px-4 text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <LogIn className="w-4 h-4" />
          <span className="font-medium">Sign In</span>
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 w-full border-b border-border bg-white/90 backdrop-blur dark:bg-background/90">
        <div className="flex items-center justify-between w-full max-w-6xl gap-4 px-4 py-4 mx-auto sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-bold tracking-tight">
              StudyPlanShare
            </Link>
            <nav
              aria-label="Primary navigation"
              className="items-center hidden gap-2 md:flex"
            >
              <Link
                to="/"
                className={buttonVariants({
                  variant: pathname === "/" ? "secondary" : "ghost",
                  size: "sm",
                })}
              >
                Home
              </Link>
              <Link
                to="/study-plans"
                className={buttonVariants({
                  variant: pathname === "/study-plans" ? "secondary" : "ghost",
                  size: "sm",
                })}
              >
                My Plans
              </Link>
              <Link
                to="/saved-plans"
                className={buttonVariants({
                  variant: pathname === "/saved-plans" ? "secondary" : "ghost",
                  size: "sm",
                })}
              >
                Saved
              </Link>
            </nav>
          </div>
          <nav aria-label="User navigation">{navContent}</nav>
        </div>
      </header>
      <main
        className="flex-1 w-full max-w-6xl px-4 py-6 mx-auto sm:px-6 sm:py-8"
        tabIndex={-1}
        id="main-content"
      >
        {children}
      </main>
      <footer className="w-full px-6 py-4 text-xs text-center bg-white border-t border-border dark:bg-background">
        &copy; {new Date().getFullYear()} StudyPlanShare
      </footer>
    </div>
  );
}
