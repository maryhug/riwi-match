'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, FileText, Upload, BarChart2,
  ChevronRight, Sparkles, X, Paperclip,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Input, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { processesApi } from '@/lib/api';

// ─── Constants ─────────────────────────────────────────────────────────────────

const SENIORITY_OPTIONS = [
  { value: 'Jr',      label: 'Jr' },
  { value: 'Ssr',     label: 'Ssr' },
  { value: 'Sr',      label: 'Sr' },
  { value: 'Lead',    label: 'Lead' },
  { value: 'Manager', label: 'Manager' },
];

const AREA_OPTIONS = [
  { value: 'Tecnología', label: 'Tecnología' },
  { value: 'Producto',   label: 'Producto' },
  { value: 'Diseño',     label: 'Diseño' },
  { value: 'Datos',      label: 'Datos' },
  { value: 'Ventas',     label: 'Ventas' },
  { value: 'Marketing',  label: 'Marketing' },
  { value: 'Personas',   label: 'Personas' },
  { value: 'Comercial',  label: 'Comercial' },
];

const STEPS = [
  { icon: FileText,  label: 'Datos básicos',    sub: 'Nombre, cargo y área' },
  { icon: Sparkles,  label: 'Job Description',  sub: 'Describe la vacante' },
  { icon: Upload,    label: 'Subir CVs',        sub: 'Carga los candidatos' },
];

// ─── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10 px-2">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center flex-1">
            <div className={`flex flex-col items-center gap-1.5 ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                done   ? 'bg-primary-dark border-primary-dark' :
                active ? 'border-primary-dark bg-white shadow-[0_0_0_4px] shadow-primary/20' :
                         'border-slate-200 bg-white'
              }`}>
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <Icon className={`w-4.5 h-4.5 ${active ? 'text-primary-dark' : 'text-slate-300'}`} />
                )}
              </div>
              <div className="text-center hidden sm:block">
                <p className={`text-xs font-semibold whitespace-nowrap ${
                  active ? 'text-primary-dark' : done ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {step.label}
                </p>
                <p className={`text-[10px] whitespace-nowrap ${active ? 'text-primary/70' : 'text-slate-300'}`}>
                  {step.sub}
                </p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-3 mb-6 ${done ? 'bg-primary-dark' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 — Datos básicos ────────────────────────────────────────────────────

function Step1({
  onCreated,
}: {
  onCreated: (processId: string) => void;
}) {
  const [name,     setName]     = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [area,     setArea]     = useState('Tecnología');
  const [seniority,setSeniority]= useState('Sr');
  const [budget,   setBudget]   = useState('');
  const [error,    setError]    = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      processesApi.create({
        name:           name.trim(),
        job_title:      jobTitle.trim(),
        area,
        seniority,
        budget_max_usd: budget ? parseFloat(budget) : 0,
      }),
    onSuccess: (res) => onCreated(res.data.process_id),
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail ?? 'Error al crear el proceso.');
    },
  });

  const handleNext = () => {
    setError('');
    if (!name.trim() || !jobTitle.trim()) {
      setError('Nombre del proceso y cargo son obligatorios.');
      return;
    }
    mutate();
  };

  return (
    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
      <CardContent className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="NOMBRE DEL PROCESO"
            placeholder="Ej. Backend Node Sr"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="CARGO"
            placeholder="Ej. Desarrollador Backend"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select label="ÁREA" value={area} onChange={(e) => setArea(e.target.value)} options={AREA_OPTIONS} />
          <Select label="SENIORITY" value={seniority} onChange={(e) => setSeniority(e.target.value)} options={SENIORITY_OPTIONS} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="PRESUPUESTO MÁXIMO USD (opcional)"
            type="number"
            placeholder="Ej. 500"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        )}
        <div className="flex justify-between pt-2">
          <Link href="/hiring-processes">
            <Button variant="ghost" className="text-slate-500">Cancelar</Button>
          </Link>
          <Button onClick={handleNext} loading={isPending}>
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Step 2 — Job Description ──────────────────────────────────────────────────

type JDMode = 'file' | 'text';

function Step2({
  processId,
  onNext,
  onSkip,
}: {
  processId: string;
  onNext: () => void;
  onSkip: () => void;
}) {
  const [mode,    setMode]    = useState<JDMode>('file');
  const [rawText, setRawText] = useState('');
  const [jdFile,  setJdFile]  = useState<File | null>(null);
  const [error,   setError]   = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileMutation = useMutation({
    mutationFn: () => processesApi.uploadJDFile(processId, jdFile!),
    onSuccess: onNext,
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail ?? 'Error al subir el archivo.');
    },
  });

  const textMutation = useMutation({
    mutationFn: () => processesApi.saveJD(processId, rawText),
    onSuccess: onNext,
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail ?? 'Error al guardar la JD.');
    },
  });

  const isPending = fileMutation.isPending || textMutation.isPending;

  const handleSave = () => {
    setError('');
    if (mode === 'file' && jdFile) { fileMutation.mutate(); return; }
    if (mode === 'text' && rawText.trim()) { textMutation.mutate(); return; }
    setError('Debes subir un archivo o escribir el texto del JD.');
  };

  const canSave = mode === 'file' ? !!jdFile : rawText.trim().length > 0;

  return (
    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
      <CardHeader>
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Job Description
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Sube el archivo PDF/DOCX o pega el texto directamente.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Mode toggle */}
        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
          {(['file', 'text'] as JDMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-primary-dark text-white'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {m === 'file' ? <Paperclip className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              {m === 'file' ? 'Subir archivo' : 'Pegar texto'}
            </button>
          ))}
        </div>

        {/* File upload */}
        {mode === 'file' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setJdFile(f); setError(''); }
              }}
            />
            {!jdFile ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center gap-3 hover:border-primary-light hover:bg-primary-xlight/50 transition-colors text-slate-400"
              >
                <Paperclip className="w-10 h-10" />
                <div className="text-center">
                  <p className="font-medium text-slate-700">Haz clic para seleccionar el archivo</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOCX o TXT · máx. 10 MB</p>
                </div>
              </button>
            ) : (
              <div className="flex items-center justify-between bg-primary-xlight border border-primary-light rounded-xl px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-dark/10 rounded-lg flex items-center justify-center">
                    <Paperclip className="w-5 h-5 text-primary-dark" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{jdFile.name}</p>
                    <p className="text-xs text-slate-500">{(jdFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={() => { setJdFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
              El texto se extrae automáticamente del archivo y queda disponible para el match con IA.
            </p>
          </div>
        )}

        {/* Text paste */}
        {mode === 'text' && (
          <textarea
            rows={10}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Pega aquí el texto completo del Job Description..."
            className="w-full border border-slate-200 rounded-xl p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex justify-between">
          <Button variant="ghost" className="text-slate-400 text-sm" onClick={onSkip}>
            Omitir por ahora
          </Button>
          <Button onClick={handleSave} loading={isPending} disabled={!canSave}>
            Guardar JD
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Step 3 — Subir CVs ───────────────────────────────────────────────────────

function Step3({
  processId,
  onDone,
}: {
  processId: string;
  onDone: () => void;
}) {
  const [files,   setFiles]   = useState<File[]>([]);
  const [dragging,setDragging]= useState(false);
  const [error,   setError]   = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => processesApi.uploadCandidates(processId, files),
    onSuccess: onDone,
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail ?? 'Error al subir los CVs.');
    },
  });

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const pdfs = Array.from(e.dataTransfer.files).filter((f) => f.type === 'application/pdf');
    setFiles((prev) => [...prev, ...pdfs]);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  return (
    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
      <CardHeader>
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" />
          Carga masiva de CVs
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Sube los CVs en PDF. Se procesarán de forma asíncrona con IA.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
            dragging
              ? 'border-primary bg-primary-xlight'
              : 'border-slate-200 hover:border-primary-light hover:bg-slate-50'
          }`}
        >
          <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-slate-700 mb-1">Arrastra los PDFs aquí</p>
          <p className="text-sm text-slate-400 mb-4">o haz clic para seleccionar archivos</p>
          <label className="cursor-pointer inline-block px-4 py-2 bg-primary-dark text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Seleccionar CVs
            <input type="file" accept=".pdf" multiple className="hidden" onChange={onFileChange} />
          </label>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">{files.length} archivo(s) seleccionado(s)</p>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-700 truncate max-w-[260px]">{f.name}</span>
                  </div>
                  <button onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex justify-between pt-2">
          <Button variant="ghost" className="text-slate-400 text-sm" onClick={onDone}>
            Ir al proceso →
          </Button>
          <Button
            onClick={() => mutate()}
            loading={isPending}
            disabled={files.length === 0}
          >
            <Upload className="w-4 h-4" />
            Subir {files.length > 0 ? `${files.length} CV(s)` : 'CVs'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function NewProcessPage() {
  const router = useRouter();
  const [step,      setStep]      = useState(0);
  const [processId, setProcessId] = useState<string | null>(null);

  const goToProcess = () => router.push(`/hiring-processes/${processId}`);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="pt-4 pb-2">
        <Link href="/hiring-processes" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-5 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Volver a procesos
        </Link>
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>Nuevo proceso de selección</h1>
          <p className="text-sm text-slate-500 mt-1">
            Paso {step + 1} de {STEPS.length} — {STEPS[step].label}
          </p>
        </div>
      </div>

      <Stepper current={step} />

      {step === 0 && (
        <Step1
          onCreated={(id) => {
            setProcessId(id);
            setStep(1);
          }}
        />
      )}

      {step === 1 && processId && (
        <Step2
          processId={processId}
          onNext={() => setStep(2)}
          onSkip={() => setStep(2)}
        />
      )}

      {step === 2 && processId && (
        <Step3
          processId={processId}
          onDone={goToProcess}
        />
      )}

      {/* Checkmark al completar */}
      {step === 2 && processId && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <BarChart2 className="w-3.5 h-3.5" />
            Al subir los CVs podrás ejecutar el match desde el proceso
          </div>
        </div>
      )}
    </div>
  );
}
