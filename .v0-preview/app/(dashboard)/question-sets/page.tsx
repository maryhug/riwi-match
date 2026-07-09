'use client'

import { MessageSquareText, Plus } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/riwi/button'
import { Card } from '@/components/riwi/card'
import { Header } from '@/components/riwi/header'
import { formatDate } from '@/lib/data'
import { questionSetsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { QuestionSetStatus } from '@/lib/types'

const STATUS_STYLES: Record<QuestionSetStatus, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'Borrador', bg: 'bg-bg-subtle', text: 'text-text' },
  ACTIVE: { label: 'Activo', bg: 'bg-mint-light', text: 'text-mint' },
  ARCHIVED: { label: 'Archivado', bg: 'bg-bg-subtle', text: 'text-text-muted' },
}

export default function QuestionSetsPage() {
  const { data: questionSets = [], isLoading } = useQuery({
    queryKey: ['question-sets'],
    queryFn: () => questionSetsApi.list().then((r) => r.data),
  })

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col">
      <Header title="Sets de preguntas" subtitle="Preguntas de profiling reutilizables">
        <Link href="/question-sets/new">
          <Button>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo set
          </Button>
        </Link>
      </Header>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" role="status" aria-label="Cargando" />
        </div>
      ) : questionSets.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary-light">
            <MessageSquareText className="size-6 text-primary" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Aún no hay sets de preguntas</p>
            <p className="mt-1 text-xs text-text-muted">
              Crea tu primer set para usarlo en las llamadas de profiling.
            </p>
          </div>
          <Link href="/question-sets/new">
            <Button variant="secondary">Crear el primero</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {questionSets.map((qs) => {
            const s = STATUS_STYLES[qs.status]
            return (
              <Link
                key={qs.id}
                href={`/question-sets/${qs.id}`}
                className="group rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-bg"
              >
                <Card className="flex h-full flex-col gap-3 transition-colors group-hover:border-primary">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-[15px] font-bold text-ink text-pretty">{qs.name}</h2>
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                        s.bg,
                        s.text,
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {qs.description && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-text-muted">
                      {qs.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                    <span className="font-mono text-[11px] font-bold text-primary">v{qs.version}</span>
                    <span className="font-mono text-[11px] text-text-muted">
                      {formatDate(qs.updated_at)}
                    </span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
