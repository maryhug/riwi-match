import type { Role } from './types'
import { authApi } from './api'

export interface Session {
  role: Role
  email: string
  /** Presente solo cuando la sesión viene de un login real (NEXT_PUBLIC_USE_MOCK=false). */
  token?: string
}

const SESSION_KEY = 'riwi_session'

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (parsed && (parsed.role === 'ADMIN' || parsed.role === 'RECRUITER' || parsed.role === 'TA_LEADER')) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function setSession(session: Session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // localStorage no disponible
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // localStorage no disponible
  }
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  RECRUITER: 'Reclutador',
  TA_LEADER: 'TA Leader',
}

/**
 * Login real contra el backend (o simulado, según NEXT_PUBLIC_USE_MOCK) — hace login vía
 * authApi.login, guarda la sesión resultante (con token si es real) y la devuelve.
 * Lanza un Error con .message legible si las credenciales son inválidas.
 */
export async function login(email: string, password: string): Promise<Session> {
  try {
    const res = await authApi.login(email, password)
    const session: Session = { role: res.data.role, email, token: res.data.access_token }
    setSession(session)
    return session
  } catch (err) {
    const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } }
    if (axiosErr.response?.status === 401) {
      throw new Error(axiosErr.response.data?.detail || 'Correo o contraseña incorrectos.')
    }
    throw new Error('No se pudo conectar con el servidor. Intenta de nuevo.')
  }
}
