'use client'

import {
  Check,
  ChevronDown,
  FileText,
  Mail,
  Phone,
  Search,
  X,
} from 'lucide-react'
import { notFound, useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MatchBadge } from '@/components/riwi/badge'
import { Button } from '@/components/riwi/button'
import { Header } from '@/components/riwi/header'
import { PdfPreviewModal } from '@/components/riwi/pdf-preview-modal'
import { processesApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { CandidateListItem, MatchBreakdown, MatchCategory } from '@/lib/types'

const BREAKDOWN_LABELS: Record<keyof MatchBreakdown, string> = {
  technical_skills: 'Habilidades técnicas',
  relevant_experience: 'Experiencia relevante',
  seniority: 'Seniority',
  industry_domain: 'Industria/Dominio',
  languages: 'Idiomas',
  education_certifications: 'Educación/Certificaciones',
}

function BreakdownBars({ breakdown }: { breakdown: MatchBreakdown }) {
  const entries = (Object.keys(BREAKDOWN_LABELS) as (keyof MatchBreakdown)[])
    .filter((k) => breakdown[k])
    .map((k) => ({ key: k, label: BREAKDOWN_LABELS[k], item: breakdown[k]! }))

  return (
    <div className="flex flex-col gap-3">
      {entries.map(({ key, label, item }) => {
        const score = item.raw_score ?? 0
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-48 shrink-0 text-xs text-text">{label}</span>
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-bg-subtle"
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={label}
            >
              <div className="h-full rounded-full bg-primary-solid" style={{ width: `${score}%` }} />
            </div>
            <span className="w-12 text-right font-mono text-xs font-bold text-ink">{score}%</span>
            <span className="w-16 text-right font-mono text-[11px] text-text-muted">
              peso {Math.round(item.weight * 100)}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

function ExpandedRow({ c }: { c: CandidateListItem }) {
  return (
    <div className="flex flex-col gap-5 border-t border-border bg-bg-subtle p-5">
      {c.match_summary && (
        <p className="text-[13px] leading-relaxed text-text">{c.match_summary}</p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {c.strengths && c.strengths.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-mint">Fortalezas</h4>
            <ul className="flex flex-col gap-1.5">
              {c.strengths.map((s) => (
                <li key={s} className="flex items-start gap-2 text-xs text-text">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-mint" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {c.gaps && c.gaps.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-coral">Brechas</h4>
            <ul className="flex flex-col gap-1.5">
              {c.gaps.map((g) => (
                <li key={g} className="flex items-start gap-2 text-xs text-text">
                  <X className="mt-0.5 size-3.5 shrink-0 text-coral" aria-hidden="true" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {c.breakdown && (
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-text-muted">
            Desglose del match
          </h4>
          <BreakdownBars breakdown={c.breakdown} />
        </div>
      )}
    </div>
  )
}

export default function RankingPage() {
  const params = useParams<{ id: string }>()
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [pdfCandidate, setPdfCandidate] = useState<CandidateListItem | null>(null)

  const { data: process, isLoading: loadingProcess } = useQuery({
    queryKey: ['process', params.id],
    queryFn: () => processesApi.get(params.id).then((r) => r.data),
  })

  const { data: rankingCandidates = [], isLoading: loadingCandidates } = useQuery({
    queryKey: ['candidates', params.id],
    queryFn: () => processesApi.getCandidatesList(params.id).then((r) => r.data),
    enabled: !!process,
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rankingCandidates
    return rankingCandidates.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    )
  }, [rankingCandidates, query])

  if (loadingProcess || (process && loadingCandidates)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" role="status" aria-label="Cargando" />
      </div>
    )
  }

  if (!process) notFound()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col">
      <Header title="Ranking de candidatos" subtitle={process.name} />

      <div className="relative mb-4 max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o email..."
          aria-label="Buscar candidatos"
          className="w-full rounded-full border border-border bg-surface py-2.5 pl-9 pr-4 text-xs text-ink placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-bg"
        />
      </div>

      <div className="overflow-hidden rounded-[14px] border border-border bg-surface">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-bg-subtle">
              <th className="px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-wide text-text-muted">
                #
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                Candidato
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                Match
              </th>
              <th className="hidden px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-text-muted md:table-cell">
                Ciudad
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-text-muted">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-xs text-text-muted">
                  No hay candidatos que coincidan con la búsqueda.
                </td>
              </tr>
            )}
            {filtered.map((c) => {
              const isOpen = expanded === c.process_candidate_id
              return (
                <tr key={c.process_candidate_id} className="group border-b border-border last:border-b-0 align-top">
                  <td colSpan={5} className="p-0">
                    <div>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setExpanded(isOpen ? null : c.process_candidate_id)}
                        className="grid w-full cursor-pointer grid-cols-[3rem_1fr_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-subtle md:grid-cols-[3rem_1fr_8rem_8rem_auto]"
                      >
                        <span className="font-mono text-sm font-bold text-primary">{c.rank}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-bold text-ink">{c.name}</span>
                          <span className="block truncate text-[11px] text-text-muted">{c.email}</span>
                        </span>
                        <span>
                          {c.match_category && (
                            <MatchBadge
                              category={c.match_category as MatchCategory}
                              percentage={c.match_percentage}
                            />
                          )}
                        </span>
                        <span className="hidden text-xs text-text md:block">{c.city ?? '—'}</span>
                        <span className="flex items-center justify-end gap-1">
                          {c.phone && (
                            <a
                              href={`tel:${c.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Llamar a ${c.name}`}
                              className="flex size-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-primary-light hover:text-primary"
                            >
                              <Phone className="size-4" />
                            </a>
                          )}
                          <a
                            href={`mailto:${c.email}`}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Enviar email a ${c.name}`}
                            className="flex size-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-primary-light hover:text-primary"
                          >
                            <Mail className="size-4" />
                          </a>
                          {c.normalized_cv_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPdfCandidate(c)
                              }}
                            >
                              <FileText className="size-3.5" aria-hidden="true" />
                              CV
                            </Button>
                          )}
                          <ChevronDown
                            className={cn(
                              'ml-1 size-4 text-text-muted transition-transform',
                              isOpen && 'rotate-180',
                            )}
                            aria-hidden="true"
                          />
                        </span>
                      </button>
                      {isOpen && <ExpandedRow c={c} />}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {pdfCandidate?.normalized_cv_url && (
        <PdfPreviewModal
          isOpen={pdfCandidate !== null}
          onClose={() => setPdfCandidate(null)}
          title={`CV — ${pdfCandidate.name}`}
          fileUrl={processesApi.getNormalizedCvFileUrl(
            params.id,
            pdfCandidate.process_candidate_id,
            pdfCandidate.normalized_cv_url,
          )}
        />
      )}
    </div>
  )
}
