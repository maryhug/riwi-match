import axios from 'axios';
import type {
  AuthResponse,
  HiringProcess,
  ProcessesListResponse,
  ProcessDetail,
  JobDescriptionSaved,
  CandidateListResponse,
  DualKanbanResponse,
  DualMatchCandidate,
  CreateHiringProcessDTO,
  QuestionSet,
  CreateQuestionSetDTO,
  ProfilingQuestion,
  WhatsAppConsentStatus,
  ProfilingRun,
  ProfilingStatus,
  ProfilingRunsResponse,
  BackendProfilingRunItem,
  ProfilingTriggerResponse,
  StructuredJD,
  AIModelConfig,
  AIPrompt,
  GlobalSettings,
  MetricsDashboard,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Adapters ──────────────────────────────────────────────────────────────────

/**
 * El backend devuelve lista plana de candidatos ordenada por rank.
 * El front espera { HIGH: [], MEDIUM: [], LOW: [], LOADED: [], PARSING: [] }.
 */
function adaptCandidatesToKanban(candidates: CandidateListResponse['candidates']): DualKanbanResponse {
  const result: DualKanbanResponse = { HIGH: [], MEDIUM: [], LOW: [], LOADED: [], PARSING: [] };

  for (const c of candidates) {
    const dual: DualMatchCandidate = {
      id: c.process_candidate_id,
      process_id: '',
      candidate_id: c.candidate_id,
      status: c.status as DualMatchCandidate['status'],
      match_percentage: c.match_percentage ?? 0,
      match_category: (c.match_category as 'HIGH' | 'MEDIUM' | 'LOW') ?? null,
      match_explanation: c.match_summary != null || (c.strengths && c.strengths.length > 0)
        ? { summary: c.match_summary ?? '', strengths: c.strengths ?? [], gaps: c.gaps ?? [] }
        : undefined,
      cv_match_percentage: c.match_percentage ?? 0,
      cv_match_category: (c.match_category as 'HIGH' | 'MEDIUM' | 'LOW') ?? 'LOW',
      cv_match_explanation: {
        summary: c.match_summary ?? '',
        strengths: c.strengths ?? [],
        gaps: c.gaps ?? [],
      },
      human_notes: undefined,
      created_at: '',
      updated_at: '',
      whatsapp_consent: (c.whatsapp_consent as WhatsAppConsentStatus | null) ?? null,
      candidate: {
        id: c.candidate_id,
        name: c.name.split(' ').slice(0, -1).join(' ') || c.name,
        last_name: c.name.split(' ').slice(-1)[0] ?? '',
        email: c.email,
        phone: c.phone ?? '',
        cv_file_url: c.normalized_cv_url ?? '',
        created_at: '',
        updated_at: '',
      },
    };

    if (c.status === 'MATCHED' && c.match_category) {
      const cat = c.match_category as 'HIGH' | 'MEDIUM' | 'LOW';
      if (cat === 'HIGH' || cat === 'MEDIUM' || cat === 'LOW') {
        result[cat].push(dual);
      } else {
        result.LOW.push(dual);
      }
    } else if (c.status === 'CV_PROCESSING' || c.status === 'MATCH_PROCESSING') {
      result.PARSING.push(dual);
    } else {
      result.LOADED.push(dual);
    }
  }

  return result;
}

function adaptProcess(p: ProcessesListResponse['processes'][number]): HiringProcess {
  return {
    id: p.process_id,
    name: p.name,
    job_title: p.job_title,
    area: p.area,
    seniority: p.seniority,
    status: adaptStatus(p.status),
    budget_max_usd: p.budget_max_usd ?? 0,
    recruiter_id: '',
    created_at: p.created_at,
    updated_at: p.created_at,
  };
}

function adaptProcessDetail(p: ProcessDetail): HiringProcess {
  return {
    id: p.process_id,
    name: p.name,
    job_title: p.job_title,
    area: p.area,
    seniority: p.seniority,
    status: adaptStatus(p.status),
    budget_max_usd: p.budget_max_usd ?? 0,
    recruiter_id: '',
    question_set_id: p.question_set_id ?? null,
    voice_override_system_prompt: p.voice_override_system_prompt ?? null,
    voice_override_first_message: p.voice_override_first_message ?? null,
    created_at: p.created_at,
    updated_at: p.updated_at,
    job_description_data: p.job_description
      ? {
          jd_id:             p.job_description.jd_id,
          version:           p.job_description.version,
          text_preview:      p.job_description.text_preview,
          jd_raw_text:       p.job_description.jd_raw_text ?? '',
          jd_file_url:       p.job_description.jd_file_url ?? null,
          original_filename: p.job_description.original_filename ?? null,
          created_at:        p.job_description.created_at,
        }
      : null,
  };
}

/**
 * Mapea statuses del backend a los del front.
 * Backend: DRAFT | CVS_UPLOADED | MATCH_PROCESSING | MATCH_DONE | PROFILING_* | CLOSED | ARCHIVED
 * Front:   DRAFT | READY_FOR_MATCH | CVS_UPLOADED | MATCHING | PROFILING_CONFIGURED | COMPLETED
 */
function adaptStatus(s: string): HiringProcess['status'] {
  const map: Record<string, HiringProcess['status']> = {
    DRAFT:                'DRAFT',
    CVS_UPLOADED:         'CVS_UPLOADED',
    MATCH_PROCESSING:     'MATCHING',
    MATCH_DONE:           'PROFILING_CONFIGURED',
    PROFILING_CONFIGURED: 'PROFILING_CONFIGURED',
    PROFILING_ACTIVE:     'PROFILING_CONFIGURED',
    PROFILING_COMPLETED:  'COMPLETED',
    CLOSED:               'COMPLETED',
    ARCHIVED:             'COMPLETED',
  };
  return map[s] ?? 'DRAFT';
}

/**
 * Mapea ProfilingRunStatus del backend (10 valores) al ProfilingStatus del front
 * (5 valores). Los estados "en progreso" del backend (ANSWERED, RETRY_PENDING)
 * caen en CALLING; QUEUED cae en PENDING; CANCELLED cae en FAILED.
 */
function adaptProfilingStatus(s: string): ProfilingStatus {
  const map: Record<string, ProfilingStatus> = {
    PENDING: 'PENDING',
    QUEUED: 'PENDING',
    CALLING: 'CALLING',
    ANSWERED: 'CALLING',
    RETRY_PENDING: 'CALLING',
    NO_ANSWER: 'NO_ANSWER',
    VOICEMAIL_DETECTED: 'NO_ANSWER',
    FAILED: 'FAILED',
    CANCELLED: 'FAILED',
    COMPLETED: 'COMPLETED',
  };
  return map[s] ?? 'PENDING';
}

function adaptProfilingRun(r: BackendProfilingRunItem, processId = ''): ProfilingRun {
  const nameParts = r.candidate_name.trim().split(' ');
  return {
    id: r.id,
    process_id: processId,
    candidate_id: r.candidate_id,
    question_set_id: r.question_set_id,
    status: adaptProfilingStatus(r.status),
    call_attempts: r.call_attempts,
    advancement_prob: r.advancement_probability ?? undefined,
    transcription_url: r.transcription_url ?? undefined,
    profiling_eval: r.advancement_explanation || r.transcript_summary
      ? { explanation: r.advancement_explanation, summary: r.transcript_summary }
      : undefined,
    created_at: r.created_at,
    updated_at: r.updated_at,
    candidate: {
      id: r.candidate_id,
      name: nameParts.slice(0, -1).join(' ') || r.candidate_name,
      last_name: nameParts.slice(-1)[0] ?? '',
      email: '',
      phone: '',
      cv_file_url: '',
      created_at: '',
      updated_at: '',
    },
  };
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/api/v1/auth/login', { email, password }),
};

// ─── Processes ─────────────────────────────────────────────────────────────────

export const processesApi = {
  list: () =>
    api.get<ProcessesListResponse>('/api/v1/processes').then((r) => ({
      data: r.data.processes.map(adaptProcess),
    })),

  create: (data: CreateHiringProcessDTO) =>
    api.post<{ process_id: string }>('/api/v1/processes', data),

  get: (id: string) =>
    api.get<ProcessDetail>(`/api/v1/processes/${id}`).then((r) => ({
      data: adaptProcessDetail(r.data),
    })),

  getJD: (id: string) =>
    api.get<ProcessDetail>(`/api/v1/processes/${id}`).then((r) => {
      const jd = r.data.job_description;
      if (!jd) return { data: null };
      return {
        data: {
          id: jd.jd_id,
          process_id: id,
          version: jd.version,
          jd_raw_text: jd.jd_raw_text ?? jd.text_preview,
          jd_file_url: jd.jd_file_url ?? null,
          original_filename: jd.original_filename ?? null,
          structured_jd: {
            must_have: [],
            nice_to_have: [],
            deal_breakers: [],
            weights: {},
            summary: jd.text_preview,
          },
          created_at: jd.created_at,
        },
      };
    }),

  /** Analiza la JD con IA (no persiste nada — la persistencia sigue pasando por saveJD). */
  parseJD: (id: string, rawText: string) =>
    api
      .post<Omit<StructuredJD, 'weights' | 'raw_text'>>(
        `/api/v1/processes/${id}/job-description/parse`,
        { jd_raw_text: rawText }
      )
      .then((r) => ({
        data: {
          structured_jd: {
            must_have: r.data.must_have,
            nice_to_have: r.data.nice_to_have,
            deal_breakers: r.data.deal_breakers,
            weights: {} as Record<string, number>,
            summary: r.data.summary,
          },
        },
      })),

  /** Asocia un QuestionSet al proceso — precondición RB-003 para habilitar profiling. */
  updateQuestionSet: (id: string, questionSetId: string) =>
    api.patch<{ process_id: string; question_set_id: string }>(
      `/api/v1/processes/${id}/question-set`,
      { question_set_id: questionSetId }
    ),

  saveJD: (id: string, rawText: string) =>
    api.post<JobDescriptionSaved>(`/api/v1/processes/${id}/job-description`, {
      jd_raw_text: rawText,
    }),

  uploadJDFile: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{
      jd_id: string;
      version: number;
      jd_file_url: string;
      original_filename: string;
      text_length: number;
    }>(`/api/v1/processes/${id}/job-description/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getJDFileUrl: (id: string) =>
    `${BASE_URL}/api/v1/processes/${id}/job-description/file`,

  uploadCandidates: (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return api
      .post<{ uploaded: number }>(`/api/v1/processes/${id}/candidates/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => ({ data: { queued: r.data.uploaded } }));
  },

  startMatch: (id: string) =>
    api.post<{ queued: number }>(`/api/v1/processes/${id}/match`).then((r) => ({
      data: { status: `${r.data.queued} candidatos encolados` },
    })),

  getMatchStatus: (id: string) =>
    api.get<{
      process_status: string;
      total_candidates: number;
      matched: number;
      match_pending: number;
      progress_pct: number;
      is_complete: boolean;
    }>(`/api/v1/processes/${id}/match/status`),

  /** Kanban: transforma lista plana al formato { HIGH, MEDIUM, LOW, LOADED, PARSING } */
  getKanban: (id: string) =>
    api.get<CandidateListResponse>(`/api/v1/processes/${id}/candidates`).then((r) => ({
      data: adaptCandidatesToKanban(r.data.candidates),
    })),

  /** Lista plana para la vista de ranking con rank explícito */
  getCandidatesList: (id: string) =>
    api.get<CandidateListResponse>(`/api/v1/processes/${id}/candidates`),

  getCandidateDetail: (processId: string, pcId: string) =>
    api.get(`/api/v1/processes/${processId}/candidates/${pcId}`),

  getCvFileUrl: (processId: string, pcId: string) =>
    `${BASE_URL}/api/v1/processes/${processId}/candidates/${pcId}/cv/file`,

  getNormalizedCvFileUrl: (processId: string, pcId: string) =>
    `${BASE_URL}/api/v1/processes/${processId}/candidates/${pcId}/cv-normalized/file`,

  /** Dispara o reenvía manualmente la plantilla de consentimiento de WhatsApp */
  sendWhatsApp: (processId: string, pcId: string) =>
    api.post<{ process_candidate_id: string; task_id: string; status: string }>(
      `/api/v1/processes/${processId}/candidates/${pcId}/whatsapp/send`,
    ),

  /**
   * Override por proceso del prompt/saludo del agente de voz. Tiene prioridad
   * sobre los default_* del QuestionSet asociado cuando un campo no es null.
   */
  updateVoiceConfig: (
    id: string,
    data: { voice_override_system_prompt?: string | null; voice_override_first_message?: string | null }
  ) =>
    api.patch<{
      voice_override_system_prompt: string | null;
      voice_override_first_message: string | null;
    }>(`/api/v1/processes/${id}/voice-config`, data),

  /**
   * Dispara profiling manual (RB-004) para los `process_candidate_id`s seleccionados.
   * Requiere que el proceso tenga un QuestionSet asociado (RB-003, ver updateQuestionSet).
   */
  startProfiling: (id: string, processCandidateIds: string[]) =>
    api.post<ProfilingTriggerResponse>(`/api/v1/processes/${id}/profiling/trigger`, {
      process_candidate_ids: processCandidateIds,
    }),

  getProfilingRuns: (id: string) =>
    api.get<ProfilingRunsResponse>(`/api/v1/processes/${id}/profiling/runs`).then((r) => ({
      data: r.data.profiling_runs.map((run) => adaptProfilingRun(run, id)),
    })),

  /** Listado global de ProfilingRun (todos los procesos visibles para el usuario) — página /profiling */
  getGlobalProfilingRuns: () =>
    api.get<ProfilingRunsResponse>('/api/v1/profiling/runs').then((r) => ({
      data: r.data.profiling_runs.map((run) => adaptProfilingRun(run)),
    })),
};

// ─── Candidates ────────────────────────────────────────────────────────────────

export const candidatesApi = {
  /**
   * El backend requiere que `human_override_match` viaje explícito (incluso `null`)
   * para limpiar el override existente; omitirlo no lo toca. Por eso ambos campos
   * son siempre parte del body, nunca opcionales aquí.
   */
  updateOverride: (
    processId: string,
    pcId: string,
    body: { human_notes: string | null; human_override_match: number | null }
  ) =>
    api.patch<{ status: string }>(
      `/api/v1/processes/${processId}/candidates/${pcId}/override`,
      body
    ),
};

// ─── Question Sets ─────────────────────────────────────────────────────────────

export const questionSetsApi = {
  list: () =>
    api.get<{ total: number; question_sets: QuestionSet[] }>('/api/v1/question-sets').then((r) => ({
      data: r.data.question_sets,
    })),

  get: (id: string) =>
    api.get<QuestionSet>(`/api/v1/question-sets/${id}`),

  create: (data: CreateQuestionSetDTO): Promise<{ data: QuestionSet }> =>
    api.post<QuestionSet>('/api/v1/question-sets', data),

  update: (id: string, data: { name?: string; description?: string; status?: string }) =>
    api.patch<QuestionSet>(`/api/v1/question-sets/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/v1/question-sets/${id}`),

  addQuestion: (setId: string, q: Omit<ProfilingQuestion, 'id' | 'question_set_id'>) =>
    api.post<ProfilingQuestion>(`/api/v1/question-sets/${setId}/questions`, q),

  updateQuestion: (setId: string, qId: string, q: Partial<Omit<ProfilingQuestion, 'id' | 'question_set_id'>>) =>
    api.patch<ProfilingQuestion>(`/api/v1/question-sets/${setId}/questions/${qId}`, q),

  deleteQuestion: (setId: string, qId: string) =>
    api.delete(`/api/v1/question-sets/${setId}/questions/${qId}`),
};

// ─── Settings / Metrics ────────────────────────────────────────────────────────

export const settingsApi = {
  getModels: () =>
    api.get<{ models: AIModelConfig[] }>('/api/v1/ai-config/models').then((r) => ({
      data: r.data.models,
    })),

  createModel: (data: { task_type: string; provider: string; model_name: string }) =>
    api.post<AIModelConfig>('/api/v1/ai-config/models', data),

  setActiveModel: (modelId: string) =>
    api.patch<AIModelConfig>(`/api/v1/ai-config/models/${modelId}/activate`),

  getPrompts: () =>
    api.get<{ prompts: AIPrompt[] }>('/api/v1/ai-config/prompts').then((r) => ({
      data: r.data.prompts,
    })),

  /** Append-only: siempre crea una versión nueva, nunca edita una existente. */
  updatePrompt: (data: { task_type: string; version_name: string; system_prompt_text: string; activate?: boolean }) =>
    api.post<AIPrompt>('/api/v1/ai-config/prompts', data),

  getGlobalSettings: () =>
    api.get<{ settings: GlobalSettings[] }>('/api/v1/ai-config/global-settings').then((r) => ({
      data: r.data.settings,
    })),

  updateThresholds: (thresholds: { high: number; medium: number; low: number }) =>
    api.patch<GlobalSettings>('/api/v1/ai-config/global-settings/match_thresholds', {
      setting_value: thresholds,
    }),
};

export const metricsApi = {
  getDashboard: () => api.get<MetricsDashboard>('/api/v1/metrics/dashboard'),
};

export default api;
