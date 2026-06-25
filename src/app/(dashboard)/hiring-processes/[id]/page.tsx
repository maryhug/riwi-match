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
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import Header from '@/components/layout/Header';
import { formatCurrency, getProcessStep } from '@/lib/utils';
import type { StructuredJD } from '@/lib/types';

const STEPS = [
  { icon: FileText, label: 'Job Description' },
  { icon: Upload, label: 'Subir CVs' },
  { icon: BarChart2, label: 'Match & Ranking' },
  { icon: Phone, label: 'Profiling de Voz' },
];

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={i} className="flex items-center flex-1">
            <div className={`flex flex-col items-center gap-1 ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                done ? 'bg-primary-dark border-primary-dark' :
                active ? 'border-primary-dark bg-white' :
                'border-slate-300 bg-white'
              }`}>
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <Icon className={`w-4 h-4 ${active ? 'text-primary-dark' : 'text-slate-400'}`} />
                )}
              </div>
              <span className={`text-xs font-medium hidden sm:block whitespace-nowrap ${
                active ? 'text-primary-dark' : done ? 'text-slate-600' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 mb-4 ${done ? 'bg-primary-dark' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── File attachment banner ───────────────────────────────────────────────────
function JDFileBanner({
  filename,
  fileUrl,
  onRemove,
}: {
  filename: string;
  fileUrl: string;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center justify-between bg-primary-xlight border border-primary-light rounded-xl px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-dark/10 rounded-lg flex items-center justify-center shrink-0">
          <Paperclip className="w-5 h-5 text-primary-dark" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{filename}</p>
          <p className="text-xs text-slate-500">Archivo adjunto al JD · acceso con sesión</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-dark text-white text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ver / descargar
        </a>
        {onRemove && (
          <button onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
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

  // Pre-popula el textarea con la JD existente al cargar
  useEffect(() => {
    if (existingJD?.jd_raw_text && !rawText) setRawText(existingJD.jd_raw_text);
  }, [existingJD]);

  const parseMutation = useMutation({
    mutationFn: () => processesApi.parseJD(processId, rawText),
    onSuccess: (res) => setStructuredJD(res.data.structured_jd),
  });

  const saveMutation = useMutation({
    mutationFn: () => processesApi.saveJD(processId, rawText),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hiring-processes'] });
      qc.invalidateQueries({ queryKey: ['process', processId] });
      qc.invalidateQueries({ queryKey: ['jd', processId] });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: () => processesApi.uploadJDFile(processId, jdFile!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jd', processId] });
      qc.invalidateQueries({ queryKey: ['process', processId] });
      setJdFile(null);
    },
  });

  const jd = structuredJD ?? existingJD?.structured_jd;
  const fileDownloadUrl = processesApi.getJDFileUrl(processId);

  return (
    <div className="space-y-5">
      {/* Archivo adjunto existente */}
      {existingJD?.jd_file_url && (
        <JDFileBanner
          filename={existingJD.original_filename ?? 'job_description.pdf'}
          fileUrl={fileDownloadUrl}
        />
      )}

      {/* Subir nuevo archivo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Job Description
            </h3>
            {/* Tab toggle */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {(['file', 'text'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setUploadMode(m)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                    uploadMode === m ? 'bg-primary-dark text-white' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {m === 'file' ? <Paperclip className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  {m === 'file' ? 'Subir archivo' : 'Pegar texto'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ─── File tab ─── */}
          {uploadMode === 'file' && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setJdFile(f); }}
              />
              {!jdFile ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-primary-light hover:bg-primary-xlight/50 transition-colors"
                >
                  <Paperclip className="w-9 h-9 text-slate-300" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">Haz clic para seleccionar el archivo</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOCX o TXT · máx. 10 MB</p>
                  </div>
                </button>
              ) : (
                <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Paperclip className="w-5 h-5 text-primary-dark" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{jdFile.name}</p>
                      <p className="text-xs text-slate-400">{(jdFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => setJdFile(null)} className="text-slate-300 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <Button
                onClick={() => uploadFileMutation.mutate()}
                loading={uploadFileMutation.isPending}
                disabled={!jdFile}
                className="w-full"
              >
                <Paperclip className="w-4 h-4" />
                {existingJD?.jd_file_url ? 'Reemplazar archivo' : 'Subir archivo JD'}
              </Button>
              {uploadFileMutation.isSuccess && (
                <p className="text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">
                  ✓ Archivo subido. El texto se extrajo automáticamente.
                </p>
              )}
            </>
          )}

          {/* ─── Text tab ─── */}
          {uploadMode === 'text' && (
            <>
              <Textarea
                label="Texto del Job Description"
                placeholder="Pega aquí el texto completo del Job Description..."
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <Button
                onClick={() => parseMutation.mutate()}
                loading={parseMutation.isPending}
                disabled={!rawText.trim()}
                variant="outline"
              >
                <Sparkles className="w-4 h-4" />
                Analizar con IA
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {jd && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">JD Estructurado</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditMode(!editMode)}>
                {editMode ? 'Vista' : 'Editar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <JDSection
              title="Must-Have"
              color="text-mint"
              bg="bg-mint-light"
              items={jd.must_have}
              editMode={editMode}
              onChange={(items) => setStructuredJD((prev) => ({ ...prev!, must_have: items }))}
            />
            <JDSection
              title="Nice-to-Have"
              color="text-blue-700"
              bg="bg-blue-50"
              items={jd.nice_to_have}
              editMode={editMode}
              onChange={(items) => setStructuredJD((prev) => ({ ...prev!, nice_to_have: items }))}
            />
            <JDSection
              title="Deal-Breakers"
              color="text-coral-dark"
              bg="bg-coral-light"
              items={jd.deal_breakers}
              editMode={editMode}
              onChange={(items) => setStructuredJD((prev) => ({ ...prev!, deal_breakers: items }))}
            />
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => saveMutation.mutate()}
                loading={saveMutation.isPending}
                disabled={!rawText.trim()}
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar y guardar JD
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function JDSection({
  title, color, bg, items, editMode, onChange,
}: {
  title: string;
  color: string;
  bg: string;
  items: string[];
  editMode: boolean;
  onChange: (items: string[]) => void;
}) {
  return (
    <div>
      <p className={`text-sm font-semibold mb-2 ${color}`}>{title}</p>
      <div className={`rounded-lg p-3 ${bg} space-y-1.5`}>
        {items.map((item, i) =>
          editMode ? (
            <input
              key={i}
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="w-full bg-transparent text-sm border-b border-current/20 focus:outline-none py-0.5"
            />
          ) : (
            <div key={i} className="flex items-start gap-2 text-sm">
              <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" />
              {item}
            </div>
          )
        )}
        {editMode && (
          <button
            onClick={() => onChange([...items, ''])}
            className={`text-xs font-medium ${color} hover:opacity-70 mt-1`}
          >
            + Agregar
          </button>
        )}
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
    onSuccess: (res) => {
      alert(`${res.data.queued} CVs encolados para procesamiento.`);
      setFiles([]);
      qc.invalidateQueries({ queryKey: ['process', processId] });
    },
  });

  const matchMutation = useMutation({
    mutationFn: () => processesApi.startMatch(processId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['process', processId] });
    },
  });

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type === 'application/pdf');
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Carga masiva de CVs
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Sube los CVs en PDF. Se procesarán de forma asíncrona con IA.
          </p>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
              dragging ? 'border-primary bg-primary-xlight' : 'border-slate-300 hover:border-primary-light hover:bg-slate-50'
            }`}
          >
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="font-medium text-slate-700 mb-1">
              Arrastra y suelta los PDFs aquí
            </p>
            <p className="text-sm text-slate-500 mb-4">o haz clic para seleccionar archivos</p>
            <label className="cursor-pointer">
              <span className="px-4 py-2 bg-primary-dark text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
                Seleccionar CVs
              </span>
              <input
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={onFileChange}
              />
            </label>
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-slate-700">{files.length} archivo(s) seleccionado(s):</p>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700 truncate max-w-[240px]">{f.name}</span>
                    </div>
                    <button
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="text-slate-400 hover:text-coral text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => uploadMutation.mutate()}
                loading={uploadMutation.isPending}
                className="w-full mt-2"
              >
                <Upload className="w-4 h-4" />
                Subir {files.length} CV(s)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Ejecutar Match
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Evalúa todos los CVs cargados contra el Job Description con IA
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-accent-light border border-amber-200 rounded-lg mb-4">
            <AlertTriangle className="w-5 h-5 text-accent shrink-0" />
            <p className="text-sm text-amber-800">
              Asegúrate de haber subido todos los CVs antes de ejecutar el match. Este proceso puede tomar varios minutos.
            </p>
          </div>
          <Button
            onClick={() => matchMutation.mutate()}
            loading={matchMutation.isPending}
          >
            <Sparkles className="w-4 h-4" />
            Ejecutar Match con IA
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Step 2: Match Results ────────────────────────────────────────────────────
function MatchStep({ processId }: { processId: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Resultados del análisis de IA por candidato</p>
        <div className="flex items-center gap-2">
          <Link href={`/hiring-processes/${processId}/ranking`}>
            <Button>
              <BarChart2 className="w-4 h-4" />
              Ver Ranking
            </Button>
          </Link>
          <Link href={`/hiring-processes/${processId}/candidates`}>
            <Button variant="outline">
              <Users className="w-4 h-4" />
              Kanban
            </Button>
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Link href={`/hiring-processes/${processId}/ranking`} className="group">
          <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 hover:border-primary-light hover:shadow-md transition-all cursor-pointer">
            <BarChart2 className="w-10 h-10 text-primary-dark mx-auto mb-3 opacity-80" />
            <p className="font-semibold text-slate-800">Ranking de candidatos</p>
            <p className="text-sm text-slate-400 mt-1">Tabla ordenada por match % con filtros y profiling</p>
          </div>
        </Link>
        <Link href={`/hiring-processes/${processId}/candidates`} className="group">
          <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 hover:border-primary-light hover:shadow-md transition-all cursor-pointer">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-800">Vista Kanban</p>
            <p className="text-sm text-slate-400 mt-1">Columnas por categoría: Alto / Medio / Bajo</p>
          </div>
        </Link>
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

  const statusColor: Record<string, string> = {
    PENDING: 'text-slate-500 bg-slate-100',
    CALLING: 'text-blue-700 bg-blue-100',
    COMPLETED: 'text-mint bg-mint-light',
    FAILED: 'text-coral-dark bg-coral-light',
    NO_ANSWER: 'text-accent bg-accent-light',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Estado de llamadas de profiling
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => qc.invalidateQueries({ queryKey: ['profiling-runs', processId] })}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
            </div>
          ) : runs.length === 0 ? (
            <div className="py-10 text-center">
              <Phone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                Selecciona candidatos finalistas en el Kanban para iniciar las llamadas
              </p>
              <Link href={`/hiring-processes/${processId}/candidates`} className="mt-3 inline-block">
                <Button size="sm" variant="outline">Ir al Kanban</Button>
              </Link>
            </div>
          ) : (
            runs.map((run) => (
              <div key={run.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {run.candidate?.name} {run.candidate?.last_name}
                  </p>
                  <p className="text-xs text-slate-500">{run.call_attempts} intento(s)</p>
                </div>
                <div className="flex items-center gap-3">
                  {run.advancement_prob && (
                    <span className="text-xs font-semibold text-primary-dark">
                      Prob: {run.advancement_prob}
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[run.status] ?? 'text-slate-500 bg-slate-100'}`}>
                    {run.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!process) return <div className="text-slate-500">Proceso no encontrado</div>;

  const currentStep = getProcessStep(process.status);

  return (
    <div>
      <Header title={process.name} subtitle={`${process.job_title} · ${process.area} · ${process.seniority}`}>
        <Link href="/hiring-processes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </Link>
      </Header>

      {/* Process info bar */}
      <div className="flex items-center gap-6 mb-6 p-4 bg-white rounded-xl border border-slate-200">
        <StatusBadge status={process.status} />
        
        {/* Cost visualizer */}
        <div className="flex-1 max-w-sm px-6 py-1 border-x border-slate-100 flex items-center">
          <div className="w-full">
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="text-primary-dark">Consumo IA: {formatCurrency(process.budget_max_usd * 0.45)}</span>
              <span className="text-slate-500">Máx {formatCurrency(process.budget_max_usd)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all" style={{ width: '45%' }} />
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link href={`/hiring-processes/${id}/ranking`}>
            <Button variant="outline" size="sm">
              <BarChart2 className="w-4 h-4" />
              Ranking
            </Button>
          </Link>
          <Link href={`/hiring-processes/${id}/candidates`}>
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4" />
              Kanban
            </Button>
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
