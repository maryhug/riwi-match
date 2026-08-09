import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/experimental-ct-react";
import { AppSelect, AppSelectItem } from "../../src/components/app/AppSelect";
import { GlassCard } from "../../src/components/app/GlassCard";
import { LoadingIndicator } from "../../src/components/app/LoadingIndicator";
import { PipelineBoard } from "../../src/components/app/PipelineBoard";
import { ProfilingResultModal } from "../../src/components/app/ProfilingResultModal";
import { QuestionFormDialog } from "../../src/components/app/QuestionFormDialog";
import { UploadCvsModal } from "../../src/components/app/UploadCvsModal";
import type {
  PipelineCandidate,
  ProcessHomeResponse,
  ProfilingRunOut,
} from "../../src/lib/types/api";
import { homeProcessesRefetchInterval } from "../../src/lib/polling";
import { TestQueryProvider } from "./TestQueryProvider";

const run: ProfilingRunOut = {
  id: "run-qa",
  process_candidate_id: "pc-qa",
  candidate_id: "candidate-qa",
  candidate_name: "Ada Lovelace",
  question_set_id: "set-qa",
  status: "COMPLETED",
  call_attempts: 1,
  advancement_probability: "HIGH",
  advancement_explanation: "Cumple los criterios del rol.",
  transcription_url: null,
  transcript_summary: "Entrevista completada.",
  transcript_turns: [],
  has_audio: false,
  started_at: "2026-08-08T10:00:00Z",
  completed_at: "2026-08-08T10:05:00Z",
  created_at: "2026-08-08T10:00:00Z",
  updated_at: "2026-08-08T10:05:00Z",
  elapsed_seconds: 300,
  is_stale: false,
};

const pipelineItem: PipelineCandidate = {
  process_candidate_id: "pc-qa",
  candidate_id: "candidate-qa",
  candidate_name: "Ada Lovelace",
  candidate_email: "ada@example.test",
  board_column: "COMPLETED",
  state_label: "Completada",
  candidate_status: "PROFILING_COMPLETED",
  whatsapp_consent_status: "ACCEPTED",
  latest_run: {
    id: run.id,
    status: run.status,
    call_attempts: 1,
    started_at: run.started_at,
    completed_at: run.completed_at,
    created_at: run.created_at,
    updated_at: run.updated_at,
    advancement_probability: "HIGH",
    twilio_status_detail: "completed",
  },
  run_count: 1,
  process: null,
  recruiter: null,
  effective_updated_at: run.updated_at,
  consistency: "OK",
  consistency_explanation: null,
};

test("AppSelect muestra y permite escoger opciones", async ({ mount, page }) => {
  await mount(
    <AppSelect value="all" onValueChange={() => {}} placeholder="Proceso">
      <AppSelectItem value="all">Todos</AppSelectItem>
      <AppSelectItem value="qa">QA Backend</AppSelectItem>
    </AppSelect>,
  );
  await page.getByRole("combobox").click();
  await expect(page.getByRole("option", { name: "QA Backend" })).toBeVisible();
});

test("GlassCard conserva contenido y semantica", async ({ mount, page }) => {
  await mount(<GlassCard aria-label="Resumen QA">Contenido estable</GlassCard>);
  await expect(page.getByLabel("Resumen QA")).toContainText("Contenido estable");
});

test("LoadingIndicator anuncia el estado", async ({ mount, page }) => {
  await mount(<LoadingIndicator label="Validando datos" />);
  await expect(page.getByRole("status")).toHaveText("Validando datos");
});

test("polling de inicio se acelera solo cuando hay trabajo activo", async () => {
  expect(homeProcessesRefetchInterval(undefined)).toBe(30_000);
  const activeData = {
    items: [{ progress: { counts: { cv_processing: 1 } } }],
  } as ProcessHomeResponse;
  const settledData = {
    items: [
      {
        progress: {
          counts: {
            cv_processing: 0,
            match_processing: 0,
            profiling_active: 0,
            calls_active: 0,
          },
        },
      },
    ],
  } as ProcessHomeResponse;

  expect(homeProcessesRefetchInterval(activeData)).toBe(5_000);
  expect(homeProcessesRefetchInterval(settledData)).toBe(30_000);
});

test("PipelineBoard distribuye candidatos y estados vacios", async ({ mount, page }) => {
  await mount(<PipelineBoard items={[pipelineItem]} includeCvMatch />);
  await expect(page.getByText("Ada Lovelace")).toBeVisible();
  await expect(page.getByText("Completada", { exact: true })).toBeVisible();
  await expect(page.getByText("Sin candidatos")).toHaveCount(4);
});

test("QuestionFormDialog valida y entrega una pregunta", async ({ mount, page }) => {
  await mount(
    <QuestionFormDialog open initial={null} onOpenChange={() => {}} onSubmit={() => {}} />,
  );
  const save = page.getByRole("button", { name: "Guardar pregunta" });
  await expect(save).toBeDisabled();
  await page.getByPlaceholder(/Cuantos anos|Cuántos años/).fill("¿Dominas FastAPI?");
  await expect(save).toBeEnabled();
});

test("UploadCvsModal filtra tamano y lista archivos validos", async ({ mount, page }) => {
  await mount(
    <TestQueryProvider>
      <UploadCvsModal processId="process-qa" open onClose={() => {}} />
    </TestQueryProvider>,
  );
  await page.locator('input[type="file"]').setInputFiles({
    name: "cv-qa.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 QA"),
  });
  await expect(page.getByText("cv-qa.pdf")).toBeVisible();
  await expect(page.getByRole("button", { name: "Subir 1 CV(s)" })).toBeEnabled();
});

test("ProfilingResultModal presenta resultado y no tiene violaciones criticas", async ({
  mount,
  page,
}) => {
  await mount(
    <TestQueryProvider run={run} answers={{ answers: [] }}>
      <ProfilingResultModal run={run} open onClose={() => {}} />
    </TestQueryProvider>,
  );
  await expect(page.getByText("Ada Lovelace")).toBeVisible();
  await expect(page.getByText("Avance: Alta")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => violation.impact === "critical")).toEqual([]);
});
