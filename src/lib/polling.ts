import type { CandidateStatus, ProfilingRunStatus } from "./types/enums";
import type { ProcessHomeResponse } from "./types/api";

// Polling de tareas asíncronas del backend (parseo de CV, match, profiling) vía TanStack Query.
// Fuente única de verdad para saber cuándo dejar de pollear.

export const POLL_INTERVAL_MS = 3000;
export const PROFILING_POLL_INTERVAL_MS = 10000;
// El detalle de un proceso debe reflejar cambios iniciados desde otra pestaña,
// otro recruiter o un worker. TanStack Query deja de hacerlo si todos los
// estados parecen asentados, así que mantenemos un pulso ligero mientras la
// pantalla está abierta (no se ejecuta en segundo plano por defecto).
export const LIVE_REFRESH_INTERVAL_MS = 5000;

export function homeProcessesRefetchInterval(data: ProcessHomeResponse | undefined): number {
  const hasActiveWork = data?.items.some((process) => {
    const counts = process.progress.counts;
    return (
      counts.cv_processing > 0 ||
      counts.match_processing > 0 ||
      counts.profiling_active > 0 ||
      counts.calls_active > 0
    );
  });
  return hasActiveWork ? LIVE_REFRESH_INTERVAL_MS : 30_000;
}

// Tope de seguridad: si el backend no asienta todo tras este tiempo (worker caído/atascado),
// dejamos de pollear para no golpear la API indefinidamente.
export const MAX_POLL_MS = 3 * 60_000;

export const SETTLED_CANDIDATE_STATUSES: ReadonlySet<CandidateStatus> = new Set([
  // LOADED requiere la acción manual "Analizar CVs"; no es trabajo activo.
  "LOADED",
  "MATCHED",
  // MATCH_PENDING está listo para la acción manual de matching.
  "MATCH_PENDING",
  "CV_ERROR",
  "DISCARDED",
  "PROFILING_COMPLETED",
  "PROFILING_FAILED",
]);

export function isCandidateSettled(status: string): boolean {
  return SETTLED_CANDIDATE_STATUSES.has(status as CandidateStatus);
}

export function candidateStatusesRefetchInterval(
  statuses: string[] | undefined,
  pollStartMs: number,
): number | false {
  if (!statuses || statuses.length === 0) return false;
  if (statuses.every(isCandidateSettled)) return false;
  if (Date.now() - pollStartMs > MAX_POLL_MS) return false;
  return POLL_INTERVAL_MS;
}

export const SETTLED_PROFILING_STATUSES: ReadonlySet<ProfilingRunStatus> = new Set([
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "NO_ANSWER",
  "VOICEMAIL_DETECTED",
]);

export function isProfilingRunSettled(status: string): boolean {
  return SETTLED_PROFILING_STATUSES.has(status as ProfilingRunStatus);
}

export function profilingRunsRefetchInterval(
  statuses: string[] | undefined,
  pollStartMs: number,
): number | false {
  if (!statuses || statuses.length === 0) return false;
  if (statuses.every(isProfilingRunSettled)) return false;
  if (Date.now() - pollStartMs > MAX_POLL_MS) return false;
  return PROFILING_POLL_INTERVAL_MS;
}
