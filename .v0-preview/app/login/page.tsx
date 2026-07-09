'use client'

import { CheckCircle2, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/riwi/button'
import { Input } from '@/components/riwi/form'
import { ThemeToggle } from '@/components/riwi/theme-toggle'
import { login } from '@/lib/auth'
import { USE_MOCK } from '@/lib/config'

type View = 'login' | 'forgot' | 'sent'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Cuentas reales sembradas en la base de datos para pruebas, una por rol. */
const TEST_ACCOUNTS = [
  { role: 'Administrador', email: 'admin@riwi.io', password: 'riwi2026' },
  { role: 'Reclutador', email: 'recruiter@riwi.io', password: 'riwi2026' },
  { role: 'TA Leader', email: 'ta_leader@riwi.io', password: 'riwi2026' },
]

export default function LoginPage() {
  const router = useRouter()
  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; auth?: string }>({})
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!EMAIL_RE.test(email)) next.email = 'Ingresa un correo electrónico válido.'
    if (!password) next.password = 'La contraseña es obligatoria.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err) {
      setErrors({ auth: err instanceof Error ? err.message : 'No se pudo iniciar sesión.' })
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = (e: FormEvent) => {
    e.preventDefault()
    if (!EMAIL_RE.test(recoveryEmail)) {
      setErrors({ email: 'Ingresa un correo electrónico válido.' })
      return
    }
    setErrors({})
    setView('sent')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-[14px] bg-primary-solid">
            <Sparkles className="size-6 text-white" />
          </span>
          <div>
            <h1 className="font-sans text-3xl font-bold text-ink text-balance">RIWI MATCH</h1>
            <p className="mt-1 text-xs text-text-muted">
              Matching de CVs con inteligencia artificial
            </p>
          </div>
        </div>

        <div className="rounded-[20px] border border-border bg-surface p-6 shadow-tinted">
          {view === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
              <h2 className="font-sans text-base font-bold text-ink">Inicia sesión</h2>

              {errors.auth && (
                <p className="rounded-[10px] bg-coral-light px-3 py-2 text-xs font-medium text-coral" role="alert">
                  {errors.auth}
                </p>
              )}

              <Input
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                placeholder="tu@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />
              <Input
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />

              <Button type="submit" loading={loading} className="mt-1 w-full">
                Entrar
              </Button>

              <button
                type="button"
                onClick={() => {
                  setErrors({})
                  setView('forgot')
                }}
                className="mx-auto text-xs font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[6px] cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleForgot} className="flex flex-col gap-4" noValidate>
              <div>
                <h2 className="font-sans text-base font-bold text-ink">Recuperar contraseña</h2>
                <p className="mt-1 text-xs text-text-muted">
                  Te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              <Input
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                placeholder="tu@empresa.com"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                error={errors.email}
              />

              <Button type="submit" className="w-full">
                Enviar enlace
              </Button>

              <button
                type="button"
                onClick={() => {
                  setErrors({})
                  setView('login')
                }}
                className="mx-auto text-xs font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[6px] cursor-pointer"
              >
                Volver a iniciar sesión
              </button>
            </form>
          )}

          {view === 'sent' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-mint-light">
                <CheckCircle2 className="size-7 text-mint" />
              </span>
              <div>
                <h2 className="font-sans text-base font-bold text-ink">Revisa tu correo</h2>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  Si existe una cuenta asociada a{' '}
                  <span className="font-semibold text-ink">{recoveryEmail}</span>, recibirás un
                  enlace para restablecer tu contraseña en los próximos minutos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-xs font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[6px] cursor-pointer"
              >
                Volver a iniciar sesión
              </button>
            </div>
          )}
        </div>

        {view === 'login' && (
          <div className="mt-4 rounded-[14px] border border-border bg-bg-subtle p-3">
            <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              {USE_MOCK ? 'Modo mock — cualquier correo y contraseña sirven' : 'Cuentas de prueba (una por rol)'}
            </p>
            {!USE_MOCK && (
              <div className="flex flex-col gap-1.5">
                {TEST_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email)
                      setPassword(acc.password)
                      setErrors({})
                    }}
                    className="flex items-center justify-between gap-2 rounded-[10px] border border-border bg-surface px-3 py-2 text-left text-xs transition-colors hover:border-primary hover:bg-primary-light cursor-pointer"
                  >
                    <span className="font-semibold text-ink">{acc.role}</span>
                    <span className="font-mono text-[11px] text-text-muted">{acc.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
