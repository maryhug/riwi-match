'use client';

import { useState, useCallback } from 'react';
import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Upload, BarChart2, Phone,
  CheckCircle2, Circle, ChevronRight, Sparkles,
  AlertTriangle, RefreshCw, Users,
} from 'lucide-react';
import { processesApi } from '@/lib/api';
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
                done ? 'bg-violet-600 border-violet-600' :
                active ? 'border-violet-600 bg-white' :
                'border-slate-300 bg-white'
              }`}>
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <Icon className={`w-4 h-4 ${active ? 'text-violet-600' : 'text-slate-400'}`} />
                )}
              </div>
              <span className={`text-xs font-medium hidden sm:block whitespace-nowrap ${
                active ? 'text-violet-600' : done ? 'text-slate-600' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 mb-4 ${done ? 'bg-violet-600' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 0: Job Description ─────────────────────────────────────────────────
function JDStep({ processId }: { processId: string }) {
  const qc = useQueryClient();
  const [rawText, setRawText] = useState('');
  const [structuredJD, setStructuredJD] = useState<StructuredJD | null>(null);
  const [editMode, setEditMode] = useState(false);

  const { data: existingJD } = useQuery({
    queryKey: ['jd', processId],
    queryFn: () => processesApi.getJD(processId).then((r) => r.data).catch(() => null),
  });

  const parseMutation = useMutation({
    mutationFn: () => processesApi.parseJD(processId, rawText),
    onSuccess: (res) => setStructuredJD(res.data.structured_jd),
  });

  const saveMutation = useMutation({
    mutationFn: () => processesApi.saveJD(processId, structuredJD!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hiring-processes'] });
      qc.invalidateQueries({ queryKey: ['process', processId] });
    },
  });

  const jd = structuredJD ?? existingJD?.structured_jd;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            Parsear Job Description con IA
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Pega el texto crudo de la vacante y la IA lo estructurará automáticamente
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
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
          >
            <Sparkles className="w-4 h-4" />
            Analizar con IA
          </Button>
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
              color="text-emerald-700"
              bg="bg-emerald-50"
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
              color="text-red-700"
              bg="bg-red-50"
              items={jd.deal_breakers}
              editMode={editMode}
              onChange={(items) => setStructuredJD((prev) => ({ ...prev!, deal_breakers: items }))}
            />
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => saveMutation.mutate()}
                loading={saveMutation.isPending}
                disabled={!jd}
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
            <Upload className="w-4 h-4 text-violet-500" />
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
              dragging ? 'border-violet-400 bg-violet-50' : 'border-slate-300 hover:border-violet-300 hover:bg-slate-50'
            }`}
          >
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="font-medium text-slate-700 mb-1">
              Arrastra y suelta los PDFs aquí
            </p>
            <p className="text-sm text-slate-500 mb-4">o haz clic para seleccionar archivos</p>
            <label className="cursor-pointer">
              <span className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">
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
                      className="text-slate-400 hover:text-red-500 text-xs"
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
            <BarChart2 className="w-4 h-4 text-violet-500" />
            Ejecutar Match
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Evalúa todos los CVs cargados contra el Job Description con IA
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
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
        <Link href={`/hiring-processes/${processId}/candidates`}>
          <Button>
            <Users className="w-4 h-4" />
            Ver Kanban completo
          </Button>
        </Link>
      </div>
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Accede al Kanban para ver el ranking completo</p>
        <p className="text-sm text-slate-400 mt-1">
          Los candidatos están agrupados por categoría HIGH / MEDIUM / LOW
        </p>
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
    COMPLETED: 'text-emerald-700 bg-emerald-100',
    FAILED: 'text-red-700 bg-red-100',
    NO_ANSWER: 'text-amber-700 bg-amber-100',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-violet-500" />
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
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
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
                    <span className="text-xs font-semibold text-violet-700">
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
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!process) return <div className="text-slate-500">Proceso no encontrado</div>;

  const currentStep = getProcessStep(process.status);

  return (
    <div className="max-w-3xl">
      <Header title={process.name} subtitle={`${process.job_title} · ${process.area} · ${process.seniority}`}>
        <Link href="/hiring-processes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </Link>
      </Header>

      {/* Process info bar */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-xl border border-slate-200">
        <StatusBadge status={process.status} />
        <span className="text-sm text-slate-500">
          Presupuesto máx: <strong className="text-slate-800">{formatCurrency(process.budget_max_usd)}</strong>
        </span>
        <div className="ml-auto">
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
