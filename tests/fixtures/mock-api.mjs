import { createServer } from "node:http";

const now = "2026-08-08T15:00:00Z";
const progress = {
  process_id: "process-qa",
  process_status: "MATCH_DONE",
  stage: "MATCH_DONE",
  stage_label: "Matching completado",
  updated_at: now,
  counts: {
    total_cvs: 1,
    cv_pending: 0,
    cv_processing: 0,
    cv_processed: 1,
    cv_errors: 0,
    match_pending: 0,
    match_processing: 0,
    matched: 1,
    profiling_queued: 0,
    profiling_active: 0,
    calls_active: 0,
    profiling_runs: 0,
    profiling_runs_terminal: 0,
    profiling_completed: 0,
    profiling_failed: 0,
    consistency_attention: 0,
  },
  active_calls: [],
};

const processItem = {
  process_id: "process-qa",
  name: "Backend QA 2026",
  job_title: "Backend Engineer",
  area: "Tecnologia",
  seniority: "Senior",
  status: "MATCH_DONE",
  budget_max_usd: 50,
  recruiter_id: "user-qa",
  recruiter_name: "Admin QA",
  created_at: now,
  progress,
};

const processDetail = {
  ...processItem,
  match_weights: null,
  question_set_id: "set-qa",
  voice_override_first_message: null,
  voice_override_language: "es",
  job_description: {
    jd_id: "jd-qa",
    version: 1,
    text_preview: "Backend Engineer con FastAPI y PostgreSQL",
    jd_raw_text: "Backend Engineer con FastAPI y PostgreSQL",
    jd_file_url: null,
    original_filename: null,
    created_at: now,
  },
  updated_at: now,
};

const processPrompts = [
  "CV_EXTRACTION",
  "CV_MATCH",
  "JD_ENHANCEMENT",
  "WHATSAPP_MESSAGE",
  "VOICE_CALL_AGENT",
  "VOICE_PROFILING",
].map((task_type) => ({
  id: `prompt-${task_type}`,
  process_id: "process-qa",
  task_type,
  version_name: "v1-migrada",
  system_prompt_text: `Instrucciones específicas para ${task_type}.`,
  source_prompt_id: "template-qa",
  is_active: true,
  created_by: "user-qa",
  created_at: now,
}));

const candidate = {
  rank: 1,
  process_candidate_id: "pc-qa",
  candidate_id: "candidate-qa",
  name: "Ada Lovelace",
  email: "ada@example.test",
  phone: "+15550000002",
  status: "MATCHED",
  match_percentage: 91,
  match_category: "HIGH",
  whatsapp_consent: "ACCEPTED",
  normalized_cv_url: null,
  city: "Medellin",
  availability_preference: { timezone: "America/Bogota", days: ["monday"] },
  total_cost: 0.12,
  match_summary: "Perfil alineado.",
  strengths: ["FastAPI", "PostgreSQL"],
  gaps: [],
  breakdown: {},
};

const questionSet = {
  id: "set-qa",
  name: "Set tecnico QA",
  description: "Preguntas sinteticas para E2E",
  version: 1,
  status: "DRAFT",
  created_by: "user-qa",
  created_at: now,
  updated_at: now,
  default_agent_id: null,
  default_first_message: null,
  default_language: "es",
  default_llm_model: null,
  default_voice_id: null,
  default_tts_stability: null,
  default_tts_speed: null,
  default_tts_similarity_boost: null,
  questions: [
    {
      id: "question-qa",
      question_set_id: "set-qa",
      text: "Cuentanos tu experiencia con FastAPI",
      type: "OPEN",
      expected_answer: null,
      positive_keywords: ["FastAPI"],
      risk_keywords: [],
      weight: 100,
      is_critical: true,
      eval_criteria: null,
      order_index: 0,
    },
  ],
};

const user = {
  id: "user-qa",
  name: "Admin",
  last_name: "QA",
  email: "admin@qa.test",
  role: "ADMIN",
  status: "ACTIVE",
  created_at: now,
  updated_at: now,
};

function json(response, status = 200) {
  return { status, body: JSON.stringify(response) };
}

function responseFor(method, pathname) {
  if (pathname === "/health") return json({ status: "ok" });
  if (pathname === "/api/v1/auth/login")
    return json({
      access_token: "qa-access-token",
      refresh_token: "qa-refresh-token",
      token_type: "bearer",
      role: "ADMIN",
    });
  if (pathname === "/api/v1/auth/refresh")
    return json({
      access_token: "qa-access-token",
      refresh_token: "qa-refresh-token",
      token_type: "bearer",
      role: "ADMIN",
    });
  if (pathname === "/api/v1/users/me") return json(user);
  if (pathname === "/api/v1/users") return json([user]);
  if (pathname === "/api/v1/notifications") return json({ notifications: [], unread_count: 0 });
  if (pathname === "/api/v1/processes") return json({ total: 1, processes: [processItem] });
  if (pathname === "/api/v1/processes/process-qa") return json(processDetail);
  if (pathname === "/api/v1/processes/process-qa/ai-prompts")
    return json({ prompts: processPrompts });
  if (pathname === "/api/v1/processes/process-qa/candidates")
    return json({ process_id: "process-qa", total: 1, candidates: [candidate] });
  if (pathname === "/api/v1/processes/process-qa/candidates/pc-qa")
    return json({
      process_candidate_id: "pc-qa",
      process_id: "process-qa",
      candidate: {
        candidate_id: "candidate-qa",
        name: "Ada Lovelace",
        email: "ada@example.test",
        phone: "+15550000002",
        cv_url: null,
        normalized_cv_url: null,
        profile: { city: "Medellin" },
      },
      status: "MATCHED",
      whatsapp_consent: "ACCEPTED",
      availability_preference: null,
      analysis_context: null,
      human_notes: null,
      human_override_match: null,
      match: {
        percentage: 91,
        category: "HIGH",
        summary: "Perfil alineado.",
        strengths: ["FastAPI"],
        gaps: [],
        breakdown: {},
      },
      costs: [],
      total_cost: 0.12,
    });
  if (pathname === "/api/v1/processes/process-qa/progress") return json(progress);
  if (pathname === "/api/v1/processes/process-qa/metrics")
    return json({
      process_id: "process-qa",
      total_cvs: 1,
      status_distribution: { MATCHED: 1 },
      match_distribution: { HIGH: 1 },
      total_cost_usd: 0.12,
      budget_max_usd: 50,
      cost_by_category: { voz: 0, twilio: 0, whatsapp: 0.01, llm: 0.11 },
    });
  if (pathname === "/api/v1/processes/process-qa/pipeline")
    return json({ process_id: "process-qa", total: 0, candidates: [] });
  if (pathname === "/api/v1/processes/process-qa/profiling/runs")
    return json({ total: 0, profiling_runs: [] });
  if (pathname === "/api/v1/processes/process-qa/job-descriptions") return json([]);
  if (pathname === "/api/v1/processes/process-qa/match/status")
    return json({
      process_id: "process-qa",
      process_status: "MATCH_DONE",
      total_candidates: 1,
      matched: 1,
      match_pending: 0,
      cv_processing: 0,
      errors: 0,
      progress_pct: 100,
      is_complete: true,
    });
  if (pathname === "/api/v1/question-sets") return json({ total: 1, question_sets: [questionSet] });
  if (pathname === "/api/v1/question-sets/set-qa") return json(questionSet);
  if (pathname === "/api/v1/profiling/board")
    return json({ timeframe: "today", total: 0, candidates: [] });
  if (pathname === "/api/v1/profiling/runs") return json({ total: 0, profiling_runs: [] });
  if (pathname === "/api/v1/metrics/dashboard")
    return json({
      total_cost_usd: 0.12,
      cost_by_process: [
        {
          process_id: "process-qa",
          process_name: "Backend QA 2026",
          total_cost: 0.12,
          candidate_count: 1,
        },
      ],
      cost_by_user: [{ user_id: "user-qa", user_name: "Admin QA", total_cost: 0.12 }],
      cost_by_operation: [{ operation_type: "CV_MATCH", total_cost: 0.12, count: 1 }],
      daily_costs: [{ date: "2026-08-08", cost: 0.12 }],
    });
  if (pathname === "/api/v1/reports/ta-dashboard")
    return json({
      total_processes: 1,
      active_processes: 1,
      total_candidates: 1,
      total_cost_usd: 0.12,
      team_members: [{ id: "user-qa", name: "Admin QA", role: "TA_LEADER" }],
    });
  if (pathname === "/api/v1/search")
    return json({
      total: 0,
      limit: 20,
      offset: 0,
      processes: [],
      candidates: [],
      question_sets: [],
    });
  if (pathname === "/api/v1/ai-config/models") return json({ models: [] });
  if (pathname === "/api/v1/ai-config/prompts") return json({ prompts: [] });
  if (pathname === "/api/v1/ai-config/global-settings")
    return json({
      settings: [
        {
          id: "setting-qa",
          setting_key: "max_call_attempts",
          setting_value: 3,
          updated_by: "user-qa",
          updated_at: now,
        },
      ],
    });
  if (pathname === "/api/v1/audit-logs") return json({ limit: 50, offset: 0, logs: [] });
  if (pathname === "/api/v1/system/integrations-health")
    return json({
      twilio: { status: "ok", details: "Mock controlado" },
      elevenlabs: { status: "ok", details: "Mock controlado" },
      meta: { status: "ok", details: "Mock controlado" },
      cloudflare_r2: { status: "ok", details: "Mock controlado" },
    });
  if (["POST", "PATCH", "DELETE"].includes(method)) return json({ status: "ok" });
  return json({ detail: `Mock no implementado: ${method} ${pathname}` }, 404);
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1:9090");
  process.stdout.write(`[mock-api] ${request.method ?? "GET"} ${url.pathname}\n`);
  const result = responseFor(request.method ?? "GET", url.pathname);
  response.writeHead(result.status, { "content-type": "application/json; charset=utf-8" });
  response.end(result.body);
});

server.listen(9090, "127.0.0.1", () => {
  process.stdout.write("Mock API QA escuchando en http://127.0.0.1:9090\n");
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
