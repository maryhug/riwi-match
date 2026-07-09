/**
 * true por defecto (si la variable no está definida) para no romper el comportamiento
 * original generado por v0 en entornos donde nadie configuró .env.local todavía.
 */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/** Simula latencia de red en modo mock, para no perder la sensación de "cargando" del preview original. */
export function mockDelay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
