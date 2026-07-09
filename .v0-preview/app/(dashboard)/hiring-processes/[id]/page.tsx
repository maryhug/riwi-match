'use client'

import {
  Check,
  FileText,
  Play,
  Upload,
  Users,
  Trophy,
  CalendarDays,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { StatusBadge } from '@/components/riwi/badge'
import { Button } from '@/components/riwi/button'
import { Card, CardContent, CardHeader } from '@/components/riwi/card'
import { Header } from '@/components/riwi/header'
import { PdfPreviewModal } from '@/components/riwi/pdf-preview-modal'
import { UploadCvsModal } from '@/components/riwi/upload-cvs-modal'
import { formatDate, formatUsd } from '@/lib/data'
import { processesApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ProcessStatus } from '@/lib/types'

const PIPELINE_STEPS = [
  { key: 'jd', label: 'JD' },
  { key: 'cvs', label: 'CVs' },
  { key: 'match', label: 'Match' },
  { key: 'profiling', label: 'Profiling' },
]

// Índice del paso actual del pipeline según el estado del proceso
function pipelineIndex(status: ProcessStatus): number {
  switch (status) {
    case 'DRAFT':
    case 'READY_FOR_MATCH':
      return 0
    case 'CVS_UPLOADED':
    case 'MATCHING':
      return 1
    case 'PROFILING_CONFIGURED':
      return 2
    case 'COMPLETED':
      return 3
  }
}

export default function ProcessDetailPage() {
  const params = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [showUpload, setShowUpload] = useState(false)
  const [showPdf, setShowPdf] = useState(false)

  const { data: process, isLoading } = useQuery({
    queryKey: ['process', params.id],
    queryFn: () => processesApi.get(params.id).then((r) => r.data),
  })

  const matchMutation = useMutation({
    mutationFn: () => processesApi.startMatch(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process', params.id] })
      queryClient.invalidateQueries({ queryKey: ['hiring-processes'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" role="status" aria-label="Cargando" />
      </div>
    )
  }

  if (!process) notFound()

  const currentStep = pipelineIndex(process.status)
  const jd = process.job_description_data

  // Reglas de estado: la UI solo refleja lo que el estado permite
  const canUploadCvs = process.status !== 'DRAFT'
  const canRunMatch = process.status === 'CVS_UPLOADED'
  const hasResults = currentStep >= 2

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col">
      <Header title={process.name} subtitle={`${process.job_title} · ${process.area} · ${process.seniority}`}>
        <StatusBadge status={process.status} />
      </Header>

      {/* Pipeline */}
      <Card className="mb-6">
        <ol className="flex items-center" aria-label="Pipeline del proceso">
          {PIPELINE_STEPS.map((s, i) => {
            const state = i < currentStep ? 'done' : i === currentStep ? 'active' : 'todo'
            return (
              <li key={s.key} className={cn('flex items-center', i < PIPELINE_STEPS.length - 1 && 'flex-1')}>
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      'flex size-9 items-center justify-center rounded-full text-xs font-bold transition-colors',
                      state === 'done' && 'bg-mint text-white',
                      state === 'active' && 'bg-primary-solid text-white',
                      state === 'todo' && 'bg-bg-subtle text-text-muted border border-border',
                    )}
                  >
                    {state === 'done' ? <Check className="size-4" aria-hidden="true" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-semibold',
                      state === 'active' ? 'text-ink' : 'text-text-muted',
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mx-3 mb-5 h-1 flex-1 rounded-full',
                      i < currentStep ? 'bg-mint' : 'bg-border',
                    )}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Job Description */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-blue-light">
                <FileText className="size-4 text-blue" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-bold text-ink">Job Description activa</h2>
            </div>
            {jd && <span className="font-mono text-[11px] text-text-muted">v{jd.version}</span>}
          </CardHeader>
          <CardContent>
            {jd ? (
              <div className="flex flex-col gap-4">
                <p className="text-[13px] leading-relaxed text-text">{jd.text_preview}</p>
                <div className="flex flex-wrap items-center gap-3">
                  {jd.jd_file_url ? (
                    <Button variant="secondary" size="sm" onClick={() => setShowPdf(true)}>
                      Ver documento completo
                    </Button>
                  ) : (
                    <p className="text-[11px] text-text-muted">JD ingresada como texto directo (sin archivo).</p>
                  )}
                  {jd.original_filename && (
                    <span className="font-mono text-[11px] text-text-muted">{jd.original_filename}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-sm font-semibold text-ink">Este proceso aún no tiene Job Description</p>
                <p className="max-w-sm text-xs text-text-muted">
                  Sube o pega una Job Description para poder cargar CVs y ejecutar el match.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Datos + acciones */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-bold text-ink">Información</h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs text-text">
                <Wallet className="size-4 text-text-muted" aria-hidden="true" />
                Presupuesto máx.
                <span className="ml-auto font-mono font-bold text-ink">{formatUsd(process.budget_max_usd)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text">
                <CalendarDays className="size-4 text-text-muted" aria-hidden="true" />
                Creado
                <span className="ml-auto font-mono text-ink">{formatDate(process.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text">
                <CalendarDays className="size-4 text-text-muted" aria-hidden="true" />
                Actualizado
                <span className="ml-auto font-mono text-ink">{formatDate(process.updated_at)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-bold text-ink">Acciones</h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div title={!canUploadCvs ? 'Primero necesitas una Job Description activa' : undefined}>
                <Button
                  className="w-full"
                  variant="secondary"
                  disabled={!canUploadCvs}
                  onClick={() => setShowUpload(true)}
                >
                  <Upload className="size-4" aria-hidden="true" />
                  Subir CVs
                </Button>
                {!canUploadCvs && (
                  <p className="mt-1 text-center text-[11px] text-text-muted">
                    Requiere una Job Description activa
                  </p>
                )}
              </div>

              <div title={!canRunMatch ? 'Requiere JD activa y CVs cargados' : undefined}>
                <Button
                  className="w-full"
                  disabled={!canRunMatch || matchMutation.isPending}
                  loading={matchMutation.isPending}
                  onClick={() => matchMutation.mutate()}
                >
                  <Play className="size-4" aria-hidden="true" />
                  Ejecutar match
                </Button>
                {matchMutation.isError && (
                  <p className="mt-1 text-center text-[11px] text-coral">
                    No se pudo iniciar el match. Intenta de nuevo.
                  </p>
                )}
                {!canRunMatch && (
                  <p className="mt-1 text-center text-[11px] text-text-muted">
                    {process.status === 'MATCHING'
                      ? 'El match está en ejecución'
                      : currentStep >= 2
                        ? 'El match ya fue ejecutado'
                        : 'Requiere JD activa y CVs cargados'}
                  </p>
                )}
              </div>

              {hasResults && (
                <>
                  <Link href={`/hiring-processes/${process.id}/candidates`} className="w-full">
                    <Button className="w-full" variant="outline">
                      <Users className="size-4" aria-hidden="true" />
                      Ver candidatos
                    </Button>
                  </Link>
                  <Link href={`/hiring-processes/${process.id}/ranking`} className="w-full">
                    <Button className="w-full" variant="outline">
                      <Trophy className="size-4" aria-hidden="true" />
                      Ver ranking
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <UploadCvsModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        processId={process.id}
        onUploaded={() => queryClient.invalidateQueries({ queryKey: ['process', params.id] })}
      />
      {jd?.jd_file_url && (
        <PdfPreviewModal
          isOpen={showPdf}
          onClose={() => setShowPdf(false)}
          title={jd.original_filename ?? 'Job Description'}
          fileUrl={processesApi.getJDFileUrl(process.id, jd.jd_file_url)}
        />
      )}
    </div>
  )
}
