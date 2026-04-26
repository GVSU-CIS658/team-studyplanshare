import { useRouter, Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 w-full border-b border-border bg-white/90 backdrop-blur dark:bg-background/90">
        <div className="flex items-center justify-between w-full max-w-6xl gap-4 px-4 py-4 mx-auto sm:px-6">
          <Link to="/" className="text-lg font-bold tracking-tight">
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

          <div className="flex items-center gap-2">
            {authControls}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close mobile menu"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 z-50 w-64 h-full bg-white border-l dark:bg-background border-border md:hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-semibold">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="flex flex-col p-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                    className: "justify-start",
                  })}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}

      <main className="flex-1 w-full max-w-6xl px-4 py-6 mx-auto sm:px-6 sm:py-8">
        {children}
      </main>

      <footer className="w-full px-6 py-4 text-xs text-center bg-white border-t border-border dark:bg-background">
        &copy; {new Date().getFullYear()} StudyPlanShare
      </footer>
    </div>
  );
}
