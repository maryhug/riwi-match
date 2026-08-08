import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import type { ProfilingAnswersResponse, ProfilingRunOut } from "../../src/lib/types/api";

export function TestQueryProvider({
  children,
  run,
  answers,
}: {
  children: ReactNode;
  run?: ProfilingRunOut;
  answers?: ProfilingAnswersResponse;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
      }),
  );
  if (run) client.setQueryData(["profiling-run-detail", run.id], run);
  if (run && answers) client.setQueryData(["profiling-answers", run.id], answers);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
