'use client'

import { Archive, CheckCircle2, Save } from 'lucide-react'
import { notFound, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/riwi/button'
import { Card } from '@/components/riwi/card'
import { Input, Textarea } from '@/components/riwi/form'
import { Header } from '@/components/riwi/header'
import { QuestionBuilder } from '@/components/riwi/question-builder'
import { questionSetsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ProfilingQuestion, QuestionSetStatus } from '@/lib/types'

const STATUS_STYLES: Record<QuestionSetStatus, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'Borrador', bg: 'bg-bg-subtle', text: 'text-text' },
  ACTIVE: { label: 'Activo', bg: 'bg-mint-light', text: 'text-mint' },
  ARCHIVED: { label: 'Archivado', bg: 'bg-bg-subtle', text: 'text-text-muted' },
}

export default function QuestionSetDetailPage() {
  const params = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: set, isLoading } = useQuery({
    queryKey: ['question-set', params.id],
    queryFn: () => questionSetsApi.get(params.id).then((r) => r.data),
  })

  const [status, setStatus] = useState<QuestionSetStatus>('DRAFT')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<ProfilingQuestion[]>([])
  const [originalQuestions, setOriginalQuestions] = useState<ProfilingQuestion[]>([])
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Sincroniza el formulario controlado cuando llegan los datos reales.
  useEffect(() => {
    if (!set) return
    setStatus(set.status)
    setName(set.name)
    setDescription(set.description ?? '')
    setQuestions(set.questions ?? [])
    setOriginalQuestions(set.questions ?? [])
  }, [set])

  const statusMutation = useMutation({
    mutationFn: (next: QuestionSetStatus) => questionSetsApi.update(params.id, { status: next }),
    onSuccess: (_res, next) => {
      setStatus(next)
      queryClient.invalidateQueries({ queryKey: ['question-set', params.id] })
      queryClient.invalidateQueries({ queryKey: ['question-sets'] })
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      await questionSetsApi.update(params.id, { name, description })

      const originalIds = new Set(originalQuestions.map((q) => q.id).filter(Boolean))
      const currentIds = new Set(questions.map((q) => q.id).filter(Boolean))

      await Promise.all([
        ...questions
          .filter((q) => q.id)
          .map((q) => questionSetsApi.updateQuestion(params.id, q.id!, q)),
        ...questions
          .filter((q) => !q.id)
          .map((q) => questionSetsApi.addQuestion(params.id, q)),
        ...originalQuestions
          .filter((q) => q.id && !currentIds.has(q.id))
          .map((q) => questionSetsApi.deleteQuestion(params.id, q.id!)),
      ])

      void originalIds
    },
    onSuccess: () => {
      setSaved(true)
      setSaveError('')
      queryClient.invalidateQueries({ queryKey: ['question-set', params.id] })
    },
    onError: (err) => {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setSaveError(axiosErr.response?.data?.detail || 'No se pudieron guardar los cambios.')
      setSaved(false)
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" role="status" aria-label="Cargando" />
      </div>
    )
  }

  if (!set) notFound()

  const s = STATUS_STYLES[status]

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      <Header title={set.name} subtitle={`Versión ${set.version}`}>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide',
            s.bg,
            s.text,
          )}
        >
          {s.label}
        </span>
      </Header>

      <div className="flex flex-col gap-6">
        {/* Ciclo de vida */}
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            Ciclo de vida: Borrador → Activo → Archivado. Un set archivado no puede usarse en
            nuevas llamadas.
          </p>
          <div className="flex gap-2">
            {status === 'DRAFT' && (
              <Button
                size="sm"
                variant="secondary"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate('ACTIVE')}
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Activar set
              </Button>
            )}
            {status === 'ACTIVE' && (
              <Button
                size="sm"
                variant="outline"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate('ARCHIVED')}
              >
                <Archive className="size-4" aria-hidden="true" />
                Archivar set
              </Button>
            )}
            {status === 'ARCHIVED' && (
              <p className="text-[11px] font-semibold text-text-muted">
                Este set está archivado (solo lectura)
              </p>
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <Input label="Nombre del set" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-20"
          />
        </Card>

        <QuestionBuilder questions={questions} onChange={setQuestions} />

        <div className="flex items-center justify-end gap-3">
          {saveError && <span className="text-xs font-semibold text-coral">{saveError}</span>}
          {saved && !saveError && <span className="text-xs font-semibold text-mint">Cambios guardados</span>}
          <Button
            onClick={() => {
              setSaved(false)
              saveMutation.mutate()
            }}
            loading={saveMutation.isPending}
            disabled={status === 'ARCHIVED'}
          >
            <Save className="size-4" aria-hidden="true" />
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  )
}
