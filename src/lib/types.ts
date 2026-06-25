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
  role: Role;
}

export type ProcessStatus =
  | 'DRAFT'
  | 'READY_FOR_MATCH'
  | 'CVS_UPLOADED'
  | 'MATCHING'
  | 'PROFILING_CONFIGURED'
  | 'COMPLETED';

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
}

export interface JobDescription {
  id: string;
  process_id: string;
  version: number;
  jd_raw_text: string;
  structured_jd: StructuredJD;
  created_at: string;
}

export interface StructuredJD {
  must_have: string[];
  nice_to_have: string[];
  deal_breakers: string[];
  weights: Record<string, number>;
  summary?: string;
}

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

export interface ProcessCandidate {
  id: string;
  process_id: string;
  candidate_id: string;
  status: CandidateStatus;
  match_percentage: number;
  match_category?: MatchCategory;
  match_explanation?: MatchExplanation;
  human_notes?: string;
  created_at: string;
  updated_at: string;
  candidate: Candidate;
}

export interface MatchExplanation {
  strengths: string[];
  gaps: string[];
  summary: string;
  risk_flags?: string[];
}

export interface KanbanResponse {
  HIGH: ProcessCandidate[];
  MEDIUM: ProcessCandidate[];
  LOW: ProcessCandidate[];
  LOADED: ProcessCandidate[];
  PARSING: ProcessCandidate[];
}

export interface QuestionSet {
  id: string;
  name: string;
  description?: string;
  version: number;
  status: 'ACTIVE' | 'ARCHIVED';
  created_by: string;
  created_at: string;
  updated_at: string;
  questions?: ProfilingQuestion[];
}

export interface ProfilingQuestion {
  id: string;
  question_set_id: string;
  order_index: number;
  text: string;
  type: 'OPEN' | 'CLOSED' | 'SCALE';
  desired_answer?: string;
  positive_keywords: string[];
  risk_keywords: string[];
  weight: number;
  is_critical: boolean;
  eval_criteria?: string;
}

export type ProfilingStatus =
  | 'PENDING'
  | 'CALLING'
  | 'COMPLETED'
  | 'FAILED'
  | 'NO_ANSWER';

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
  daily_costs: Array<{
    date: string;
    cost: number;
  }>;
}

export interface CreateHiringProcessDTO {
  name: string;
  job_title: string;
  area: string;
  seniority: string;
  budget_max_usd: number;
}

export interface CreateQuestionSetDTO {
  name: string;
  description?: string;
  questions: Omit<ProfilingQuestion, 'id' | 'question_set_id'>[];
}
