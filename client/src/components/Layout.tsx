import React from "react";
import { useAuth } from "../hooks/useAuth";
import Avatar from "./ui/avatar";
import { Button } from "./ui/button";
import { Link } from "@tanstack/react-router";

export default function Layout({ children }) {
  const { user, loading } = useAuth();

  let navContent;
  if (loading) {
    navContent = <span className="text-muted-foreground">Loading...</span>;
  } else if (user) {
    navContent = (
      <Link to="/study-plans" aria-label="Profile">
        <Avatar alt={user.name || user.email || "User"} />
      </Link>
    );
  } else {
    navContent = (
      <Link to="/login" aria-label="Login or Signup">
        <Button variant="default" size="sm" className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l-3-3m0 0l3-3m-3 3h9"
            />
          </svg>
          <span>Login</span>
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between w-full px-6 py-4 bg-white border-b border-border dark:bg-background">
        <h1 className="text-xl font-bold">StudyPlanShare</h1>
        <nav aria-label="User navigation">{navContent}</nav>
      </header>
      {/* Main content */}
      <main
        className="container flex-1 px-4 py-8 mx-auto"
        tabIndex={-1}
        id="main-content"
      >
        {children}
      </main>
      {/* Footer */}
      <footer className="w-full px-6 py-4 text-xs text-center bg-white border-t border-border dark:bg-background">
        &copy; {new Date().getFullYear()} StudyPlanShare
      </footer>
    </div>
  );
}
