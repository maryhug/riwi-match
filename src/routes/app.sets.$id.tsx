import { createFileRoute, useParams } from "@tanstack/react-router";
import { SetBuilder } from "@/components/app/SetBuilder";
import { z } from "zod";

export const Route = createFileRoute("/app/sets/$id")({
  validateSearch: z.object({
    processId: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: "Match" }] }),
  component: SetDetalle,
});

function SetDetalle() {
  const { id } = useParams({ from: "/app/sets/$id" });
  const { processId } = Route.useSearch();
  return <SetBuilder setId={id} processId={processId} />;
}
