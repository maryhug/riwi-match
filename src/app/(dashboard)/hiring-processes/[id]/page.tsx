'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Upload, BarChart2, Phone,
  CheckCircle2, ChevronRight, Sparkles,
  AlertTriangle, RefreshCw, Users, Paperclip, ExternalLink, X,
} from 'lucide-react';
import { processesApi } from '@/lib/api';
import type { JobDescription } from '@/lib/types';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import Header from '@/components/layout/Header';
import { formatCurrency, getProcessStep } from '@/lib/utils';
import type { StructuredJD } from '@/lib/types';

const STEPS = [
  { label: 'Job Description' },
  { label: 'Subir CVs' },
  { label: 'Match & Ranking' },
  { label: 'Profiling de Voz' },
];

// ─── Stepper — tab style, sin círculos ────────────────────────────────────────
function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex border-b border-slate-200 mb-6">
      {STEPS.map((step, i) => {
        const done   = i < currentStep;
        const active = i === currentStep;
        return (
          <div
            key={i}
            className="flex items-center gap-2 px-5 py-3 relative"
            style={{ borderBottom: active ? '2px solid #7C3AED' : '2px solid transparent', marginBottom: -1 }}
          >
            <span
              className={`flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded ${
                done   ? 'bg-violet-600 text-white' :
                active ? 'bg-violet-100 text-violet-700' :
                         'bg-slate-100 text-slate-400'
              }`}
            >
              {done ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
            </span>
            <span className={`text-xs font-medium whitespace-nowrap ${
              active ? 'text-violet-700' : done ? 'text-slate-600' : 'text-slate-400'
            }`}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-2" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section title helper ─────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title, action }: { icon?: React.ElementType; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {action}
    </div>
  );
}

// ─── File attachment banner ───────────────────────────────────────────────────
function JDFileBanner({ filename, fileUrl }: { filename: string; fileUrl: string }) {
  return (
    <div className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded px-4 py-3 mb-4">
      <div className="flex items-center gap-3">
        <Paperclip className="w-4 h-4 text-violet-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-900">{filename}</p>
          <p className="text-xs text-slate-500">Archivo adjunto al JD</p>
        </div>
      </div>
      <a href={fileUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
        <ExternalLink className="w-3.5 h-3.5" />
        Ver / descargar
      </a>
    </div>
  );
}

// ─── Step 0: Job Description ─────────────────────────────────────────────────
function JDStep({ processId }: { processId: string }) {
  const qc = useQueryClient();
  const [rawText, setRawText] = useState('');
  const [structuredJD, setStructuredJD] = useState<StructuredJD | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: existingJD } = useQuery({
    queryKey: ['jd', processId],
    queryFn: () => processesApi.getJD(processId).then((r) => r.data as (JobDescription & { jd_file_url?: string | null; original_filename?: string | null }) | null).catch(() => null),
  });

  useEffect(() => {
    if (existingJD?.jd_raw_text && !rawText) setRawText(existingJD.jd_raw_text);
  }, [existingJD]);

  const parseMutation   = useMutation({ mutationFn: () => processesApi.parseJD(processId, rawText), onSuccess: (res) => setStructuredJD(res.data.structured_jd) });
  const saveMutation    = useMutation({ mutationFn: () => processesApi.saveJD(processId, rawText), onSuccess: () => { qc.invalidateQueries({ queryKey: ['hiring-processes'] }); qc.invalidateQueries({ queryKey: ['process', processId] }); qc.invalidateQueries({ queryKey: ['jd', processId] }); } });
  const uploadFileMutation = useMutation({ mutationFn: () => processesApi.uploadJDFile(processId, jdFile!), onSuccess: () => { qc.invalidateQueries({ queryKey: ['jd', processId] }); qc.invalidateQueries({ queryKey: ['process', processId] }); setJdFile(null); } });

  const jd = structuredJD ?? existingJD?.structured_jd;
  const fileDownloadUrl = processesApi.getJDFileUrl(processId);

  const modeToggle = (
    <div className="flex border border-slate-200 rounded overflow-hidden">
      {(['file', 'text'] as const).map((m) => (
        <button key={m} onClick={() => setUploadMode(m)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${uploadMode === m ? 'bg-violet-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
          {m === 'file' ? <Paperclip className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
          {m === 'file' ? 'Subir archivo' : 'Pegar texto'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      {existingJD?.jd_file_url && <JDFileBanner filename={existingJD.original_filename ?? 'job_description.pdf'} fileUrl={fileDownloadUrl} />}

      <div className="bg-white border border-slate-200 rounded p-5">
        <SectionTitle icon={Sparkles} title="Job Description" action={modeToggle} />

        {uploadMode === 'file' && (
          <div className="space-y-4">
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setJdFile(f); }} />
            {!jdFile ? (
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded p-7 flex flex-col items-center gap-3 hover:border-violet-300 hover:bg-violet-50 transition-colors">
                <Paperclip className="w-8 h-8 text-slate-300" />
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">Haz clic para seleccionar el archivo</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOCX o TXT · máx. 10 MB</p>
                </div>
              </button>
            ) : (
              <div className="flex items-center justify-between bg-slate-50 rounded px-4 py-3 border border-slate-200">
                <div className="flex items-center gap-3">
                  <Paperclip className="w-4 h-4 text-violet-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{jdFile.name}</p>
                    <p className="text-xs text-slate-400">{(jdFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={() => setJdFile(null)} className="text-slate-300 hover:text-red-400"><X className="w-4 h-4" /></button>
              </div>
            )}
            <Button onClick={() => uploadFileMutation.mutate()} loading={uploadFileMutation.isPending} disabled={!jdFile} className="w-full">
              <Paperclip className="w-3.5 h-3.5" />
              {existingJD?.jd_file_url ? 'Reemplazar archivo' : 'Subir archivo JD'}
            </Button>
            {uploadFileMutation.isSuccess && <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded">Archivo subido. El texto se extrajo automáticamente.</p>}
          </div>
        )}

        {uploadMode === 'text' && (
          <div className="space-y-4">
            <Textarea label="Texto del Job Description" placeholder="Pega aquí el texto completo del Job Description..." rows={8}
              value={rawText} onChange={(e) => setRawText(e.target.value)} />
            <Button onClick={() => parseMutation.mutate()} loading={parseMutation.isPending} disabled={!rawText.trim()} variant="outline">
              <Sparkles className="w-3.5 h-3.5" />
              Analizar con IA
            </Button>
          </div>
        )}
      </div>

      {jd && (
        <div className="bg-white border border-slate-200 rounded p-5">
          <SectionTitle title="JD Estructurado" action={
            <Button variant="ghost" size="sm" onClick={() => setEditMode(!editMode)}>{editMode ? 'Vista' : 'Editar'}</Button>
          } />
          <div className="space-y-4">
            <JDSection title="Must-Have" colorClass="text-emerald-700" bgClass="bg-emerald-50" items={jd.must_have} editMode={editMode}
              onChange={(items) => setStructuredJD((prev) => ({ ...prev!, must_have: items }))} />
            <JDSection title="Nice-to-Have" colorClass="text-blue-700" bgClass="bg-blue-50" items={jd.nice_to_have} editMode={editMode}
              onChange={(items) => setStructuredJD((prev) => ({ ...prev!, nice_to_have: items }))} />
            <JDSection title="Deal-Breakers" colorClass="text-red-700" bgClass="bg-red-50" items={jd.deal_breakers} editMode={editMode}
              onChange={(items) => setStructuredJD((prev) => ({ ...prev!, deal_breakers: items }))} />
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} disabled={!rawText.trim()}>
                <CheckCircle2 className="w-4 h-4" />
                Confirmar y guardar JD
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function JDSection({ title, colorClass, bgClass, items, editMode, onChange }: {
  title: string; colorClass: string; bgClass: string; items: string[]; editMode: boolean; onChange: (items: string[]) => void;
}) {
  return (
    <div>
      <p className={`text-xs font-semibold mb-2 ${colorClass}`}>{title}</p>
      <div className={`rounded p-3 ${bgClass} space-y-1.5`}>
        {items.map((item, i) =>
          editMode ? (
            <input key={i} value={item} onChange={(e) => { const next = [...items]; next[i] = e.target.value; onChange(next); }}
              className="w-full bg-transparent text-sm border-b border-current/20 focus:outline-none py-0.5" />
          ) : (
            <div key={i} className="flex items-start gap-2 text-sm">
              <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" />
              {item}
            </div>
          )
        )}
        {editMode && <button onClick={() => onChange([...items, ''])} className={`text-xs font-medium ${colorClass} hover:opacity-70 mt-1`}>+ Agregar</button>}
      </div>
    </div>
  );
}

// ─── Step 1: Upload CVs ───────────────────────────────────────────────────────
function UploadCVsStep({ processId }: { processId: string }) {
  const qc = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: () => processesApi.uploadCandidates(processId, files),
    onSuccess: (res) => { alert(`${res.data.queued} CVs encolados para procesamiento.`); setFiles([]); qc.invalidateQueries({ queryKey: ['process', processId] }); },
  });
  const matchMutation = useMutation({
    mutationFn: () => processesApi.startMatch(processId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['process', processId] }); },
  });

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type === 'application/pdf');
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded p-5">
        <SectionTitle icon={Upload} title="Carga masiva de CVs" />
        <p className="text-xs text-slate-500 mb-4">Sube los CVs en PDF. Se procesarán de forma asíncrona con IA.</p>
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
          className={`border-2 border-dashed rounded p-8 text-center transition-colors ${dragging ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'}`}>
          <Upload className="w-9 h-9 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700 mb-1">Arrastra y suelta los PDFs aquí</p>
          <p className="text-xs text-slate-500 mb-4">o haz clic para seleccionar archivos</p>
          <label className="cursor-pointer">
            <span className="px-4 py-1.5 bg-violet-600 text-white rounded text-xs font-semibold hover:bg-violet-700 transition-colors">Seleccionar CVs</span>
            <input type="file" accept=".pdf" multiple className="hidden" onChange={(e) => { if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]); }} />
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-slate-700 border-b border-slate-100 pb-2">{files.length} archivo(s) seleccionado(s)</p>
            <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-700 truncate max-w-[240px]">{f.name}</span>
                  </div>
                  <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
            <Button onClick={() => uploadMutation.mutate()} loading={uploadMutation.isPending} className="w-full mt-2">
              <Upload className="w-3.5 h-3.5" /> Subir {files.length} CV(s)
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded p-5">
        <SectionTitle icon={BarChart2} title="Ejecutar Match" />
        <p className="text-xs text-slate-500 mb-4">Evalúa todos los CVs cargados contra el Job Description con IA</p>
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">Asegúrate de haber subido todos los CVs antes de ejecutar el match.</p>
        </div>
        <Button onClick={() => matchMutation.mutate()} loading={matchMutation.isPending}>
          <Sparkles className="w-3.5 h-3.5" /> Ejecutar Match con IA
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: Match Results ────────────────────────────────────────────────────
function MatchStep({ processId }: { processId: string }) {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded p-5">
        <SectionTitle icon={BarChart2} title="Resultados del Match" />
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/hiring-processes/${processId}/ranking`}>
            <div className="p-5 text-center border border-slate-200 rounded hover:border-violet-300 hover:bg-violet-50 transition-colors cursor-pointer">
              <BarChart2 className="w-8 h-8 text-violet-600 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-slate-800 text-sm">Ranking de candidatos</p>
              <p className="text-xs text-slate-400 mt-1">Tabla ordenada por match % con filtros</p>
            </div>
          </Link>
          <Link href={`/hiring-processes/${processId}/candidates`}>
            <div className="p-5 text-center border border-slate-200 rounded hover:border-violet-300 hover:bg-violet-50 transition-colors cursor-pointer">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-800 text-sm">Vista Kanban</p>
              <p className="text-xs text-slate-400 mt-1">Columnas por categoría: Alto / Medio / Bajo</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Profiling ────────────────────────────────────────────────────────
function ProfilingStep({ processId }: { processId: string }) {
  const qc = useQueryClient();
  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['profiling-runs', processId],
    queryFn: () => processesApi.getProfilingRuns(processId).then((r) => r.data),
    refetchInterval: 10_000,
  });

  const statusCls: Record<string, string> = {
    PENDING:   'bg-slate-100 text-slate-500',
    CALLING:   'bg-blue-50 text-blue-700',
    COMPLETED: 'bg-emerald-50 text-emerald-700',
    FAILED:    'bg-red-50 text-red-600',
    NO_ANSWER: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="bg-white border border-slate-200 rounded">
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">Estado de llamadas de profiling</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ['profiling-runs', processId] })}>
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar
        </Button>
      </div>
      <div className="divide-y divide-slate-100">
        {isLoading ? (
          <div className="py-8 flex justify-center"><div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : runs.length === 0 ? (
          <div className="py-10 text-center">
            <Phone className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Selecciona candidatos finalistas en el Kanban para iniciar las llamadas</p>
            <Link href={`/hiring-processes/${processId}/candidates`} className="mt-3 inline-block">
              <Button size="sm" variant="outline">Ir al Kanban</Button>
            </Link>
          </div>
        ) : (
          runs.map((run) => (
            <div key={run.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{run.candidate?.name} {run.candidate?.last_name}</p>
                <p className="text-xs text-slate-400">{run.call_attempts} intento(s)</p>
              </div>
              <div className="flex items-center gap-3">
                {run.advancement_prob && <span className="text-xs font-semibold text-violet-700">Prob: {run.advancement_prob}</span>}
                <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${statusCls[run.status] ?? 'bg-slate-100 text-slate-500'}`}>{run.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProcessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: process, isLoading } = useQuery({
    queryKey: ['process', id],
    queryFn: () => processesApi.get(id).then((r) => r.data),
    refetchInterval: 15_000,
  });

  if (isLoading) return <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!process) return <div className="text-slate-500 text-sm">Proceso no encontrado</div>;

  const currentStep = getProcessStep(process.status);

  return (
    <div>
      <Header title={process.name} subtitle={`${process.job_title} · ${process.area} · ${process.seniority}`}>
        <Link href="/hiring-processes"><Button variant="outline" size="sm"><ArrowLeft className="w-3.5 h-3.5" />Volver</Button></Link>
      </Header>

      {/* Info bar */}
      <div className="flex items-center gap-4 mb-5 px-4 py-3 bg-white border border-slate-200 rounded">
        <StatusBadge status={process.status} />
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex-1 max-w-xs">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-violet-700 font-medium">Consumo IA: {formatCurrency(process.budget_max_usd * 0.45)}</span>
            <span className="text-slate-400">Máx {formatCurrency(process.budget_max_usd)}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
            <div className="bg-violet-600 h-full rounded-full" style={{ width: '45%' }} />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href={`/hiring-processes/${id}/ranking`}>
            <Button variant="outline" size="sm"><BarChart2 className="w-3.5 h-3.5" />Ranking</Button>
          </Link>
          <Link href={`/hiring-processes/${id}/candidates`}>
            <Button variant="outline" size="sm"><Users className="w-3.5 h-3.5" />Kanban</Button>
          </Link>
        </div>
      </div>

      <Stepper currentStep={currentStep} />

      {currentStep === 0 && <JDStep processId={id} />}
      {currentStep === 1 && <UploadCVsStep processId={id} />}
      {currentStep === 2 && <MatchStep processId={id} />}
      {currentStep === 3 && <ProfilingStep processId={id} />}
    </div>
  );
}
