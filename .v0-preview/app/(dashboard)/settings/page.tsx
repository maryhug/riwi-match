'use client'

// Página solo para rol ADMIN — el acceso está gateado por el layout/FloatingNav.

import { Bot, Cable, CheckCircle2, ShieldAlert, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/riwi/button'
import { Card, CardContent, CardHeader } from '@/components/riwi/card'
import { Header } from '@/components/riwi/header'
import { getSession, ROLE_LABELS } from '@/lib/auth'
import { usersApi, aiConfigApi } from '@/lib/api'
import { cn } from '@/lib/utils'

type Tab = 'users' | 'ai' | 'integrations'

const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: 'users', label: 'Usuarios', icon: Users },
  { key: 'ai', label: 'Parámetros de IA', icon: Bot },
  { key: 'integrations', label: 'Integraciones', icon: Cable },
]

const INTEGRATIONS = [
  { name: 'OpenAI', description: 'Parseo de CVs y match con IA', connected: true },
  { name: 'ElevenLabs', description: 'Voz para llamadas de profiling', connected: true },
  { name: 'Twilio', description: 'Telefonía saliente', connected: true },
  { name: 'Anthropic', description: 'Modelo alternativo de análisis', connected: false },
]

function Toggle({ on, label, onClick, disabled }: { on: boolean; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        on ? 'bg-primary-solid' : 'bg-border-strong',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-5 rounded-full bg-white transition-transform',
          on ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('users')
  const [checked, setChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (!session || session.role !== 'ADMIN') {
      router.replace('/dashboard')
      return
    }
    setIsAdmin(true)
    setChecked(true)
  }, [router])

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data),
    enabled: isAdmin,
  })

  const { data: aiModelConfigs = [] } = useQuery({
    queryKey: ['ai-models'],
    queryFn: () => aiConfigApi.getModels().then((r) => r.data),
    enabled: isAdmin && tab === 'ai',
  })

  const { data: aiPrompts = [] } = useQuery({
    queryKey: ['ai-prompts'],
    queryFn: () => aiConfigApi.getPrompts().then((r) => r.data),
    enabled: isAdmin && tab === 'ai',
  })

  const userStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) => usersApi.setStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const activateModelMutation = useMutation({
    mutationFn: (modelId: string) => aiConfigApi.setActiveModel(modelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-models'] }),
  })

  if (!checked || !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
          role="status"
          aria-label="Verificando permisos"
        />
      </div>
    )
  }

  const toggleUserStatus = (id: string, current: 'ACTIVE' | 'SUSPENDED') => {
    userStatusMutation.mutate({ id, status: current === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col">
      <Header title="Configuración" subtitle="Solo administradores" />

      {/* Tabs */}
      <div role="tablist" aria-label="Secciones de configuración" className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors',
                active
                  ? 'border-primary-solid text-primary'
                  : 'border-transparent text-text-muted hover:text-ink',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'users' && (
        <div className="overflow-hidden rounded-[14px] border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-border bg-bg-subtle">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-text-muted">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-ink">
                        {u.name} {u.last_name}
                      </p>
                      <p className="text-[11px] text-text-muted">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-text">{ROLE_LABELS[u.role]}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                          u.status === 'ACTIVE'
                            ? 'bg-mint-light text-mint'
                            : 'bg-coral-light text-coral',
                        )}
                      >
                        {u.status === 'ACTIVE' ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={u.status === 'ACTIVE' ? 'outline' : 'secondary'}
                        loading={userStatusMutation.isPending && userStatusMutation.variables?.id === u.id}
                        onClick={() => toggleUserStatus(u.id, u.status)}
                      >
                        {u.status === 'ACTIVE' ? (
                          <>
                            <ShieldAlert className="size-3.5" aria-hidden="true" />
                            Suspender
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="size-3.5" aria-hidden="true" />
                            Reactivar
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'ai' && (
        <div className="flex flex-col gap-6">
          <section aria-label="Modelos de IA">
            <h2 className="mb-3 text-sm font-bold text-ink">Modelos por tipo de tarea</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {aiModelConfigs.map((c) => (
                <Card key={c.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-ink">{c.task_type}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-text-muted">
                      {c.provider} · {c.model_name}
                    </p>
                  </div>
                  <Toggle
                    on={c.is_active}
                    label={`Activar modelo para ${c.task_type}`}
                    disabled={activateModelMutation.isPending}
                    onClick={() => activateModelMutation.mutate(c.id)}
                  />
                </Card>
              ))}
            </div>
          </section>

          <section aria-label="Prompts del sistema">
            <h2 className="mb-3 text-sm font-bold text-ink">Prompts del sistema</h2>
            <div className="flex flex-col gap-3">
              {aiPrompts.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="mb-2">
                    <div>
                      <p className="text-[13px] font-bold text-ink">{p.task_type}</p>
                      <p className="font-mono text-[11px] text-text-muted">{p.version_name}</p>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                        p.is_active ? 'bg-mint-light text-mint' : 'bg-bg-subtle text-text-muted',
                      )}
                    >
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 rounded-[10px] bg-bg-subtle p-3 font-mono text-[11px] leading-relaxed text-text">
                      {p.system_prompt_text}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'integrations' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {INTEGRATIONS.map((integ) => (
            <Card key={integ.name} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-ink">{integ.name}</p>
                <p className="mt-0.5 text-[11px] text-text-muted">{integ.description}</p>
              </div>
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                  integ.connected ? 'bg-mint-light text-mint' : 'bg-bg-subtle text-text-muted',
                )}
              >
                <span
                  className={cn('size-1.5 rounded-full', integ.connected ? 'bg-mint' : 'bg-border-strong')}
                  aria-hidden="true"
                />
                {integ.connected ? 'Conectado' : 'No conectado'}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
