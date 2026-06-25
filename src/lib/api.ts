import axios from 'axios';
import type {
  AuthResponse,
  HiringProcess,
  JobDescription,
  StructuredJD,
  ProcessCandidate,
  KanbanResponse,
  QuestionSet,
  ProfilingRun,
  AIModelConfig,
  AIPrompt,
  GlobalSettings,
  MetricsDashboard,
  CreateHiringProcessDTO,
  CreateQuestionSetDTO,
  ProfilingQuestion,
} from './types';
import {
  MOCK_PROCESSES,
  MOCK_KANBAN,
  MOCK_PROFILING_RUNS,
  MOCK_QUESTION_SETS,
  MOCK_METRICS,
  MOCK_AI_MODELS,
  MOCK_AI_PROMPTS,
  MOCK_JDS,
} from './mockData';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

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

function mock<T>(data: T): Promise<{ data: T }> {
  return Promise.resolve({ data });
}

function withFallback<T>(fn: () => Promise<{ data: T }>, fallback: T): Promise<{ data: T }> {
  if (USE_MOCK) return mock(fallback);
  return fn().catch(() => mock(fallback));
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/api/v1/auth/login', { email, password }),
};

// Hiring Processes
export const processesApi = {
  list: () =>
    withFallback(
      () => api.get<HiringProcess[]>('/api/v1/hiring-processes'),
      MOCK_PROCESSES
    ),

  create: (data: CreateHiringProcessDTO) =>
    api.post<{ process_id: string }>('/api/v1/hiring-processes', data),

  get: (id: string) =>
    withFallback(
      () => api.get<HiringProcess>(`/api/v1/hiring-processes/${id}`),
      MOCK_PROCESSES.find((p) => p.id === id) ?? MOCK_PROCESSES[0]
    ),

  parseJD: (id: string, rawText: string) =>
    api.post<{ structured_jd: StructuredJD }>(`/api/v1/hiring-processes/${id}/job-description/parse`, {
      raw_text: rawText,
    }),

  saveJD: (id: string, structuredJD: StructuredJD) =>
    api.put<JobDescription>(`/api/v1/hiring-processes/${id}/job-description`, structuredJD),

  getJD: (id: string) =>
    withFallback(
      () => api.get<JobDescription>(`/api/v1/hiring-processes/${id}/job-description`),
      MOCK_JDS[id] ?? MOCK_JDS['proc-001']
    ),

  uploadCandidates: (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return api.post<{ queued: number }>(`/api/v1/hiring-processes/${id}/candidates/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  startMatch: (id: string) =>
    api.post<{ status: string }>(`/api/v1/hiring-processes/${id}/match`),

  getKanban: (id: string) =>
    withFallback(
      () => api.get<KanbanResponse>(`/api/v1/hiring-processes/${id}/kanban`),
      (MOCK_KANBAN[id] ?? MOCK_KANBAN['proc-001']) as KanbanResponse
    ),

  startProfiling: (id: string, candidateIds: string[]) =>
    api.post<{ status: string }>(`/api/v1/hiring-processes/${id}/profiling/start`, {
      candidate_ids: candidateIds,
    }),

  getProfilingRuns: (id: string) =>
    withFallback(
      () => api.get<ProfilingRun[]>(`/api/v1/hiring-processes/${id}/profiling/runs`),
      MOCK_PROFILING_RUNS[id] ?? []
    ),
};

export const candidatesApi = {
  updateNotes: (processCandidateId: string, notes: string) =>
    api.patch<ProcessCandidate>(`/api/v1/process-candidates/${processCandidateId}/notes`, {
      human_notes: notes,
    }),
  updateStatus: (processCandidateId: string, status: string) =>
    api.patch<ProcessCandidate>(`/api/v1/process-candidates/${processCandidateId}/status`, {
      status,
    }),
};

// Question Sets
export const questionSetsApi = {
  list: () =>
    withFallback(
      () => api.get<QuestionSet[]>('/api/v1/question-sets'),
      MOCK_QUESTION_SETS
    ),

  get: (id: string) =>
    withFallback(
      () => api.get<QuestionSet>(`/api/v1/question-sets/${id}`),
      MOCK_QUESTION_SETS.find((q) => q.id === id) ?? MOCK_QUESTION_SETS[0]
    ),

  create: (data: CreateQuestionSetDTO) =>
    api.post<QuestionSet>('/api/v1/question-sets', data),

  update: (id: string, data: Partial<CreateQuestionSetDTO>) =>
    api.put<QuestionSet>(`/api/v1/question-sets/${id}`, data),

  addQuestion: (setId: string, q: Omit<ProfilingQuestion, 'id' | 'question_set_id'>) =>
    api.post<ProfilingQuestion>(`/api/v1/question-sets/${setId}/questions`, q),

  deleteQuestion: (setId: string, qId: string) =>
    api.delete(`/api/v1/question-sets/${setId}/questions/${qId}`),
};

// Settings (Admin)
export const settingsApi = {
  getModels: () =>
    withFallback(
      () => api.get<AIModelConfig[]>('/api/v1/settings/models'),
      MOCK_AI_MODELS
    ),

  setActiveModel: (taskType: string, modelId: string) =>
    api.put(`/api/v1/settings/models/${taskType}/active`, { model_id: modelId }),

  getPrompts: () =>
    withFallback(
      () => api.get<AIPrompt[]>('/api/v1/settings/prompts'),
      MOCK_AI_PROMPTS
    ),

  updatePrompt: (id: string, text: string) =>
    api.put(`/api/v1/settings/prompts/${id}`, { system_prompt_text: text }),

  getGlobalSettings: () =>
    withFallback(
      () => api.get<GlobalSettings[]>('/api/v1/settings/global'),
      []
    ),

  updateThresholds: (thresholds: { high: number; medium: number; low: number }) =>
    api.put('/api/v1/settings/global-thresholds', thresholds),
};

// Metrics
export const metricsApi = {
  getDashboard: (params?: { from?: string; to?: string }) =>
    withFallback(
      () => api.get<MetricsDashboard>('/api/v1/metrics/dashboard', { params }),
      MOCK_METRICS
    ),
};

export default api;
