export type Role = 'ADMIN' | 'RECRUITER' | 'TA_LEADER';

export interface User {
  id: string;
  name: string;
  last_name: string;
  email: string;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED';
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  role: Role;
}

// ─── Process statuses ─────────────────────────────────────────────────────────
// Estos son los statuses que usa el FRONT (mapeados desde el backend en api.ts)
export type ProcessStatus =
  | 'DRAFT'
  | 'READY_FOR_MATCH'
  | 'CVS_UPLOADED'
  | 'MATCHING'
  | 'PROFILING_CONFIGURED'
  | 'COMPLETED';

// Statuses exactos del BACKEND (usados en los tipos de respuesta de API)
export type BackendProcessStatus =
  | 'DRAFT'
  | 'CVS_UPLOADED'
  | 'MATCH_PROCESSING'
  | 'MATCH_DONE'
  | 'PROFILING_CONFIGURED'
  | 'PROFILING_ACTIVE'
  | 'PROFILING_COMPLETED'
  | 'CLOSED'
  | 'ARCHIVED';

export type BackendCandidateStatus =
  | 'LOADED'
  | 'CV_PROCESSING'
  | 'CV_ERROR'
  | 'MATCH_PENDING'
  | 'MATCH_PROCESSING'
  | 'MATCHED'
  | 'SELECTED_FOR_PROFILING'
  | 'PROFILING_QUEUED'
  | 'PROFILING_CALLING'
  | 'PROFILING_COMPLETED'
  | 'PROFILING_FAILED'
  | 'DISCARDED';

// ─── HiringProcess (shape usada por el front) ─────────────────────────────────
export interface HiringProcess {
  id: string;
  name: string;
  job_title: string;
  area: string;
  seniority: string;
  status: ProcessStatus;
  budget_max_usd: number;
  recruiter_id: string;
  question_set_id?: string;
  created_at: string;
  updated_at: string;
  /** Datos de la JD activa — solo disponible en GET /processes/{id} */
  job_description_data?: {
    jd_id: string;
    version: number;
    text_preview: string;
    jd_raw_text: string;
    jd_file_url: string | null;
    original_filename: string | null;
    created_at: string;
  } | null;
}

// ─── Backend raw response types ───────────────────────────────────────────────

export interface ProcessesListResponse {
  total: number;
  processes: Array<{
    process_id: string;
    name: string;
    job_title: string;
    area: string;
    seniority: string;
    status: string;
    budget_max_usd: number;
    created_at: string;
  }>;
}

export interface ProcessDetail {
  process_id: string;
  name: string;
  job_title: string;
  area: string;
  seniority: string;
  status: string;
  budget_max_usd: number;
  match_weights: Record<string, number> | null;
  job_description: {
    jd_id: string;
    version: number;
    text_preview: string;
    jd_raw_text: string;
    jd_file_url: string | null;
    original_filename: string | null;
    created_at: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface JobDescriptionSaved {
  jd_id: string;
  process_id: string;
  version: number;
  created_at: string;
}

export interface BreakdownItem {
  raw_score?: number;
  weighted_score?: number;
  weight: number;
}

export interface MatchBreakdown {
  technical_skills?: BreakdownItem;
  relevant_experience?: BreakdownItem;
  seniority?: BreakdownItem;
  industry_domain?: BreakdownItem;
  languages?: BreakdownItem;
  education_certifications?: BreakdownItem;
}

export interface CandidateListItem {
  rank: number;
  process_candidate_id: string;
  candidate_id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  match_percentage: number;
  match_category: string | null;
  whatsapp_consent: string | null;
  normalized_cv_url: string | null;
  city?: string | null;
  match_summary?: string;
  strengths?: string[];
  gaps?: string[];
  breakdown?: MatchBreakdown;
}

export interface CandidateListResponse {
  process_id: string;
  total: number;
  candidates: CandidateListItem[];
}

export interface MatchTriggerResponse {
  process_id: string;
  queued: number;
  tasks: Array<{ process_candidate_id: string; task_id: string }>;
}

export interface MatchStatusResponse {
  process_id: string;
  process_status: string;
  total_candidates: number;
  matched: number;
  match_pending: number;
  cv_processing: number;
  errors: number;
  progress_pct: number;
  is_complete: boolean;
}

// ─── JobDescription (shape front) ─────────────────────────────────────────────
export interface JobDescription {
  id: string;
  process_id: string;
  version: number;
  jd_raw_text: string;
  jd_file_url?: string | null;
  original_filename?: string | null;
  structured_jd: StructuredJD;
  created_at: string;
}

export interface StructuredJD {
  must_have: string[];
  nice_to_have: string[];
  deal_breakers: string[];
  weights: Record<string, number>;
  summary?: string;
  raw_text?: string;
}

// ─── Candidates (shapes front/kanban) ─────────────────────────────────────────
export type MatchCategory = 'HIGH' | 'MEDIUM' | 'LOW';
export type CandidateStatus =
  | 'LOADED'
  | 'PARSING'
  | 'PARSED'
  | 'MATCHING'
  | 'MATCHED'
  | 'SELECTED_FOR_PROFILING'
  | 'DISCARDED';

export interface Candidate {
  id: string;
  name: string;
  last_name: string;
  email: string;
  phone: string;
  cv_file_url: string;
  extracted_profile?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MatchExplanation {
  strengths: string[];
  gaps: string[];
  summary: string;
  risk_flags?: string[];
}

export interface ProcessCandidate {
  id: string;
  process_id: string;
  candidate_id: string;
  status: CandidateStatus | string;
  match_percentage: number;
  match_category?: MatchCategory | null;
  match_explanation?: MatchExplanation;
  human_notes?: string;
  created_at: string;
  updated_at: string;
  candidate: Candidate;
}

// ─── Dual match (CV + Profiling) ──────────────────────────────────────────────
export interface DualMatchCandidate extends ProcessCandidate {
  cv_match_percentage: number;
  cv_match_category: 'HIGH' | 'MEDIUM' | 'LOW';
  cv_match_explanation: {
    strengths: string[];
    gaps: string[];
    summary: string;
    risk_flags?: string[];
  };
}

export interface DualKanbanResponse {
  HIGH: DualMatchCandidate[];
  MEDIUM: DualMatchCandidate[];
  LOW: DualMatchCandidate[];
  LOADED: DualMatchCandidate[];
  PARSING: DualMatchCandidate[];
}

export interface KanbanResponse {
  HIGH: ProcessCandidate[];
  MEDIUM: ProcessCandidate[];
  LOW: ProcessCandidate[];
  LOADED: ProcessCandidate[];
  PARSING: ProcessCandidate[];
}

// ─── Candidate detail (backend raw) ───────────────────────────────────────────
export interface CandidateDetail {
  process_candidate_id: string;
  process_id: string;
  candidate: {
    candidate_id: string;
    name: string;
    email: string;
    phone: string | null;
    cv_url: string | null;
    normalized_cv_url: string | null;
    profile: Record<string, unknown> | null;
  };
  status: string;
  whatsapp_consent: string | null;
  human_notes: string | null;
  human_override_match: number | null;
  match: {
    percentage: number;
    category: string;
    summary: string | null;
    strengths: string[];
    gaps: string[];
    breakdown: MatchBreakdown;
  } | null;
}

// ─── Question Sets ─────────────────────────────────────────────────────────────
export type ProfilingStatus = 'PENDING' | 'CALLING' | 'COMPLETED' | 'FAILED' | 'NO_ANSWER';

export interface ProfilingQuestion {
  id: string;
  question_set_id: string;
  order_index: number;
  text: string;
  type: 'OPEN' | 'CLOSED' | 'MULTIPLE_CHOICE' | 'YES_NO' | 'NUMERIC' | 'SCALE' | string;
  /** alias frontend — el backend lo llama expected_answer */
  desired_answer?: string;
  expected_answer?: string;
  positive_keywords: string[];
  risk_keywords: string[];
  weight: number;
  is_critical: boolean;
  eval_criteria?: string;
}

export interface QuestionSet {
  id: string;
  name: string;
  description?: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  created_by: string;
  created_at: string;
  updated_at: string;
  questions?: ProfilingQuestion[];
}

export interface ProfilingRun {
  id: string;
  process_id: string;
  candidate_id: string;
  question_set_id: string;
  status: ProfilingStatus;
  call_attempts: number;
  advancement_prob?: 'HIGH' | 'MEDIUM' | 'LOW' | 'REJECT';
  transcription_url?: string;
  profiling_eval?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  candidate?: Candidate;
}

// ─── Settings / Metrics ────────────────────────────────────────────────────────
export interface AIModelConfig {
  id: string;
  task_type: string;
  provider: 'OPENAI' | 'ANTHROPIC' | 'ELEVENLABS';
  model_name: string;
  is_active: boolean;
  updated_by: string;
  updated_at: string;
}

export interface AIPrompt {
  id: string;
  task_type: string;
  version_name: string;
  system_prompt_text: string;
  is_active: boolean;
  updated_by: string;
  updated_at: string;
}

export interface GlobalSettings {
  id: string;
  setting_key: string;
  setting_value: Record<string, unknown>;
  updated_by: string;
  updated_at: string;
}

export interface MetricsDashboard {
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

// ─── DTOs ─────────────────────────────────────────────────────────────────────
export interface CreateHiringProcessDTO {
  name: string;
  job_title: string;
  area: string;
  seniority: string;
  budget_max_usd: number;
  match_weights_override?: Record<string, number>;
}

export interface CreateQuestionSetDTO {
  name: string;
  description?: string;
  questions: Omit<ProfilingQuestion, 'id' | 'question_set_id'>[];
}
