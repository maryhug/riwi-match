import { createFileRoute, useParams } from "@tanstack/react-router";
import { sets } from "@/lib/mock-data";
import { SetBuilder } from "@/components/app/SetBuilder";

export const Route = createFileRoute("/app/sets/$id")({
  head: () => ({ meta: [{ title: "Editar set de preguntas · RIWI MATCH" }] }),
  component: SetDetalle,
});

function SetDetalle() {
  const { id } = useParams({ from: "/app/sets/$id" });
  const setInfo = sets.find((s) => s.id === id) ?? null;
  return <SetBuilder isNew={false} setInfo={setInfo} />;
}
