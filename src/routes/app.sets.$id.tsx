import { createFileRoute, useParams } from "@tanstack/react-router";
import { SetBuilder } from "@/components/app/SetBuilder";

export const Route = createFileRoute("/app/sets/$id")({
  head: () => ({ meta: [{ title: "Editar set de preguntas · RIWI MATCH" }] }),
  component: SetDetalle,
});

function SetDetalle() {
  const { id } = useParams({ from: "/app/sets/$id" });
  return <SetBuilder setId={id} />;
}
