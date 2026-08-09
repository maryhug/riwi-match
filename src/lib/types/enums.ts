// Enums del backend (cv-match-api) con sus labels en español para la UI.
// Fuente de verdad: Backend/src/infrastructure/db/models.py

export type ProcessStatus =
  | "DRAFT"
  | "CVS_UPLOADED"
  | "MATCH_PROCESSING"
  | "MATCH_DONE"
  | "PROFILING_CONFIGURED"
  | "PROFILING_ACTIVE"
  | "PROFILING_COMPLETED"
  | "CLOSED"
  | "ARCHIVED";

export const PROCESS_STATUS_LABEL: Record<ProcessStatus, string> = {
  DRAFT: "Borrador",
  CVS_UPLOADED: "CVs cargados",
  MATCH_PROCESSING: "Analizando match",
  MATCH_DONE: "Match listo",
  PROFILING_CONFIGURED: "Profiling configurado",
  PROFILING_ACTIVE: "En profiling",
  PROFILING_COMPLETED: "Profiling completado",
  CLOSED: "Cerrado",
  ARCHIVED: "Archivado",
};

export type CandidateStatus =
  | "LOADED"
  | "CV_PROCESSING"
  | "CV_ERROR"
  | "MATCH_PENDING"
  | "MATCH_PROCESSING"
  | "MATCHED"
  | "SELECTED_FOR_PROFILING"
  | "PROFILING_QUEUED"
  | "PROFILING_CALLING"
  | "PROFILING_COMPLETED"
  | "PROFILING_FAILED"
  | "DISCARDED";

export const CANDIDATE_STATUS_LABEL: Record<CandidateStatus, string> = {
  LOADED: "Cargado",
  CV_PROCESSING: "Procesando CV",
  CV_ERROR: "Error en CV",
  MATCH_PENDING: "Pendiente de match",
  MATCH_PROCESSING: "Analizando match",
  MATCHED: "Rankeado",
  SELECTED_FOR_PROFILING: "Seleccionado",
  PROFILING_QUEUED: "En cola",
  PROFILING_CALLING: "En llamada",
  PROFILING_COMPLETED: "Profiling completado",
  PROFILING_FAILED: "Profiling fallido",
  DISCARDED: "Descartado",
};

export type MatchCategory = "HIGH" | "MEDIUM" | "LOW" | "NOT_RECOMMENDED";

export const MATCH_CATEGORY_LABEL: Record<MatchCategory, string> = {
  HIGH: "Alto",
  MEDIUM: "Medio",
  LOW: "Bajo",
  NOT_RECOMMENDED: "No recomendado",
};

export type ProfilingRunStatus =
  | "PENDING"
  | "QUEUED"
  | "CALLING"
  | "ANSWERED"
  | "NO_ANSWER"
  | "FAILED"
  | "RETRY_PENDING"
  | "COMPLETED"
  | "CANCELLED"
  | "VOICEMAIL_DETECTED";

export const PROFILING_RUN_STATUS_LABEL: Record<ProfilingRunStatus, string> = {
  PENDING: "Pendiente",
  QUEUED: "En cola",
  CALLING: "Llamando",
  ANSWERED: "En conversación",
  NO_ANSWER: "Sin respuesta",
  FAILED: "Fallida",
  RETRY_PENDING: "Reintento pendiente",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  VOICEMAIL_DETECTED: "Buzón de voz",
};

export type AdvancementProbability = "HIGH" | "MEDIUM" | "LOW";

export const ADVANCEMENT_PROBABILITY_LABEL: Record<AdvancementProbability, string> = {
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

export type UserRole = "ADMIN" | "RECRUITER" | "TA_LEADER";

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "Administrador",
  RECRUITER: "Recruiter",
  TA_LEADER: "Líder TA",
};

export type UserStatus = "ACTIVE" | "SUSPENDED";

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "Activo",
  SUSPENDED: "Inactivo",
};

export type QuestionSetStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export const QUESTION_SET_STATUS_LABEL: Record<QuestionSetStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  ARCHIVED: "Archivado",
};

export type QuestionType = "OPEN" | "CLOSED" | "MULTIPLE_CHOICE" | "YES_NO" | "NUMERIC";

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  OPEN: "Abierta",
  CLOSED: "Cerrada",
  MULTIPLE_CHOICE: "Opción múltiple",
  YES_NO: "Sí/No",
  NUMERIC: "Numérica",
};

export type WhatsAppConsentStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "TIMEOUT";

export const WHATSAPP_CONSENT_STATUS_LABEL: Record<WhatsAppConsentStatus, string> = {
  PENDING: "Pendiente",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
  TIMEOUT: "Sin respuesta",
};

export type AvailabilityPreferenceType = "ANYTIME" | "MORNING" | "AFTERNOON" | "SPECIFIC_WINDOW";

export const AVAILABILITY_PREFERENCE_LABEL: Record<AvailabilityPreferenceType, string> = {
  ANYTIME: "Cualquier momento",
  MORNING: "Mañana",
  AFTERNOON: "Tarde",
  SPECIFIC_WINDOW: "Horario específico",
};

export type AITaskType =
  | "CV_EXTRACTION"
  | "CV_MATCH"
  | "JD_ENHANCEMENT"
  | "VOICE_PROFILING"
  | "WHATSAPP_MESSAGE"
  | "VOICE_CALL_AGENT";

export const AI_TASK_TYPE_LABEL: Record<AITaskType, string> = {
  CV_EXTRACTION: "Extracción de CV",
  CV_MATCH: "Match de CV",
  JD_ENHANCEMENT: "Mejora de JD",
  VOICE_PROFILING: "Evaluación de profiling",
  WHATSAPP_MESSAGE: "Mensaje WhatsApp",
  VOICE_CALL_AGENT: "Agente de llamada",
};

export type OperationType =
  | "CV_STORAGE"
  | "CV_EXTRACTION"
  | "CV_EMBEDDING"
  | "CV_MATCH"
  | "JD_ENHANCEMENT"
  | "VOICE_CALL"
  | "VOICE_TRANSCRIPTION"
  | "WHATSAPP_MESSAGE"
  | "WHATSAPP_AI"
  | "ANSWER_EVALUATION"
  | "TWILIO_CALL";

export const OPERATION_TYPE_LABEL: Record<OperationType, string> = {
  CV_STORAGE: "Almacenamiento de CV (R2)",
  CV_EXTRACTION: "Extracción de CV",
  CV_EMBEDDING: "Embedding de CV",
  CV_MATCH: "Match de CV",
  JD_ENHANCEMENT: "Mejora de JD",
  VOICE_CALL: "Llamada de voz (ElevenLabs)",
  VOICE_TRANSCRIPTION: "Transcripción de voz",
  WHATSAPP_MESSAGE: "Mensaje WhatsApp",
  WHATSAPP_AI: "Asistente de WhatsApp",
  ANSWER_EVALUATION: "Evaluación de respuestas",
  TWILIO_CALL: "Telefonía (Twilio)",
};
