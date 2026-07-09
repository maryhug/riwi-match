'use client'

import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { Button } from './button'
import { Card } from './card'
import { Input, Select, Textarea } from './form'
import { cn } from '@/lib/utils'
import type { ProfilingQuestion, QuestionType } from '@/lib/types'

const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'OPEN', label: 'Abierta' },
  { value: 'CLOSED', label: 'Cerrada' },
  { value: 'MULTIPLE_CHOICE', label: 'Opción múltiple' },
  { value: 'YES_NO', label: 'Sí / No' },
  { value: 'NUMERIC', label: 'Numérica' },
  { value: 'SCALE', label: 'Escala' },
]

const NEEDS_EXPECTED: QuestionType[] = ['CLOSED', 'YES_NO', 'NUMERIC']
const NEEDS_KEYWORDS: QuestionType[] = ['OPEN', 'MULTIPLE_CHOICE']

export function emptyQuestion(orderIndex: number): ProfilingQuestion {
  return {
    order_index: orderIndex,
    text: '',
    type: 'OPEN',
    positive_keywords: [],
    risk_keywords: [],
    weight: 10,
    is_critical: false,
  }
}

function TagInput({
  label,
  tags,
  onChange,
  tone,
}: {
  label: string
  tags: string[]
  onChange: (tags: string[]) => void
  tone: 'positive' | 'risk'
}) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const t = draft.trim()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setDraft('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5 rounded-[10px] border border-border bg-surface px-2 py-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
              tone === 'positive' ? 'bg-mint-light text-mint' : 'bg-coral-light text-coral',
            )}
          >
            {t}
            <button
              type="button"
              aria-label={`Quitar keyword ${t}`}
              onClick={() => onChange(tags.filter((x) => x !== t))}
              className="cursor-pointer rounded-full hover:opacity-70"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={add}
          placeholder={tags.length === 0 ? 'Escribe y presiona Enter...' : ''}
          aria-label={label}
          className="min-w-24 flex-1 bg-transparent py-1 text-xs text-ink placeholder:text-text-muted focus:outline-none"
        />
      </div>
    </div>
  )
}

interface QuestionBuilderProps {
  questions: ProfilingQuestion[]
  onChange: (questions: ProfilingQuestion[]) => void
}

export function QuestionBuilder({ questions, onChange }: QuestionBuilderProps) {
  const totalWeight = questions.reduce((sum, q) => sum + (q.weight || 0), 0)

  const update = (index: number, patch: Partial<ProfilingQuestion>) => {
    onChange(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  const remove = (index: number) => {
    onChange(
      questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order_index: i + 1 })),
    )
  }

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= questions.length) return
    const next = [...questions]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next.map((q, i) => ({ ...q, order_index: i + 1 })))
  }

  const add = () => {
    onChange([...questions, emptyQuestion(questions.length + 1)])
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">Preguntas ({questions.length})</h2>
        <span
          className={cn(
            'rounded-full px-3 py-1 font-mono text-xs font-bold',
            totalWeight === 100 ? 'bg-mint-light text-mint' : 'bg-accent-light text-accent-dark',
          )}
        >
          Peso total: {totalWeight}%
        </span>
      </div>

      {questions.map((q, i) => (
        <Card key={`q-${i}`} className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-primary">
              Pregunta {String(q.order_index).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Subir pregunta"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-subtle hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Bajar pregunta"
                disabled={i === questions.length - 1}
                onClick={() => move(i, 1)}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-subtle hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Eliminar pregunta"
                onClick={() => remove(i)}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-text-muted transition-colors hover:bg-coral-light hover:text-coral"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          <Textarea
            label="Texto de la pregunta"
            placeholder="Ej: Cuéntame sobre tu experiencia con microservicios..."
            value={q.text}
            onChange={(e) => update(i, { text: e.target.value })}
            className="min-h-16"
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Tipo"
              value={q.type}
              onChange={(e) => update(i, { type: e.target.value as QuestionType })}
              options={TYPE_OPTIONS}
            />
            <Input
              label="Peso (%)"
              type="number"
              min={0}
              max={100}
              value={q.weight}
              onChange={(e) => update(i, { weight: Number(e.target.value) })}
            />
            <div className="flex items-end pb-2.5">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={q.is_critical}
                  onChange={(e) => update(i, { is_critical: e.target.checked })}
                  className="size-4 accent-[var(--color-coral)]"
                />
                Pregunta crítica
              </label>
            </div>
          </div>

          {NEEDS_EXPECTED.includes(q.type) && (
            <Input
              label="Respuesta esperada"
              placeholder={
                q.type === 'YES_NO'
                  ? 'Sí o No'
                  : q.type === 'NUMERIC'
                    ? 'Ej: 5 (años de experiencia)'
                    : 'Ej: PostgreSQL'
              }
              value={q.expected_answer ?? ''}
              onChange={(e) => update(i, { expected_answer: e.target.value })}
            />
          )}

          {NEEDS_KEYWORDS.includes(q.type) && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TagInput
                label="Keywords positivas"
                tone="positive"
                tags={q.positive_keywords}
                onChange={(tags) => update(i, { positive_keywords: tags })}
              />
              <TagInput
                label="Keywords de riesgo"
                tone="risk"
                tags={q.risk_keywords}
                onChange={(tags) => update(i, { risk_keywords: tags })}
              />
            </div>
          )}
        </Card>
      ))}

      <Button variant="outline" onClick={add} className="self-start">
        <Plus className="size-4" aria-hidden="true" />
        Agregar pregunta
      </Button>
    </div>
  )
}
