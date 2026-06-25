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

  /**
   * El backend NO tiene endpoint de parseo IA de JD.
   * Guardamos directamente el texto raw — cada POST crea una nueva versión.
   */
  parseJD: (_id: string, rawText: string) =>
    Promise.resolve({
      data: {
        structured_jd: {
          must_have: [] as string[],
          nice_to_have: [] as string[],
          deal_breakers: [] as string[],
          weights: {} as Record<string, number>,
          summary: rawText.slice(0, 300),
        },
      },
    }),

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

  /** Profiling aún no disponible en el back */
  startProfiling: (_id: string, _candidateIds: string[]) =>
    Promise.resolve({ data: { status: 'not_available' } }),

  getProfilingRuns: (_id: string) =>
    Promise.resolve({ data: [] as import('./types').ProfilingRun[] }),
};

// ─── Candidates ────────────────────────────────────────────────────────────────

export const candidatesApi = {
  updateNotes: (_pcId: string, _notes: string) =>
    Promise.resolve({ data: {} }),
  updateStatus: (_pcId: string, _status: string) =>
    Promise.resolve({ data: {} }),
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
  getModels: () => Promise.resolve({ data: [] }),
  setActiveModel: () => Promise.resolve({ data: {} }),
  getPrompts: () => Promise.resolve({ data: [] }),
  updatePrompt: () => Promise.resolve({ data: {} }),
  getGlobalSettings: () => Promise.resolve({ data: [] }),
  updateThresholds: () => Promise.resolve({ data: {} }),
};

export const metricsApi = {
  getDashboard: () =>
    Promise.resolve({
      data: {
        total_cost_usd: 0,
        cost_by_process:  [] as import('./types').MetricsDashboard['cost_by_process'],
        cost_by_user:     [] as import('./types').MetricsDashboard['cost_by_user'],
        cost_by_operation:[] as import('./types').MetricsDashboard['cost_by_operation'],
        daily_costs:      [] as import('./types').MetricsDashboard['daily_costs'],
      },
    }),
};

export default api;
