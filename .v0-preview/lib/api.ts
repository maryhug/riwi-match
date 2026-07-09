import axios from 'axios'
import { API_BASE_URL, USE_MOCK, mockDelay } from './config'
import {
  hiringProcesses,
  dualKanban,
  rankingCandidates,
  metricsDashboard,
  profilingRuns,
  questionSets,
  questionSetQuestions,
  users,
  aiModelConfigs,
  aiPrompts,
  getProcessById,
  getQuestionSetById,
} from './data'
import type {
  AuthResponse,
  HiringProcess,
  CreateHiringProcessDTO,
  DualKanbanResponse,
  DualMatchCandidate,
  CandidateListItem,
  MatchBreakdown,
  QuestionSet,
  CreateQuestionSetDTO,
  ProfilingQuestion,
  BackendProfilingRunItem,
  MetricsDashboard,
  AIModelConfig,
  AIPrompt,
  GlobalSettings,
  User,
  MatchCategory,
  ProfilingStatus,
} from './types'

/** Misma key que usa lib/auth.ts — desacoplado a propósito (igual que en Frontend/src/lib/api.ts,
 *  que lee localStorage directo en vez de importar el AuthContext, para evitar ciclo de imports). */
const SESSION_KEY = 'riwi_session'

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { token?: string }
    return parsed.token ?? null
  } catch {
    return null
  }
}

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

/** URL de archivo con el token pegado como query param (el backend lo acepta ahí porque
 *  <a>/<iframe> no pueden mandar el header Authorization). */
export function withToken(url: string): string {
  const token = getStoredToken()
  return token ? `${url}?token=${token}` : url
}

// ─── Adapters (portados de Frontend/src/lib/api.ts, adaptados a los tipos de .v0-preview) ──────

function adaptStatus(s: string): HiringProcess['status'] {
  const map: Record<string, HiringProcess['status']> = {
    DRAFT: 'DRAFT',
    CVS_UPLOADED: 'CVS_UPLOADED',
    MATCH_PROCESSING: 'MATCHING',
    MATCH_DONE: 'PROFILING_CONFIGURED',
    PROFILING_CONFIGURED: 'PROFILING_CONFIGURED',
    PROFILING_ACTIVE: 'PROFILING_CONFIGURED',
    PROFILING_COMPLETED: 'COMPLETED',
    CLOSED: 'COMPLETED',
    ARCHIVED: 'COMPLETED',
  }
  return map[s] ?? 'DRAFT'
}

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
  }
  return map[s] ?? 'PENDING'
}

interface BackendProcessListItem {
  process_id: string
  name: string
  job_title: string
  area: string
  seniority: string
  status: string
  budget_max_usd: number
  created_at: string
}

function adaptProcess(p: BackendProcessListItem): HiringProcess {
  return {
    id: p.process_id,
    name: p.name,
    job_title: p.job_title,
    area: p.area,
    seniority: p.seniority,
    status: adaptStatus(p.status),
    budget_max_usd: p.budget_max_usd ?? 0,
    created_at: p.created_at,
    updated_at: p.created_at,
  }
}

interface BackendProcessDetail extends BackendProcessListItem {
  updated_at: string
  job_description: {
    jd_id: string
    version: number
    text_preview: string
    jd_raw_text: string | null
    jd_file_url: string | null
    original_filename: string | null
    created_at: string
  } | null
}

function adaptProcessDetail(p: BackendProcessDetail): HiringProcess {
  return {
    id: p.process_id,
    name: p.name,
    job_title: p.job_title,
    area: p.area,
    seniority: p.seniority,
    status: adaptStatus(p.status),
    budget_max_usd: p.budget_max_usd ?? 0,
    created_at: p.created_at,
    updated_at: p.updated_at,
    job_description_data: p.job_description
      ? {
          jd_id: p.job_description.jd_id,
          version: p.job_description.version,
          text_preview: p.job_description.text_preview,
          jd_raw_text: p.job_description.jd_raw_text ?? '',
          jd_file_url: p.job_description.jd_file_url ?? null,
          original_filename: p.job_description.original_filename ?? null,
          created_at: p.job_description.created_at,
        }
      : null,
  }
}

interface BackendCandidateListItem {
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

function adaptCandidatesToKanban(candidates: BackendCandidateListItem[]): DualKanbanResponse {
  const result: DualKanbanResponse = { HIGH: [], MEDIUM: [], LOW: [], LOADED: [], PARSING: [] }

  for (const c of candidates) {
    const cat = (c.match_category as MatchCategory | null) ?? null
    const dual: DualMatchCandidate = {
      id: c.process_candidate_id,
      process_id: '',
      candidate_id: c.candidate_id,
      status: c.status,
      match_percentage: c.match_percentage ?? 0,
      match_category: cat,
      cv_match_percentage: c.match_percentage ?? 0,
      cv_match_category: cat ?? 'LOW',
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
    }

    if (c.status === 'MATCHED' && cat) {
      result[cat].push(dual)
    } else if (c.status === 'CV_PROCESSING' || c.status === 'MATCH_PROCESSING') {
      result.PARSING.push(dual)
    } else {
      result.LOADED.push(dual)
    }
  }

  return result
}

interface BackendProfilingRunRaw {
  id: string
  process_candidate_id: string
  candidate_id: string
  candidate_name: string
  question_set_id: string
  status: string
  call_attempts: number
  advancement_probability: 'HIGH' | 'MEDIUM' | 'LOW' | null
  advancement_explanation: string | null
  transcription_url: string | null
  transcript_summary: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

function adaptProfilingRun(r: BackendProfilingRunRaw): BackendProfilingRunItem {
  return {
    id: r.id,
    candidate_name: r.candidate_name,
    status: adaptProfilingStatus(r.status),
    call_attempts: r.call_attempts,
    advancement_probability: r.advancement_probability,
    started_at: r.started_at,
    completed_at: r.completed_at,
    process_candidate_id: r.process_candidate_id,
    candidate_id: r.candidate_id,
    question_set_id: r.question_set_id,
    advancement_explanation: r.advancement_explanation,
    transcript_summary: r.transcript_summary,
    transcription_url: r.transcription_url,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string): Promise<{ data: AuthResponse }> => {
    if (USE_MOCK) {
      await mockDelay(500)
      if (password === 'incorrecta') {
        const err = new Error('Credenciales inválidas') as Error & { response?: { status: number; data: { detail: string } } }
        err.response = { status: 401, data: { detail: 'Credenciales inválidas' } }
        throw err
      }
      return { data: { access_token: `mock-token-${Date.now()}`, role: 'ADMIN' } }
    }
    return http.post<AuthResponse>('/api/v1/auth/login', { email, password })
  },

  logout: (refreshToken: string) => {
    if (USE_MOCK) return mockDelay()
    return http.post('/api/v1/auth/logout', { refresh_token: refreshToken })
  },
}

// ─── Processes ───────────────────────────────────────────────────────────────────

export const processesApi = {
  list: async (): Promise<{ data: HiringProcess[] }> => {
    if (USE_MOCK) {
      await mockDelay()
      return { data: hiringProcesses }
    }
    const r = await http.get<{ total: number; processes: BackendProcessListItem[] }>('/api/v1/processes')
    return { data: r.data.processes.map(adaptProcess) }
  },

  create: async (data: CreateHiringProcessDTO): Promise<{ data: { process_id: string } }> => {
    if (USE_MOCK) {
      await mockDelay(900)
      return { data: { process_id: `mock-${Date.now()}` } }
    }
    return http.post<{ process_id: string }>('/api/v1/processes', data)
  },

  get: async (id: string): Promise<{ data: HiringProcess | null }> => {
    if (USE_MOCK) {
      await mockDelay()
      return { data: getProcessById(id) ?? null }
    }
    const r = await http.get<BackendProcessDetail>(`/api/v1/processes/${id}`)
    return { data: adaptProcessDetail(r.data) }
  },

  saveJD: async (id: string, rawText: string) => {
    if (USE_MOCK) {
      await mockDelay()
      return { data: { jd_id: `mock-jd-${Date.now()}`, process_id: id, version: 1, created_at: new Date().toISOString() } }
    }
    return http.post(`/api/v1/processes/${id}/job-description`, { jd_raw_text: rawText })
  },

  uploadJDFile: async (id: string, file: File) => {
    if (USE_MOCK) {
      await mockDelay(1200)
      return { data: { jd_id: `mock-jd-${Date.now()}`, version: 1, jd_file_url: '', original_filename: file.name, text_length: 0 } }
    }
    const form = new FormData()
    form.append('file', file)
    return http.post(`/api/v1/processes/${id}/job-description/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /** En mock no hay backend real que resuelva el archivo — usa la URL ya guardada en el mock. */
  getJDFileUrl: (id: string, mockUrl?: string | null) => {
    if (USE_MOCK) return mockUrl ?? ''
    return withToken(`${API_BASE_URL}/api/v1/processes/${id}/job-description/file`)
  },

  uploadCandidates: async (id: string, files: File[]): Promise<{ data: { queued: number } }> => {
    if (USE_MOCK) {
      await mockDelay(1400)
      return { data: { queued: files.length } }
    }
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    const r = await http.post<{ uploaded: number }>(`/api/v1/processes/${id}/candidates/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return { data: { queued: r.data.uploaded } }
  },

  startMatch: async (id: string): Promise<{ data: { status: string } }> => {
    if (USE_MOCK) {
      await mockDelay(600)
      return { data: { status: 'Match iniciado (simulado)' } }
    }
    const r = await http.post<{ queued: number }>(`/api/v1/processes/${id}/match`)
    return { data: { status: `${r.data.queued} candidatos encolados` } }
  },

  getMatchStatus: (id: string) =>
    http.get<{
      process_status: string
      total_candidates: number
      matched: number
      match_pending: number
      progress_pct: number
      is_complete: boolean
    }>(`/api/v1/processes/${id}/match/status`),

  /** Kanban dual filtrado por proceso (transforma lista plana → { HIGH, MEDIUM, LOW, LOADED, PARSING }) */
  getKanban: async (id: string): Promise<{ data: DualKanbanResponse }> => {
    if (USE_MOCK) {
      await mockDelay()
      return { data: dualKanban }
    }
    const r = await http.get<{ candidates: BackendCandidateListItem[] }>(`/api/v1/processes/${id}/candidates`)
    return { data: adaptCandidatesToKanban(r.data.candidates) }
  },

  /** Ranking filtrado por proceso, con rank explícito */
  getCandidatesList: async (id: string): Promise<{ data: CandidateListItem[] }> => {
    if (USE_MOCK) {
      await mockDelay()
      return { data: rankingCandidates }
    }
    const r = await http.get<{ candidates: CandidateListItem[] }>(`/api/v1/processes/${id}/candidates`)
    return { data: r.data.candidates }
  },

  /** Dispara profiling manual (RB-004) para los process_candidate_id seleccionados. */
  startProfiling: async (id: string, processCandidateIds: string[]) => {
    if (USE_MOCK) {
      await mockDelay(500)
      return { data: { queued: processCandidateIds.length } }
    }
    return http.post(`/api/v1/processes/${id}/profiling/trigger`, { process_candidate_ids: processCandidateIds })
  },

  /** Llamadas de profiling de un proceso específico. */
  getProfilingRuns: async (id: string): Promise<{ data: BackendProfilingRunItem[] }> => {
    if (USE_MOCK) {
      await mockDelay()
      return { data: profilingRuns }
    }
    const r = await http.get<{ profiling_runs: BackendProfilingRunRaw[] }>(`/api/v1/processes/${id}/profiling/runs`)
    return { data: r.data.profiling_runs.map(adaptProfilingRun) }
  },

  /** Listado global de llamadas de profiling (todos los procesos) — página /profiling */
  getGlobalProfilingRuns: async (): Promise<{ data: BackendProfilingRunItem[] }> => {
    if (USE_MOCK) {
      await mockDelay()
      return { data: profilingRuns }
    }
    const r = await http.get<{ profiling_runs: BackendProfilingRunRaw[] }>('/api/v1/profiling/runs')
    return { data: r.data.profiling_runs.map(adaptProfilingRun) }
  },

  updateStatus: async (id: string, status: string) => {
    if (USE_MOCK) {
      await mockDelay()
      return { data: { process_id: id, status } }
    }
    return http.patch(`/api/v1/processes/${id}/status`, { status })
  },

  getCvFileUrl: (processId: string, pcId: string, mockUrl?: string | null) => {
    if (USE_MOCK) return mockUrl ?? ''
    return withToken(`${API_BASE_URL}/api/v1/processes/${processId}/candidates/${pcId}/cv/file`)
  },

  getNormalizedCvFileUrl: (processId: string, pcId: string, mockUrl?: string | null) => {
    if (USE_MOCK) return mockUrl ?? ''
    return withToken(`${API_BASE_URL}/api/v1/processes/${processId}/candidates/${pcId}/cv-normalized/file`)
  },
}

// ─── Question Sets ───────────────────────────────────────────────────────────────

export const questionSetsApi = {
  list: async (): Promise<{ data: QuestionSet[] }> => {
    if (USE_MOCK) {
      await mockDelay()
      return { data: questionSets }
    }
    const r = await http.get<{ question_sets: QuestionSet[] }>('/api/v1/question-sets')
    return { data: r.data.question_sets }
  },

  /** El backend real trae las preguntas embebidas en el detalle. */
  get: async (id: string): Promise<{ data: QuestionSet | null }> => {
    if (USE_MOCK) {
      await mockDelay()
      const set = getQuestionSetById(id)
      if (!set) return { data: null }
      return { data: { ...set, questions: questionSetQuestions[set.id] ?? [] } }
    }
    const r = await http.get<QuestionSet>(`/api/v1/question-sets/${id}`)
    return { data: r.data }
  },

  create: async (data: CreateQuestionSetDTO): Promise<{ data: { id: string } }> => {
    if (USE_MOCK) {
      await mockDelay(800)
      return { data: { id: `mock-qs-${Date.now()}` } }
    }
    const r = await http.post<QuestionSet>('/api/v1/question-sets', data)
    return { data: { id: r.data.id } }
  },

  update: async (id: string, data: { name?: string; description?: string; status?: string }): Promise<void> => {
    if (USE_MOCK) return mockDelay(800)
    await http.patch<QuestionSet>(`/api/v1/question-sets/${id}`, data)
  },

  delete: (id: string) => {
    if (USE_MOCK) return mockDelay()
    return http.delete(`/api/v1/question-sets/${id}`)
  },

  addQuestion: (setId: string, q: Omit<ProfilingQuestion, 'id' | 'question_set_id'>) => {
    if (USE_MOCK) return mockDelay()
    return http.post<ProfilingQuestion>(`/api/v1/question-sets/${setId}/questions`, q)
  },

  updateQuestion: (setId: string, qId: string, q: Partial<Omit<ProfilingQuestion, 'id' | 'question_set_id'>>) => {
    if (USE_MOCK) return mockDelay()
    return http.patch<ProfilingQuestion>(`/api/v1/question-sets/${setId}/questions/${qId}`, q)
  },

  deleteQuestion: (setId: string, qId: string) => {
    if (USE_MOCK) return mockDelay()
    return http.delete(`/api/v1/question-sets/${setId}/questions/${qId}`)
  },
}

// ─── Users (Settings → tab Usuarios) ──────────────────────────────────────────────

export const usersApi = {
  list: async (): Promise<{ data: User[] }> => {
    if (USE_MOCK) {
      await mockDelay()
      return { data: users }
    }
    const r = await http.get<User[]>('/api/v1/users')
    return { data: r.data }
  },

  setStatus: async (id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<void> => {
    if (USE_MOCK) return mockDelay()
    await http.patch(`/api/v1/users/${id}/status`, { status })
  },
}

// ─── AI Config (Settings → tab Parámetros de IA) ──────────────────────────────────

export const aiConfigApi = {
  getModels: async (): Promise<{ data: AIModelConfig[] }> => {
    if (USE_MOCK) {
      await mockDelay()
      return { data: aiModelConfigs }
    }
    const r = await http.get<{ models: AIModelConfig[] }>('/api/v1/ai-config/models')
    return { data: r.data.models }
  },

  setActiveModel: async (modelId: string): Promise<void> => {
    if (USE_MOCK) return mockDelay()
    await http.patch<AIModelConfig>(`/api/v1/ai-config/models/${modelId}/activate`)
  },

  getPrompts: async (): Promise<{ data: AIPrompt[] }> => {
    if (USE_MOCK) {
      await mockDelay()
      return { data: aiPrompts }
    }
    const r = await http.get<{ prompts: AIPrompt[] }>('/api/v1/ai-config/prompts')
    return { data: r.data.prompts }
  },

  getGlobalSettings: async (): Promise<{ data: GlobalSettings[] }> => {
    if (USE_MOCK) {
      await mockDelay()
      return { data: [] }
    }
    const r = await http.get<{ settings: GlobalSettings[] }>('/api/v1/ai-config/global-settings')
    return { data: r.data.settings }
  },
}

// ─── Metrics ─────────────────────────────────────────────────────────────────────

export const metricsApi = {
  getDashboard: async (): Promise<{ data: MetricsDashboard }> => {
    if (USE_MOCK) {
      await mockDelay()
      return { data: metricsDashboard }
    }
    return http.get<MetricsDashboard>('/api/v1/metrics/dashboard')
  },
}

export default http
