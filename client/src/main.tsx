import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";
import { appPathPrefix } from "./lib/basePath";

const fallbackPath = new URLSearchParams(window.location.search).get("p");

if (fallbackPath) {
  const targetPath = fallbackPath.startsWith("/")
    ? fallbackPath
    : `/${fallbackPath}`;

  window.history.replaceState(
    window.history.state,
    "",
    `${appPathPrefix}${targetPath}`,
  );
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
