import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user, loading } = useAuth();
  return (
    <RouterProvider
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
