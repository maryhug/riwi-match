'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, FileText, Upload, ChevronRight, ChevronDown, ChevronUp, Sparkles, X, Paperclip } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Input, Select, Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { processesApi } from '@/lib/api';

const SENIORITY_OPTIONS = [
  { value: 'Jr', label: 'Junior' }, { value: 'Ssr', label: 'Semi Senior' },
  { value: 'Sr', label: 'Senior' }, { value: 'Lead', label: 'Lead' }, { value: 'Manager', label: 'Manager' },
];
const AREA_OPTIONS = [
  { value: 'Tecnología', label: 'Tecnología' }, { value: 'Producto', label: 'Producto' },
  { value: 'Diseño', label: 'Diseño' },         { value: 'Datos', label: 'Datos' },
  { value: 'Ventas', label: 'Ventas' },         { value: 'Marketing', label: 'Marketing' },
  { value: 'Personas', label: 'Personas' },     { value: 'Comercial', label: 'Comercial' },
];
const STEPS = [
  { title: 'Básicos',         sub: 'Nombre, cargo y área' },
  { title: 'Job Description', sub: 'Describe la vacante' },
  { title: 'Subir CVs',       sub: 'Carga los candidatos' },
];

// --- Stepper ---
function Stepper({ current }: { current: number }) {
  return (
    <div className="flex bg-surface border-b border-border">
      {STEPS.map((step, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center gap-2 px-5 py-3 relative"
            style={{ borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: -1 }}>
            <span className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded ${
              done   ? 'bg-primary text-white' :
              active ? 'bg-primary-light text-primary-dark' :
                       'bg-bg-subtle text-text-muted'
            }`}>
              {done ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
            </span>
            <div className="hidden sm:block">
              <p className={`text-xs font-semibold whitespace-nowrap leading-none ${active ? 'text-primary-dark' : done ? 'text-text' : 'text-text-muted'}`}>{step.title}</p>
              <p className={`text-[10px] mt-0.5 whitespace-nowrap ${active ? 'text-primary' : 'text-border-strong'}`}>{step.sub}</p>
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-border-strong ml-2" />}
          </div>
        );
      })}
    </div>
  );
}

// --- Step 1 ---
function Step1({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName]           = useState('');
  const [jobTitle, setJobTitle]   = useState('');
  const [area, setArea]           = useState('Tecnología');
  const [seniority, setSeniority] = useState('Sr');
  const [budget, setBudget]       = useState('');
  const [error, setError]         = useState('');

  const [showWeights, setShowWeights] = useState(false);
  const [weights, setWeights] = useState({
    technical_skills: 45,
    relevant_experience: 25,
    seniority: 15,
    industry_domain: 7,
    languages: 5,
    education_certifications: 3,
  });

  const totalWeights = Object.values(weights).reduce((a, b) => a + b, 0);
  const hasNegativeWeight = Object.values(weights).some((w) => w < 0);
  const isValidWeights = !showWeights || (totalWeights === 100 && !hasNegativeWeight);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      processesApi.create({
        name: name.trim(),
        job_title: jobTitle.trim(),
        area,
        seniority,
        budget_max_usd: budget ? parseFloat(budget) : 0,
        match_weights_override: showWeights ? weights : undefined,
      }),
    onSuccess: (res) => onCreated(res.data.process_id),
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail ?? 'Error al crear el proceso.');
    },
  });

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Nombre del proceso" placeholder="Ej. Backend Node Sr" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Cargo" placeholder="Ej. Desarrollador Backend" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Select label="Área" value={area} onChange={(e) => setArea(e.target.value)} options={AREA_OPTIONS} />
          <Select label="Seniority" value={seniority} onChange={(e) => setSeniority(e.target.value)} options={SENIORITY_OPTIONS} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Presupuesto máximo USD (opcional)" type="number" placeholder="Ej. 500" value={budget} onChange={(e) => setBudget(e.target.value)} />
        </div>

        {/* Configuración avanzada de pesos de match */}
        <div className="border border-border rounded-[var(--radius-md)] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowWeights(!showWeights)}
            className="w-full px-4 py-3 flex items-center justify-between bg-surface-raised hover:bg-bg-subtle transition-colors text-xs font-semibold text-text"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              Configuración avanzada de pesos de match (Opcional)
            </span>
            {showWeights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showWeights && (
            <div className="p-4 bg-surface border-t border-border space-y-4">
              <p className="text-xs text-text-muted leading-normal">
                Ajusta los porcentajes para dar más peso a dimensiones específicas durante el análisis y ranking automatizado por IA. La suma total debe ser exactamente 100%.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Input
                  label="Habilidades técnicas (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={weights.technical_skills}
                  onChange={(e) => setWeights({ ...weights, technical_skills: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Experiencia relevante (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={weights.relevant_experience}
                  onChange={(e) => setWeights({ ...weights, relevant_experience: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Seniority (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={weights.seniority}
                  onChange={(e) => setWeights({ ...weights, seniority: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Dominio de industria (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={weights.industry_domain}
                  onChange={(e) => setWeights({ ...weights, industry_domain: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Idiomas (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={weights.languages}
                  onChange={(e) => setWeights({ ...weights, languages: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Educación y cert. (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={weights.education_certifications}
                  onChange={(e) => setWeights({ ...weights, education_certifications: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-[var(--radius-sm)] ${
                    totalWeights === 100 && !hasNegativeWeight ? 'bg-mint-light text-mint-dark' : 'bg-coral-light text-coral-dark'
                  }`}>
                    Suma total: {totalWeights}%
                  </span>
                  {totalWeights !== 100 && (
                    <span className="text-[11px] text-coral font-medium">
                      ⚠️ Debe ser exactamente 100%
                    </span>
                  )}
                  {hasNegativeWeight && (
                    <span className="text-[11px] text-coral font-medium">
                      ⚠️ No se permiten valores negativos
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setWeights({
                    technical_skills: 45,
                    relevant_experience: 25,
                    seniority: 15,
                    industry_domain: 7,
                    languages: 5,
                    education_certifications: 3,
                  })}
                  className="text-xs text-primary hover:text-primary-dark hover:underline font-semibold"
                >
                  Restablecer valores por defecto
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-coral-dark bg-coral-light px-3 py-2 rounded-[var(--radius-sm)]">{error}</p>}
        
        <div className="flex justify-between pt-4 border-t border-border">
          <Link href="/hiring-processes"><Button variant="ghost">Cancelar</Button></Link>
          <Button
            onClick={() => {
              setError('');
              if (!name.trim() || !jobTitle.trim()) {
                setError('Nombre y cargo son obligatorios.');
                return;
              }
              mutate();
            }}
            loading={isPending}
            disabled={!isValidWeights}
          >
            Siguiente <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Step 2 ---
type JDMode = 'file' | 'text';

function Step2({ processId, onNext, onSkip }: { processId: string; onNext: () => void; onSkip: () => void }) {
  const [mode, setMode]       = useState<JDMode>('file');
  const [rawText, setRawText] = useState('');
  const [jdFile, setJdFile]   = useState<File | null>(null);
  const [error, setError]     = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileMutation = useMutation({ mutationFn: () => processesApi.uploadJDFile(processId, jdFile!), onSuccess: onNext, onError: (err: unknown) => { const e = err as { response?: { data?: { detail?: string } } }; setError(e?.response?.data?.detail ?? 'Error al subir el archivo.'); } });
  const textMutation = useMutation({ mutationFn: () => processesApi.saveJD(processId, rawText), onSuccess: onNext, onError: (err: unknown) => { const e = err as { response?: { data?: { detail?: string } } }; setError(e?.response?.data?.detail ?? 'Error al guardar la JD.'); } });

  const isPending = fileMutation.isPending || textMutation.isPending;
  const canSave   = mode === 'file' ? !!jdFile : rawText.trim().length > 0;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6 space-y-6">
        {/* Mode tabs */}
        <div className="flex border border-border rounded-[var(--radius-md)] overflow-hidden self-start w-fit">
          {(['file', 'text'] as JDMode[]).map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors ${mode === m ? 'bg-primary text-white' : 'text-text-muted hover:bg-bg-subtle'}`}>
              {m === 'file' ? <Paperclip className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
              {m === 'file' ? 'Subir archivo' : 'Pegar texto'}
            </button>
          ))}
        </div>

        {mode === 'file' && (
          <div className="space-y-3">
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { setJdFile(f); setError(''); } }} />
            {!jdFile ? (
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-[var(--radius-md)] p-8 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary-xlight transition-colors">
                <Paperclip className="w-8 h-8 text-border-strong" />
                <div className="text-center">
                  <p className="text-sm font-medium text-text">Haz clic para seleccionar el archivo</p>
                  <p className="text-xs text-text-muted mt-1">PDF, DOCX o TXT · máx. 10 MB</p>
                </div>
              </button>
            ) : (
              <div className="flex items-center justify-between bg-primary-xlight border border-primary-light rounded-[var(--radius-md)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Paperclip className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{jdFile.name}</p>
                    <p className="text-xs text-text-muted">{(jdFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={() => { setJdFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-text-muted hover:text-coral"><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        )}

        {mode === 'text' && (
          <Textarea 
            rows={10} 
            value={rawText} 
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Pega aquí el texto completo del Job Description..."
          />
        )}

        {error && <p className="text-xs text-coral-dark bg-coral-light px-3 py-2 rounded-[var(--radius-sm)]">{error}</p>}

        <div className="flex justify-between pt-4 border-t border-border">
          <Button variant="ghost" onClick={onSkip}>Omitir por ahora</Button>
          <Button onClick={() => { setError(''); if (mode === 'file' && jdFile) { fileMutation.mutate(); return; } if (mode === 'text' && rawText.trim()) { textMutation.mutate(); return; } setError('Debes subir un archivo o escribir el texto del JD.'); }} loading={isPending} disabled={!canSave}>
            Guardar JD <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Step 3 ---
function Step3({ processId, onDone }: { processId: string; onDone: () => void }) {
  const [files, setFiles]     = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError]     = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => processesApi.uploadCandidates(processId, files),
    onSuccess: onDone,
    onError: (err: unknown) => { const e = err as { response?: { data?: { detail?: string } } }; setError(e?.response?.data?.detail ?? 'Error al subir los CVs.'); },
  });

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files).filter((f) => f.type === 'application/pdf')]);
  }, []);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6 space-y-6">
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
          className={`border-2 border-dashed rounded-[var(--radius-md)] p-8 text-center transition-colors ${dragging ? 'border-primary bg-primary-xlight' : 'border-border hover:border-primary hover:bg-bg-subtle'}`}>
          <Upload className="w-9 h-9 text-border-strong mx-auto mb-3" />
          <p className="text-sm font-medium text-text mb-1">Arrastra los PDFs aquí</p>
          <p className="text-xs text-text-muted mb-4">o haz clic para seleccionar archivos</p>
          <label className="cursor-pointer inline-block px-4 py-1.5 bg-primary text-white rounded-[var(--radius-md)] text-xs font-semibold hover:bg-primary-dark transition-colors shadow-sm">
            Seleccionar CVs
            <input type="file" accept=".pdf" multiple className="hidden" onChange={(e) => { if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]); }} />
          </label>
        </div>

        {files.length > 0 && (
          <div>
            <p className="text-xs font-medium text-text border-b border-border pb-2 mb-2">{files.length} archivo(s) seleccionado(s)</p>
            <div className="max-h-40 overflow-y-auto divide-y divide-border">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span className="text-xs text-ink truncate max-w-[260px]">{f.name}</span>
                  </div>
                  <button onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="text-text-muted hover:text-coral"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-coral-dark bg-coral-light px-3 py-2 rounded-[var(--radius-sm)]">{error}</p>}

        <div className="flex justify-between pt-4 border-t border-border">
          <Button variant="ghost" onClick={onDone}>Ir al proceso <ChevronRight className="w-4 h-4 ml-1" /></Button>
          <Button onClick={() => mutate()} loading={isPending} disabled={files.length === 0}>
            <Upload className="w-3.5 h-3.5 mr-2" /> Subir {files.length > 0 ? `${files.length} CV(s)` : 'CVs'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main ---
export default function NewProcessPage() {
  const router = useRouter();
  const [step, setStep]           = useState(0);
  const [processId, setProcessId] = useState<string | null>(null);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Link href="/hiring-processes" className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-ink transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a procesos
        </Link>
        <h1 className="text-2xl font-bold text-ink">Nuevo proceso de selección</h1>
        <p className="text-sm text-text-muted mt-1">Paso {step + 1} de {STEPS.length} — {STEPS[step].title}</p>
      </div>

      <div className="mb-6">
        <Stepper current={step} />
      </div>

      <div className="w-full">
        {step === 0 && <Step1 onCreated={(id) => { setProcessId(id); setStep(1); }} />}
        {step === 1 && processId && <Step2 processId={processId} onNext={() => setStep(2)} onSkip={() => setStep(2)} />}
        {step === 2 && processId && <Step3 processId={processId} onDone={() => router.push(`/hiring-processes/${processId}`)} />}
      </div>
    </div>
  );
}
