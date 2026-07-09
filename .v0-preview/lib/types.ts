// Tipos reales del sistema RIWI MATCH — no agregar campos que no estén aquí.

export type Role = 'ADMIN' | 'RECRUITER' | 'TA_LEADER'

export interface LoginFormValues {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token?: string
  role: Role
}

export type ProcessStatus =
  | 'DRAFT'
  | 'READY_FOR_MATCH'
  | 'CVS_UPLOADED'
  | 'MATCHING'
  | 'PROFILING_CONFIGURED'
  | 'COMPLETED'

export interface HiringProcess {
  id: string
  name: string
  job_title: string
  area: string
  seniority: string
  status: ProcessStatus
  budget_max_usd: number
  created_at: string
  updated_at: string
  job_description_data?: {
    jd_id: string
    version: number
    text_preview: string
    jd_raw_text: string
    jd_file_url: string | null
    original_filename: string | null
    created_at: string
  } | null
}

export interface CreateHiringProcessDTO {
  name: string
  job_title: string
  area: string
  seniority: string
  budget_max_usd: number
  match_weights_override?: Record<string, number>
}

export type MatchCategory = 'HIGH' | 'MEDIUM' | 'LOW'

export interface Candidate {
  id: string
  name: string
  last_name: string
  email: string
  phone: string
  cv_file_url: string
  created_at: string
  updated_at: string
}

export interface DualMatchCandidate {
  id: string
  process_id: string
  candidate_id: string
  status: string
  match_percentage: number
  match_category?: MatchCategory | null
  cv_match_percentage: number
  cv_match_category: MatchCategory
  human_notes?: string
  candidate: Candidate
}

export interface DualKanbanResponse {
  HIGH: DualMatchCandidate[]
  MEDIUM: DualMatchCandidate[]
  LOW: DualMatchCandidate[]
  LOADED: DualMatchCandidate[]
  PARSING: DualMatchCandidate[]
}

export interface BreakdownItem {
  raw_score?: number
  weighted_score?: number
  weight: number
}

export interface MatchBreakdown {
  technical_skills?: BreakdownItem
  relevant_experience?: BreakdownItem
  seniority?: BreakdownItem
  industry_domain?: BreakdownItem
  languages?: BreakdownItem
  education_certifications?: BreakdownItem
}

export interface CandidateListItem {
  rank: number
  process_candidate_id: string
  candidate_id: string
  name: string
  email: string
  phone: string | null
  status: string
  match_percentage: number
  match_category: string | null
  normalized_cv_url: string | null
  city?: string | null
  match_summary?: string
  strengths?: string[]
  gaps?: string[]
  breakdown?: MatchBreakdown
}

export interface MetricsDashboard {
  total_cost_usd: number
  cost_by_process: Array<{
    process_id: string
    process_name: string
    total_cost: number
    candidate_count: number
  }>
  cost_by_user: Array<{ user_id: string; user_name: string; total_cost: number }>
  cost_by_operation: Array<{ operation_type: string; total_cost: number; count: number }>
  daily_costs: Array<{ date: string; cost: number }>
}

export type ProfilingStatus = 'PENDING' | 'CALLING' | 'COMPLETED' | 'FAILED' | 'NO_ANSWER'

export interface BackendProfilingRunItem {
  id: string
  candidate_name: string
  status: string
  call_attempts: number
  advancement_probability: 'HIGH' | 'MEDIUM' | 'LOW' | null
  started_at: string | null
  completed_at: string | null
  // Campos que sí devuelve el backend real pero el mock original no incluía —
  // agregados como opcionales para no romper el mock, necesarios para la conexión real.
  process_candidate_id?: string
  candidate_id?: string
  question_set_id?: string
  advancement_explanation?: string | null
  transcript_summary?: string | null
  transcription_url?: string | null
  created_at?: string
  updated_at?: string
}

export type QuestionSetStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

export interface QuestionSet {
  id: string
  name: string
  description?: string
  version: number
  status: QuestionSetStatus
  created_at: string
  updated_at: string
  // El GET de detalle del backend real trae las preguntas embebidas — opcional para no
  // romper el listado (que no las trae) ni el mock original.
  questions?: ProfilingQuestion[]
}

export type QuestionType = 'OPEN' | 'CLOSED' | 'MULTIPLE_CHOICE' | 'YES_NO' | 'NUMERIC' | 'SCALE'

export interface ProfilingQuestion {
  // Ausentes al crear una pregunta nueva en el builder; presentes una vez que el backend
  // real las devuelve (necesarios para poder editar/borrar una pregunta puntual).
  id?: string
  question_set_id?: string
  order_index: number
  text: string
  type: QuestionType
  expected_answer?: string
  positive_keywords: string[]
  risk_keywords: string[]
  weight: number
  is_critical: boolean
  eval_criteria?: string
}

export interface CreateQuestionSetDTO {
  name: string
  description?: string
  questions: ProfilingQuestion[]
}

export interface User {
  id: string
  name: string
  last_name: string
  email: string
  role: Role
  status: 'ACTIVE' | 'SUSPENDED'
}

export interface AIModelConfig {
  id: string
  task_type: string
  provider: 'OPENAI' | 'ANTHROPIC' | 'ELEVENLABS'
  model_name: string
  is_active: boolean
}

export interface AIPrompt {
  id: string
  task_type: string
  version_name: string
  system_prompt_text: string
  is_active: boolean
}

export interface GlobalSettings {
  id: string
  setting_key: string
  setting_value: Record<string, unknown>
  updated_by: string
  updated_at: string
}
