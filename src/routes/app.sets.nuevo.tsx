import { createFileRoute } from "@tanstack/react-router";
import { SetBuilder } from "@/components/app/SetBuilder";

export const Route = createFileRoute("/app/sets/nuevo")({
  head: () => ({ meta: [{ title: "Nuevo set de preguntas · RIWI MATCH" }] }),
  component: () => <SetBuilder isNew setInfo={null} />,
});
