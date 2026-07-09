import type { BackendCandidateStatus, ProfilingStatus } from './types';

/**
 * Polling de tareas asíncronas del backend (parseo de CV, match) vía TanStack Query.
 *
 * Fuente única de verdad para saber cuándo dejar de pollear, en vez de listas de
 * estados hardcodeadas inline en cada página. Alineado con el enum del backend
 * (`cv-match-api` → `CandidateStatus`) a través de `BackendCandidateStatus`.
 */

/** Intervalo de polling mientras haya trabajo pendiente. */
export const POLL_INTERVAL_MS = 5_000;

/**
 * Tope de seguridad. Si tras este tiempo el backend sigue sin asentar todos los
 * candidatos (worker caído o atascado), dejamos de pollear para no golpear la API
 * de forma indefinida. Evita el polling infinito cuando un candidato queda pegado
 * en un estado no-terminal (p. ej. MATCH_PENDING, PROFILING_QUEUED).
 */
export const MAX_POLL_MS = 3 * 60_000;

/**
 * Estados de candidato en los que **ningún worker seguirá trabajando**: terminales
 * de éxito/error o "asentados" hasta que un humano actúe. Derivado del enum del
 * backend; si se agrega un estado nuevo a `BackendCandidateStatus`, TypeScript
 * obliga a revisar este set.
 */
export const SETTLED_CANDIDATE_STATUSES: ReadonlySet<BackendCandidateStatus> = new Set([
  'MATCHED',
  'CV_ERROR',
  'DISCARDED',
  'PROFILING_COMPLETED',
  'PROFILING_FAILED',
]);

/** ¿El candidato llegó a un estado donde ya no cambia por trabajo de workers? */
export function isCandidateSettled(status: string): boolean {
  return SETTLED_CANDIDATE_STATUSES.has(status as BackendCandidateStatus);
}

/**
 * Calcula el `refetchInterval` para una lista de estados de candidato:
 * - sigue polleando (`POLL_INTERVAL_MS`) mientras algún candidato no esté asentado
 *   y no se haya superado el tope de seguridad;
 * - se detiene (`false`) cuando todos están asentados o venció `MAX_POLL_MS`.
 *
 * `pollStartMs` debe ser un timestamp estable por montaje (p. ej. `useRef(Date.now()).current`).
 */
export function candidateStatusesRefetchInterval(
  statuses: string[] | undefined,
  pollStartMs: number,
): number | false {
  if (!statuses || statuses.length === 0) return POLL_INTERVAL_MS;
  const allSettled = statuses.every(isCandidateSettled);
  if (allSettled) return false;
  if (Date.now() - pollStartMs > MAX_POLL_MS) return false;
  return POLL_INTERVAL_MS;
}

/** Estados terminales de una corrida de profiling (no cambian por trabajo de workers). */
export const SETTLED_PROFILING_STATUSES: ReadonlySet<ProfilingStatus> = new Set([
  'COMPLETED',
  'FAILED',
  'NO_ANSWER',
]);

/**
 * `refetchInterval` para corridas de profiling:
 * - sin corridas activas (lista vacía o todas terminales) → no pollea (`false`);
 * - con alguna activa (PENDING/CALLING) → 5s, hasta el tope de seguridad.
 *
 * Esto evita el poller que consulta indefinidamente un endpoint aún sin implementar
 * (hoy `getProfilingRuns` devuelve `[]`).
 */
export function profilingRunsRefetchInterval(
  statuses: ProfilingStatus[] | undefined,
  pollStartMs: number,
): number | false {
  if (!statuses || statuses.length === 0) return false;
  const allSettled = statuses.every((s) => SETTLED_PROFILING_STATUSES.has(s));
  if (allSettled) return false;
  if (Date.now() - pollStartMs > MAX_POLL_MS) return false;
  return POLL_INTERVAL_MS;
}
