'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, FileText, Upload, ChevronRight, Sparkles, X, Paperclip } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Input, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
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

// ─── Stepper — tabs con underline, SIN círculos ───────────────────────────────
function Stepper({ current }: { current: number }) {
  return (
    <div className="flex">
      {STEPS.map((step, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center gap-2 px-5 py-3 relative"
            style={{ borderBottom: active ? '2px solid #7C3AED' : '2px solid transparent', marginBottom: -1 }}>
            <span className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded ${
              done   ? 'bg-violet-600 text-white' :
              active ? 'bg-violet-100 text-violet-700' :
                       'bg-slate-100 text-slate-400'
            }`}>
              {done ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
            </span>
            <div className="hidden sm:block">
              <p className={`text-xs font-semibold whitespace-nowrap leading-none ${active ? 'text-violet-700' : done ? 'text-slate-600' : 'text-slate-400'}`}>{step.title}</p>
              <p className={`text-[10px] mt-0.5 whitespace-nowrap ${active ? 'text-violet-400' : 'text-slate-300'}`}>{step.sub}</p>
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-2" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 — Básicos ─────────────────────────────────────────────────────────
function Step1({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName]           = useState('');
  const [jobTitle, setJobTitle]   = useState('');
  const [area, setArea]           = useState('Tecnología');
  const [seniority, setSeniority] = useState('Sr');
  const [budget, setBudget]       = useState('');
  const [error, setError]         = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => processesApi.create({ name: name.trim(), job_title: jobTitle.trim(), area, seniority, budget_max_usd: budget ? parseFloat(budget) : 0 }),
    onSuccess: (res) => onCreated(res.data.process_id),
    onError: (err: unknown) => { const e = err as { response?: { data?: { detail?: string } } }; setError(e?.response?.data?.detail ?? 'Error al crear el proceso.'); },
  });

  return (
    <div className="space-y-5">
      {/* Section */}
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
      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
      <div className="flex justify-between pt-2 border-t border-slate-100">
        <Link href="/hiring-processes"><Button variant="ghost" className="text-slate-500">Cancelar</Button></Link>
        <Button onClick={() => { setError(''); if (!name.trim() || !jobTitle.trim()) { setError('Nombre y cargo son obligatorios.'); return; } mutate(); }} loading={isPending}>
          Siguiente <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2 — Job Description ─────────────────────────────────────────────────
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
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex border border-slate-200 rounded overflow-hidden self-start w-fit">
        {(['file', 'text'] as JDMode[]).map((m) => (
          <button key={m} onClick={() => { setMode(m); setError(''); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors ${mode === m ? 'bg-violet-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
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
              className="w-full border-2 border-dashed border-slate-200 rounded p-8 flex flex-col items-center gap-3 hover:border-violet-300 hover:bg-violet-50 transition-colors">
              <Paperclip className="w-8 h-8 text-slate-300" />
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">Haz clic para seleccionar el archivo</p>
                <p className="text-xs text-slate-400 mt-1">PDF, DOCX o TXT · máx. 10 MB</p>
              </div>
            </button>
          ) : (
            <div className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded px-4 py-3">
              <div className="flex items-center gap-3">
                <Paperclip className="w-4 h-4 text-violet-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{jdFile.name}</p>
                  <p className="text-xs text-slate-500">{(jdFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={() => { setJdFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      {mode === 'text' && (
        <textarea rows={10} value={rawText} onChange={(e) => setRawText(e.target.value)}
          placeholder="Pega aquí el texto completo del Job Description..."
          className="w-full border border-slate-200 rounded p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 resize-none transition-colors" />
      )}

      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}

      <div className="flex justify-between pt-2 border-t border-slate-100">
        <Button variant="ghost" className="text-slate-400 text-xs" onClick={onSkip}>Omitir por ahora</Button>
        <Button onClick={() => { setError(''); if (mode === 'file' && jdFile) { fileMutation.mutate(); return; } if (mode === 'text' && rawText.trim()) { textMutation.mutate(); return; } setError('Debes subir un archivo o escribir el texto del JD.'); }} loading={isPending} disabled={!canSave}>
          Guardar JD <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3 — Subir CVs ───────────────────────────────────────────────────────
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
    <div className="space-y-4">
      <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
        className={`border-2 border-dashed rounded p-8 text-center transition-colors ${dragging ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'}`}>
        <Upload className="w-9 h-9 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-700 mb-1">Arrastra los PDFs aquí</p>
        <p className="text-xs text-slate-400 mb-4">o haz clic para seleccionar archivos</p>
        <label className="cursor-pointer inline-block px-4 py-1.5 bg-violet-600 text-white rounded text-xs font-semibold hover:bg-violet-700 transition-colors">
          Seleccionar CVs
          <input type="file" accept=".pdf" multiple className="hidden" onChange={(e) => { if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]); }} />
        </label>
      </div>

      {files.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-700 border-b border-slate-100 pb-2 mb-2">{files.length} archivo(s) seleccionado(s)</p>
          <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-700 truncate max-w-[260px]">{f.name}</span>
                </div>
                <button onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}

      <div className="flex justify-between pt-2 border-t border-slate-100">
        <Button variant="ghost" className="text-slate-400 text-xs" onClick={onDone}>Ir al proceso →</Button>
        <Button onClick={() => mutate()} loading={isPending} disabled={files.length === 0}>
          <Upload className="w-3.5 h-3.5" /> Subir {files.length > 0 ? `${files.length} CV(s)` : 'CVs'}
        </Button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function NewProcessPage() {
  const router = useRouter();
  const [step, setStep]           = useState(0);
  const [processId, setProcessId] = useState<string | null>(null);

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="mb-5">
        <Link href="/hiring-processes" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors mb-3 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a procesos
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Nuevo proceso de selección</h1>
        <p className="text-xs text-slate-400 mt-1">Paso {step + 1} de {STEPS.length} — {STEPS[step].title}</p>
      </div>

      {/* Stepper — banda blanca */}
      <div className="bg-white border-y border-slate-200 mb-5">
        <Stepper current={step} />
      </div>

      {/* Contenido del paso — banda blanca sin caja */}
      <div className="bg-white border-y border-slate-200 px-6 py-5">
        {step === 0 && <Step1 onCreated={(id) => { setProcessId(id); setStep(1); }} />}
        {step === 1 && processId && <Step2 processId={processId} onNext={() => setStep(2)} onSkip={() => setStep(2)} />}
        {step === 2 && processId && <Step3 processId={processId} onDone={() => router.push(`/hiring-processes/${processId}`)} />}
      </div>
    </div>
  );
}
