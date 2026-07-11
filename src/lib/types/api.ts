// Tipos alineados 1:1 con las respuestas JSON del backend (cv-match-api).
// Fuente de verdad: Backend/src/api/v1/*.py (leídos directamente, no inferidos).
// Ver src/lib/types/enums.ts para los literal unions de estado + sus labels en español.

import type {
  AdvancementProbability,
  CandidateStatus,
  MatchCategory,
  ProcessStatus,
  ProfilingRunStatus,
  QuestionSetStatus,
  QuestionType,
  UserRole,
  UserStatus,
  WhatsAppConsentStatus,
} from "./enums";

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: string;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  last_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

// ─── Processes ───────────────────────────────────────────────────────────────

export interface CreateProcessRequest {
  name: string;
  job_title: string;
  area: string;
  seniority: string;
  budget_max_usd?: number;
  match_weights_override?: MatchWeights;
}

export interface MatchWeights {
  technical_skills: number;
  relevant_experience: number;
  seniority: number;
  industry_domain: number;
  languages: number;
  education_certifications: number;
}

/** POST /processes, PATCH /processes/{id} */
export interface ProcessMutationResponse {
  process_id: string;
  name: string;
  job_title: string;
  area: string;
  seniority: string;
  status: ProcessStatus;
  budget_max_usd: number;
}

/** Item dentro de GET /processes (lista) */
export interface ProcessListItem {
  process_id: string;
  name: string;
  job_title: string;
  area: string;
  seniority: string;
  status: ProcessStatus;
  budget_max_usd: number;
  recruiter_id: string;
  recruiter_name: string;
  created_at: string;
}

export interface ProcessListResponse {
  total: number;
  processes: ProcessListItem[];
}

export interface JobDescriptionSummary {
  jd_id: string;
  version: number;
  text_preview: string;
  jd_raw_text: string;
  jd_file_url: string | null;
  original_filename: string | null;
  created_at: string;
}

/** GET /processes/{id} */
export interface ProcessDetailResponse {
  process_id: string;
  name: string;
  job_title: string;
  area: string;
  seniority: string;
  status: ProcessStatus;
  budget_max_usd: number;
  match_weights: MatchWeights | null;
  recruiter_id: string;
  recruiter_name: string;
  question_set_id: string | null;
  voice_override_system_prompt: string | null;
  voice_override_first_message: string | null;
  job_description: JobDescriptionSummary | null;
  created_at: string;
  updated_at: string;
}

export interface VoiceConfig {
  voice_override_agent_id: string | null;
  voice_override_system_prompt: string | null;
  voice_override_first_message: string | null;
  voice_override_language: string | null;
  voice_override_llm_model: string | null;
  voice_override_voice_id: string | null;
  voice_override_tts_stability: number | null;
  voice_override_tts_speed: number | null;
  voice_override_tts_similarity_boost: number | null;
}

export interface CreateJDResponse {
  jd_id: string;
  process_id: string;
  version: number;
  created_at: string;
}

export interface ParseJDResponse {
  must_have: string[];
  nice_to_have: string[];
  deal_breakers: string[];
  summary: string;
}

export interface EnhanceJDResponse {
  jd_id: string;
  process_id: string;
  version: number;
  recommendations: string[];
  missing_elements: string[];
  created_at: string;
}

export interface UploadJDResponse {
  jd_id: string;
  process_id: string;
  version: number;
  jd_file_url: string;
  original_filename: string;
  text_length: number;
  created_at: string;
}

export type JobDescriptionListResponse = Array<{
  jd_id: string;
  version: number;
  text_preview: string;
  jd_file_url: string | null;
  original_filename: string | null;
  created_at: string;
}>;

export interface ProcessMetricsResponse {
  process_id: string;
  total_cvs: number;
  status_distribution: Partial<Record<CandidateStatus, number>>;
  match_distribution: Partial<Record<MatchCategory, number>>;
  total_cost_usd: number;
  budget_max_usd: number;
}

// ─── Candidates ──────────────────────────────────────────────────────────────

export interface MatchBreakdownItem {
  raw_score: number;
  weight: number;
  weighted_score: number;
  jd_requirement: string;
  candidate_evidence: string;
  gap: string | null;
}

export interface MatchBreakdown {
  technical_skills: MatchBreakdownItem;
  relevant_experience: MatchBreakdownItem;
  seniority: MatchBreakdownItem;
  industry_domain: MatchBreakdownItem;
  languages: MatchBreakdownItem;
  education_certifications: MatchBreakdownItem;
}

export interface UploadCVsResponse {
  uploaded: number;
  candidates: Array<{
    candidate_id: string;
    process_candidate_id: string;
    filename: string;
    task_id: string;
    status: "LOADED";
  }>;
}

/** Item dentro de GET /processes/{id}/candidates (lista, distinto del detalle) */
export interface CandidateListItem {
  rank: number;
  process_candidate_id: string;
  candidate_id: string;
  name: string;
  email: string;
  phone: string | null;
  status: CandidateStatus;
  match_percentage: number;
  match_category: MatchCategory | null;
  whatsapp_consent: WhatsAppConsentStatus;
  normalized_cv_url: string | null;
  city: string | null;
  // Presentes solo si match_explanation existe — el backend omite la clave, no la manda null.
  match_summary?: string | null;
  strengths?: string[];
  gaps?: string[];
  breakdown?: MatchBreakdown | Record<string, never>;
}

export interface CandidateListResponse {
  process_id: string;
  total: number;
  candidates: CandidateListItem[];
}

/** GET /processes/{id}/candidates/{pcId} — shape distinto del item de lista */
export interface CandidateDetailResponse {
  process_candidate_id: string;
  process_id: string;
  candidate: {
    candidate_id: string;
    name: string;
    email: string;
    phone: string | null;
    cv_url: string | null;
    normalized_cv_url: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profile: Record<string, any> | null;
  };
  status: CandidateStatus;
  whatsapp_consent: WhatsAppConsentStatus;
  human_notes: string | null;
  /** Ojo: el backend colapsa 0 a null (`if pc.human_override_match else None`). */
  human_override_match: number | null;
  match: {
    percentage: number;
    category: MatchCategory | null;
    summary: string | null;
    strengths: string[];
    gaps: string[];
    breakdown: MatchBreakdown | Record<string, never>;
  } | null;
  costs: Array<{
    operation_type: string;
    model_used: string | null;
    tokens_input: number | null;
    tokens_output: number | null;
    call_duration_s: number | null;
    estimated_cost: number;
    created_at: string;
  }>;
  total_cost: number;
}

export interface OverrideCandidateRequest {
  human_notes?: string | null;
  human_override_match?: number | null;
}

// ─── Question Sets ───────────────────────────────────────────────────────────

export interface QuestionOut {
  id: string;
  question_set_id: string;
  order_index: number;
  text: string;
  type: QuestionType;
  expected_answer: string | null;
  positive_keywords: string[];
  risk_keywords: string[];
  weight: number;
  is_critical: boolean;
  eval_criteria: string | null;
}

export interface QuestionSetVoiceDefaults {
  default_agent_id: string | null;
  default_system_prompt: string | null;
  default_first_message: string | null;
  default_language: string | null;
  default_llm_model: string | null;
  default_voice_id: string | null;
  default_tts_stability: number | null;
  default_tts_speed: number | null;
  default_tts_similarity_boost: number | null;
}

export interface QuestionSetOut extends QuestionSetVoiceDefaults {
  id: string;
  name: string;
  description: string | null;
  version: number;
  status: QuestionSetStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  /** Presente en create/list/get; AUSENTE en la respuesta de PATCH. */
  questions?: QuestionOut[];
}

export interface QuestionSetListResponse {
  total: number;
  question_sets: QuestionSetOut[];
}

export interface QuestionIn {
  text: string;
  type: QuestionType;
  expected_answer?: string | null;
  positive_keywords?: string[];
  risk_keywords?: string[];
  weight?: number;
  is_critical?: boolean;
  eval_criteria?: string | null;
}

// ─── Profiling ───────────────────────────────────────────────────────────────

export interface ProfilingRunOut {
  id: string;
  process_candidate_id: string;
  candidate_id: string;
  candidate_name: string;
  question_set_id: string;
  status: ProfilingRunStatus;
  call_attempts: number;
  advancement_probability: AdvancementProbability | null;
  advancement_explanation: string | null;
  transcription_url: string | null;
  transcript_summary: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TriggerProfilingResponse {
  process_id: string;
  queued: number;
  tasks: Array<{ process_candidate_id: string; task_id: string }>;
  skipped: Array<{ process_candidate_id: string; reason: string }>;
}

export interface ProfilingRunListResponse {
  total: number;
  profiling_runs: ProfilingRunOut[];
}

export interface ProfilingAnswerOut {
  id: string;
  question: {
    id: string;
    text: string;
    weight: number;
    is_critical: boolean;
  };
  transcription: string | null;
  normalized_answer: string | null;
  evaluation_result: string | null;
  /** 0-1, no porcentaje. */
  confidence_score: number | null;
  requires_review: boolean;
}

export interface ProfilingAnswersResponse {
  answers: ProfilingAnswerOut[];
}

// ─── Match ───────────────────────────────────────────────────────────────────

export type TriggerMatchResponse =
  | { process_id: string; queued: 0; message: string }
  | {
      process_id: string;
      queued: number;
      tasks: Array<{ process_candidate_id: string; task_id: string }>;
    };

export interface MatchStatusResponse {
  process_id: string;
  process_status: ProcessStatus;
  total_candidates: number;
  matched: number;
  match_pending: number;
  cv_processing: number;
  errors: number;
  progress_pct: number;
  is_complete: boolean;
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export interface MetricsDashboardResponse {
  total_cost_usd: number;
  cost_by_process: Array<{
    process_id: string;
    process_name: string;
    total_cost: number;
    candidate_count: number;
  }>;
  cost_by_user: Array<{
    user_id: string;
    user_name: string;
    total_cost: number;
  }>;
  cost_by_operation: Array<{
    operation_type: string;
    total_cost: number;
    count: number;
  }>;
  daily_costs: Array<{ date: string; cost: number }>;
}

// ─── AI Config ───────────────────────────────────────────────────────────────

export interface AIModelOut {
  id: string;
  task_type: string;
  provider: string;
  model_name: string;
  is_active: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface AIPromptOut {
  id: string;
  task_type: string;
  version_name: string;
  system_prompt_text: string;
  is_active: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface GlobalSettingOut {
  id: string;
  setting_key: string;
  setting_value: Record<string, any>;
  updated_by: string | null;
  updated_at: string;
}

// ─── Audit / Reports / Feedback ──────────────────────────────────────────────

export interface AuditLogOut {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogListResponse {
  limit: number;
  offset: number;
  logs: AuditLogOut[];
}

export interface TADashboardResponse {
  total_processes: number;
  active_processes: number;
  total_candidates: number;
  total_cost_usd: number;
}
