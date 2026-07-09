'use client'

import { ArrowLeft, ArrowRight, Check, FileUp, Type } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/riwi/button'
import { Card } from '@/components/riwi/card'
import { FileDropZone } from '@/components/riwi/file-drop-zone'
import { Input, Select, Textarea } from '@/components/riwi/form'
import { Header } from '@/components/riwi/header'
import { CV_EXTENSIONS } from '@/components/riwi/upload-cvs-modal'
import { processesApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { CreateHiringProcessDTO } from '@/lib/types'

const JD_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt']

const STEPS = [
  { key: 'basics', label: 'Básicos' },
  { key: 'jd', label: 'Job Description' },
  { key: 'cvs', label: 'Subir CVs' },
]

const WEIGHT_KEYS: { key: string; label: string }[] = [
  { key: 'technical_skills', label: 'Habilidades técnicas' },
  { key: 'relevant_experience', label: 'Experiencia relevante' },
  { key: 'seniority', label: 'Seniority' },
  { key: 'industry_domain', label: 'Industria/Dominio' },
  { key: 'languages', label: 'Idiomas' },
  { key: 'education_certifications', label: 'Educación/Certificaciones' },
]

const DEFAULT_WEIGHTS: Record<string, number> = {
  technical_skills: 30,
  relevant_experience: 25,
  seniority: 15,
  industry_domain: 10,
  languages: 10,
  education_certifications: 10,
}

export default function NewProcessPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [createError, setCreateError] = useState('')

  // Paso 1
  const [form, setForm] = useState<CreateHiringProcessDTO>({
    name: '',
    job_title: '',
    area: 'Ingeniería',
    seniority: 'Mid',
    budget_max_usd: 0,
  })
  const [showWeights, setShowWeights] = useState(false)
  const [weights, setWeights] = useState<Record<string, number>>(DEFAULT_WEIGHTS)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Paso 2
  const [jdMode, setJdMode] = useState<'file' | 'text'>('file')
  const [jdFiles, setJdFiles] = useState<File[]>([])
  const [jdText, setJdText] = useState('')
  const [jdError, setJdError] = useState('')

  // Paso 3
  const [cvFiles, setCvFiles] = useState<File[]>([])

  const createMutation = useMutation({
    mutationFn: async () => {
      const weightsPayload = showWeights
        ? Object.fromEntries(WEIGHT_KEYS.map((w) => [w.key, (weights[w.key] ?? 0) / 100]))
        : undefined

      const { data: created } = await processesApi.create({ ...form, match_weights_override: weightsPayload })
      const id = created.process_id

      if (jdMode === 'file' && jdFiles[0]) {
        await processesApi.uploadJDFile(id, jdFiles[0])
      } else if (jdMode === 'text' && jdText.trim()) {
        await processesApi.saveJD(id, jdText)
      }

      if (cvFiles.length > 0) {
        await processesApi.uploadCandidates(id, cvFiles)
      }

      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hiring-processes'] })
      router.push('/hiring-processes')
    },
    onError: (err) => {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setCreateError(axiosErr.response?.data?.detail || 'No se pudo crear el proceso. Intenta de nuevo.')
    },
  })

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'El nombre del proceso es obligatorio'
    if (!form.job_title.trim()) e.job_title = 'El cargo es obligatorio'
    if (!form.budget_max_usd || form.budget_max_usd <= 0)
      e.budget_max_usd = 'Ingresa un presupuesto mayor a 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    if (jdMode === 'file' && jdFiles.length === 0) {
      setJdError('Sube un archivo de Job Description o cambia a texto directo')
      return false
    }
    if (jdMode === 'text' && jdText.trim().length < 30) {
      setJdError('Pega el texto de la Job Description (mínimo 30 caracteres)')
      return false
    }
    setJdError('')
    return true
  }

  const next = () => {
    if (step === 0 && !validateStep1()) return
    if (step === 1 && !validateStep2()) return
    setStep((s) => Math.min(s + 1, 2))
  }

  const totalWeight = WEIGHT_KEYS.reduce((sum, w) => sum + (weights[w.key] ?? 0), 0)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      <Header title="Nuevo proceso" subtitle="Crea un proceso de contratación en 3 pasos" />

      {/* Stepper */}
      <nav aria-label="Progreso del formulario" className="mb-6">
        <ol className="flex gap-2">
          {STEPS.map((s, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'todo'
            return (
              <li key={s.key} className="flex-1">
                <div
                  className={cn(
                    'flex flex-col gap-2 border-b-4 pb-2 transition-colors',
                    state === 'active' && 'border-primary-solid',
                    state === 'done' && 'border-mint',
                    state === 'todo' && 'border-border',
                  )}
                >
                  <span className="flex items-center gap-2">
                    {state === 'done' ? (
                      <span className="flex size-5 items-center justify-center rounded-full bg-mint text-white">
                        <Check className="size-3" aria-hidden="true" />
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'font-mono text-xs font-bold',
                          state === 'active' ? 'text-primary' : 'text-text-muted',
                        )}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    )}
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        state === 'active' ? 'text-ink' : 'text-text-muted',
                      )}
                    >
                      {s.label}
                    </span>
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </nav>

      <Card>
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <Input
              label="Nombre del proceso"
              placeholder="Ej: Backend Squad Pagos"
              value={form.name}
              error={errors.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Cargo"
              placeholder="Ej: Desarrollador Backend Senior"
              value={form.job_title}
              error={errors.job_title}
              onChange={(e) => setForm({ ...form, job_title: e.target.value })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Área"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                options={[
                  { value: 'Ingeniería', label: 'Ingeniería' },
                  { value: 'Diseño', label: 'Diseño' },
                  { value: 'Datos', label: 'Datos' },
                  { value: 'Marketing', label: 'Marketing' },
                  { value: 'Ventas', label: 'Ventas' },
                  { value: 'Talento Humano', label: 'Talento Humano' },
                ]}
              />
              <Select
                label="Seniority"
                value={form.seniority}
                onChange={(e) => setForm({ ...form, seniority: e.target.value })}
                options={[
                  { value: 'Junior', label: 'Junior' },
                  { value: 'Mid', label: 'Mid' },
                  { value: 'Senior', label: 'Senior' },
                ]}
              />
            </div>
            <Input
              label="Presupuesto máximo (USD)"
              type="number"
              min={0}
              placeholder="Ej: 4500"
              value={form.budget_max_usd || ''}
              error={errors.budget_max_usd}
              onChange={(e) => setForm({ ...form, budget_max_usd: Number(e.target.value) })}
            />

            <div className="rounded-[14px] border border-border bg-bg-subtle p-4">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={showWeights}
                  onChange={(e) => setShowWeights(e.target.checked)}
                  className="size-4 accent-[var(--color-primary)]"
                />
                Personalizar pesos de match (opcional)
              </label>
              {showWeights && (
                <div className="mt-4 flex flex-col gap-3">
                  {WEIGHT_KEYS.map((w) => (
                    <div key={w.key} className="flex items-center gap-3">
                      <span className="w-52 shrink-0 text-xs text-text">{w.label}</span>
                      <input
                        type="range"
                        min={0}
                        max={50}
                        value={weights[w.key]}
                        aria-label={`Peso de ${w.label}`}
                        onChange={(e) =>
                          setWeights({ ...weights, [w.key]: Number(e.target.value) })
                        }
                        className="flex-1 accent-[var(--color-primary)]"
                      />
                      <span className="w-10 text-right font-mono text-xs font-bold text-ink">
                        {weights[w.key]}%
                      </span>
                    </div>
                  ))}
                  <p
                    className={cn(
                      'text-right font-mono text-[11px] font-semibold',
                      totalWeight === 100 ? 'text-mint' : 'text-coral',
                    )}
                  >
                    Total: {totalWeight}% {totalWeight !== 100 && '(debe sumar 100%)'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2" role="tablist" aria-label="Modo de Job Description">
              <button
                type="button"
                role="tab"
                aria-selected={jdMode === 'file'}
                onClick={() => setJdMode('file')}
                className={cn(
                  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[14px] border px-4 py-3 text-xs font-semibold transition-colors',
                  jdMode === 'file'
                    ? 'border-primary bg-primary-light text-primary'
                    : 'border-border bg-surface text-text-muted hover:bg-bg-subtle',
                )}
              >
                <FileUp className="size-4" aria-hidden="true" />
                Subir archivo
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={jdMode === 'text'}
                onClick={() => setJdMode('text')}
                className={cn(
                  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[14px] border px-4 py-3 text-xs font-semibold transition-colors',
                  jdMode === 'text'
                    ? 'border-primary bg-primary-light text-primary'
                    : 'border-border bg-surface text-text-muted hover:bg-bg-subtle',
                )}
              >
                <Type className="size-4" aria-hidden="true" />
                Pegar texto
              </button>
            </div>

            {jdMode === 'file' ? (
              <FileDropZone
                allowedExtensions={JD_EXTENSIONS}
                multiple={false}
                files={jdFiles}
                onFilesChange={setJdFiles}
                helperText="Job Description en .pdf, .docx, .doc o .txt (un solo archivo)"
              />
            ) : (
              <Textarea
                label="Texto de la Job Description"
                placeholder="Pega aquí la descripción completa del cargo..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="min-h-48"
              />
            )}

            {jdError && (
              <p className="rounded-[10px] bg-coral-light px-3 py-2 text-[11px] font-medium text-coral">
                {jdError}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-text-muted">
              Puedes subir los CVs ahora o hacerlo más tarde desde el detalle del proceso.
            </p>
            <FileDropZone
              allowedExtensions={CV_EXTENSIONS}
              files={cvFiles}
              onFilesChange={setCvFiles}
              helperText="PDF, Word o imágenes escaneadas (.pdf, .docx, .doc, .jpg, .jpeg, .png, .webp, .tiff, .bmp)"
            />
          </div>
        )}
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Atrás
        </Button>
        {step < 2 ? (
          <Button onClick={next}>
            Siguiente
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        ) : (
          <div className="flex flex-col items-end gap-1.5">
            <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending}>
              Crear proceso
            </Button>
            {createError && <p className="text-[11px] text-coral">{createError}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
