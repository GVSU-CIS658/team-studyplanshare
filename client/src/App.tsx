import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user, loading, sessionKey } = useAuth();
  return (
    <RouterProvider
      key={sessionKey}
      router={router}
      context={{
        auth: {
          user,
          loading,
        },
      }}
    />
  );
}

export default App;
