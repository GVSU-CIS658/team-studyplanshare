import React from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <section style={{ maxWidth: 720, margin: "3rem auto", padding: "1rem" }}>
      <h1>Home</h1>
      <p>Welcome {user?.name ?? "Student"}!</p>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <Link to="/browse">Browse Plans</Link>
        <button onClick={() => logout()}>Logout</button>
      </div>
    </section>
  );
}
