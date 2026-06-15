import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch on window focus for always-fresh data
      refetchOnWindowFocus: true,
      // Retry once on failure
      retry: 1,
      // Treat data as stale immediately so every navigation triggers a refetch
      staleTime: 0,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
