'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { use } from 'react';

function withToken(url: string): string {
  const token = localStorage.getItem('access_token');
  return token ? `${url}?token=${token}` : url;
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Upload, BarChart2, Phone,
  CheckCircle2, ChevronRight, Sparkles,
  AlertTriangle, RefreshCw, Users, Paperclip, ExternalLink, X, Eye,
} from 'lucide-react';
import { processesApi, questionSetsApi } from '@/lib/api';
import type { JobDescription, HiringProcess, ProfilingRun, StructuredJD } from '@/lib/types';
import { POLL_INTERVAL_MS, profilingRunsRefetchInterval } from '@/lib/polling';
import { StatusBadge } from '@/components/ui/Badge';
import UploadCvsModal from '@/components/ui/UploadCvsModal';
import PdfPreviewModal from '@/components/ui/PdfPreviewModal';
import Button from '@/components/ui/Button';
import { Textarea, Select } from '@/components/ui/Input';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { formatCurrency, getProcessStep } from '@/lib/utils';

const STEPS = [
  { label: 'Job Description' },
  { label: 'Subir CVs' },
  { label: 'Match & Ranking' },
  { label: 'Profiling de Voz' },
];

// --- Stepper ---
function Stepper({ activeStep, maxStep, onChangeStep }: { activeStep: number; maxStep: number; onChangeStep: (step: number) => void; }) {
  return (
    <div className="flex border-b border-border mb-6 bg-surface">
      {STEPS.map((step, i) => {
        const done   = i < activeStep;
        const active = i === activeStep;
        const isSelectable = i <= maxStep;

        return (
          <button
            key={i}
            onClick={() => isSelectable && onChangeStep(i)}
            disabled={!isSelectable}
            type="button"
            className={`flex items-center gap-2 px-5 py-3 relative transition-all outline-none ${
              isSelectable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
            }`}
            style={{
              borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            <span
              className={`flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded transition-colors ${
                done   ? 'bg-primary text-white' :
                active ? 'bg-primary-light text-primary-dark' :
                         'bg-bg-subtle text-text-muted'
              }`}
            >
              {i < maxStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
            </span>
            <span className={`text-xs font-semibold whitespace-nowrap transition-colors ${
              active ? 'text-primary-dark' : isSelectable ? 'text-text hover:text-ink' : 'text-text-muted'
            }`}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5 text-border-strong ml-2" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// --- Section title helper ---
function SectionTitle({ icon: Icon, title, action }: { icon?: React.ElementType; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between pb-4 mb-5 border-b border-border">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-text-muted" />}
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      {action}
    </div>
  );
}

// --- File attachment banner ---
function JDFileBanner({ filename, fileUrl, onPreview }: { filename: string; fileUrl: string; onPreview?: () => void; }) {
  return (
    <Card className="mb-4 bg-primary-xlight border-primary-light">
      <CardContent className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Paperclip className="w-4 h-4 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-ink">{filename}</p>
            <p className="text-xs text-text-muted">Archivo adjunto al JD</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onPreview && (
            <Button variant="outline" size="sm" onClick={onPreview} className="h-8 border-primary-light hover:bg-primary-light hover:text-primary-dark text-primary-dark">
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Previsualizar
            </Button>
          )}
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors shadow-sm">
            <ExternalLink className="w-3.5 h-3.5" />
            Ver / descargar
          </a>
        </div>
      </CardContent>
    </Card>
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
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
    <div className="flex border border-border rounded-[var(--radius-sm)] overflow-hidden bg-surface">
      {(['file', 'text'] as const).map((m) => (
        <button key={m} onClick={() => setUploadMode(m)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${uploadMode === m ? 'bg-primary text-white' : 'text-text-muted hover:bg-bg-subtle hover:text-text'}`}>
          {m === 'file' ? <Paperclip className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
          {m === 'file' ? 'Subir archivo' : 'Pegar texto'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {existingJD?.jd_file_url && (
        <JDFileBanner
          filename={existingJD.original_filename ?? 'job_description.pdf'}
          fileUrl={fileDownloadUrl}
          onPreview={() => setIsPreviewOpen(true)}
        />
      )}

      {existingJD?.jd_file_url && (
        <PdfPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={existingJD.original_filename ?? 'job_description.pdf'}
          fileUrl={withToken(fileDownloadUrl)}
        />
      )}

      <Card>
        <CardContent className="p-6">
          <SectionTitle icon={Sparkles} title="Job Description" action={modeToggle} />

          {uploadMode === 'file' && (
            <div className="space-y-4">
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setJdFile(f); }} />
              {!jdFile ? (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-[var(--radius-md)] p-7 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary-xlight transition-colors">
                  <Paperclip className="w-8 h-8 text-border-strong" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-text">Haz clic para seleccionar el archivo</p>
                    <p className="text-xs text-text-muted mt-1">PDF, DOCX o TXT · máx. 10 MB</p>
                  </div>
                </button>
              ) : (
                <div className="flex items-center justify-between bg-bg-subtle rounded-[var(--radius-md)] px-4 py-3 border border-border">
                  <div className="flex items-center gap-3">
                    <Paperclip className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-ink">{jdFile.name}</p>
                      <p className="text-xs text-text-muted">{(jdFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => setJdFile(null)} className="text-text-muted hover:text-coral"><X className="w-4 h-4" /></button>
                </div>
              )}
              <Button onClick={() => uploadFileMutation.mutate()} loading={uploadFileMutation.isPending} disabled={!jdFile} className="w-full">
                <Paperclip className="w-3.5 h-3.5 mr-2" />
                {existingJD?.jd_file_url ? 'Reemplazar archivo' : 'Subir archivo JD'}
              </Button>
              {uploadFileMutation.isSuccess && <p className="text-xs text-mint-dark bg-mint-light px-3 py-2 rounded-[var(--radius-sm)] font-medium">Archivo subido. El texto se extrajo automáticamente.</p>}
            </div>
          )}

          {uploadMode === 'text' && (
            <div className="space-y-4">
              <Textarea label="Texto del Job Description" placeholder="Pega aquí el texto completo del Job Description..." rows={8}
                value={rawText} onChange={(e) => setRawText(e.target.value)} />
              <Button onClick={() => parseMutation.mutate()} loading={parseMutation.isPending} disabled={!rawText.trim()} variant="outline" className="w-full sm:w-auto">
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                Analizar con IA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {jd && (
        <Card>
          <CardContent className="p-6">
            <SectionTitle title="JD Estructurado" action={
              <Button variant="ghost" size="sm" onClick={() => setEditMode(!editMode)}>{editMode ? 'Vista' : 'Editar'}</Button>
            } />
            <div className="space-y-6">
              <JDSection title="Must-Have" colorClass="text-mint-dark" bgClass="bg-mint-light border border-mint-light" items={jd.must_have} editMode={editMode}
                onChange={(items) => setStructuredJD((prev) => ({ ...prev!, must_have: items }))} />
              <JDSection title="Nice-to-Have" colorClass="text-blue-dark" bgClass="bg-blue-light border border-blue-light" items={jd.nice_to_have} editMode={editMode}
                onChange={(items) => setStructuredJD((prev) => ({ ...prev!, nice_to_have: items }))} />
              <JDSection title="Deal-Breakers" colorClass="text-coral-dark" bgClass="bg-coral-light border border-coral" items={jd.deal_breakers} editMode={editMode}
                onChange={(items) => setStructuredJD((prev) => ({ ...prev!, deal_breakers: items }))} />
              <div className="flex justify-end pt-4 border-t border-border mt-4">
                <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} disabled={!rawText.trim()}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar y guardar JD
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function JDSection({ title, colorClass, bgClass, items, editMode, onChange }: {
  title: string; colorClass: string; bgClass: string; items: string[]; editMode: boolean; onChange: (items: string[]) => void;
}) {
  return (
    <div>
      <p className={`text-xs font-bold mb-2 uppercase tracking-wide ${colorClass}`}>{title}</p>
      <div className={`rounded-[var(--radius-md)] p-4 ${bgClass} space-y-2`}>
        {items.map((item, i) =>
          editMode ? (
            <input key={i} value={item} onChange={(e) => { const next = [...items]; next[i] = e.target.value; onChange(next); }}
              className="w-full bg-surface-raised/50 text-sm border-b border-black/10 focus:border-black/30 focus:outline-none py-1.5 px-2 rounded-sm" />
          ) : (
            <div key={i} className="flex items-start gap-2 text-sm text-ink font-medium">
              <ChevronRight className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${colorClass}`} />
              {item}
            </div>
          )
        )}
        {editMode && <button onClick={() => onChange([...items, ''])} className={`text-xs font-bold ${colorClass} hover:opacity-70 mt-2 flex items-center gap-1`}>+ Agregar</button>}
      </div>
    </div>
  );
}

// --- Step 1: Upload CVs ---
function UploadCVsStep({ processId }: { processId: string }) {
  const qc = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const uploadMutation = useMutation({
    mutationFn: () => processesApi.uploadCandidates(processId, files),
    onSuccess: (res) => {
      setSuccessCount(res.data.queued);
      setFiles([]);
      qc.invalidateQueries({ queryKey: ['process', processId] });
      qc.invalidateQueries({ queryKey: ['candidates', processId] });
      qc.invalidateQueries({ queryKey: ['kanban', processId] });
    },
  });
  const matchMutation = useMutation({
    mutationFn: () => processesApi.startMatch(processId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['process', processId] }); },
  });

  const CV_EXTS = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp'];
  const isCvAllowed = (f: File) => CV_EXTS.some((ext) => f.name.toLowerCase().endsWith(ext));

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(isCvAllowed);
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  return (
    <div className="space-y-6">
      {successCount !== null && (
        <Card className="bg-mint-light border-mint">
          <CardContent className="p-4 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-mint-dark shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-mint-dark">¡Candidatos cargados con éxito!</p>
                <p className="text-xs text-mint-dark/80 mt-1 font-medium">
                  Se han encolado <strong>{successCount} CV(s)</strong> para procesamiento. La IA los normalizará y evaluará su porcentaje de match de forma automática en pocos segundos.
                </p>
              </div>
            </div>
            <button onClick={() => setSuccessCount(null)} className="text-mint-dark/60 hover:text-mint-dark p-1 rounded-full hover:bg-mint-dark/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardContent className="p-6">
          <SectionTitle icon={Upload} title="Carga masiva de CVs" />
          <p className="text-xs text-text-muted mb-5">Sube los CVs — PDF, DOCX, JPG, PNG o WEBP. Se procesarán con IA automáticamente.</p>
          <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
            className={`border-2 border-dashed rounded-[var(--radius-md)] p-8 text-center transition-colors ${dragging ? 'border-primary bg-primary-xlight' : 'border-border hover:border-primary hover:bg-bg-subtle'}`}>
            <Upload className="w-9 h-9 text-border-strong mx-auto mb-3" />
            <p className="text-sm font-medium text-text mb-1">Arrastra los CVs aquí</p>
            <p className="text-xs text-text-muted mb-4">PDF · DOCX · JPG · PNG · WEBP · máx. 10 MB</p>
            <label className="cursor-pointer">
              <span className="px-5 py-2 bg-primary text-white rounded-[var(--radius-sm)] text-xs font-semibold hover:bg-primary-dark transition-colors shadow-sm inline-block">Seleccionar CVs</span>
              <input type="file" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp,.tiff,.bmp" multiple className="hidden" onChange={(e) => { if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!).filter(isCvAllowed)]); }} />
            </label>
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-xs font-bold text-text border-b border-border pb-2 uppercase tracking-wide">{files.length} archivo(s) seleccionado(s)</p>
              <div className="max-h-40 overflow-y-auto divide-y divide-border">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="text-xs font-medium text-ink truncate max-w-[240px]">{f.name}</span>
                    </div>
                    <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-text-muted hover:text-coral p-1 rounded-full hover:bg-coral-light transition-colors"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
              <div className="pt-3">
                <Button onClick={() => uploadMutation.mutate()} loading={uploadMutation.isPending} className="w-full sm:w-auto">
                  <Upload className="w-3.5 h-3.5 mr-2" /> Subir {files.length} CV(s)
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <SectionTitle icon={BarChart2} title="Ejecutar Match" />
          <p className="text-xs text-text-muted mb-5">Evalúa todos los CVs cargados contra el Job Description con IA</p>
          <div className="flex items-start gap-3 p-4 bg-accent-light border border-accent rounded-[var(--radius-md)] mb-5">
            <AlertTriangle className="w-5 h-5 text-accent-dark shrink-0 mt-0.5" />
            <p className="text-sm text-accent-dark font-medium">Asegúrate de haber subido todos los CVs antes de ejecutar el match.</p>
          </div>
          <Button onClick={() => matchMutation.mutate()} loading={matchMutation.isPending}>
            <Sparkles className="w-3.5 h-3.5 mr-2" /> Ejecutar Match con IA
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Step 2: Match Results ---
function MatchStep({ processId }: { processId: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <SectionTitle icon={BarChart2} title="Resultados del Match" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href={`/hiring-processes/${processId}/ranking`}>
              <div className="p-6 text-center border border-border rounded-[var(--radius-md)] hover:border-primary hover:bg-primary-xlight hover:shadow-sm transition-all cursor-pointer group">
                <BarChart2 className="w-10 h-10 text-primary mx-auto mb-3 opacity-90 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-ink text-sm">Ranking de candidatos</p>
                <p className="text-xs text-text-muted mt-1.5 font-medium">Tabla ordenada por match % con filtros</p>
              </div>
            </Link>
            <Link href={`/hiring-processes/${processId}/candidates`}>
              <div className="p-6 text-center border border-border rounded-[var(--radius-md)] hover:border-primary hover:bg-primary-xlight hover:shadow-sm transition-all cursor-pointer group">
                <Users className="w-10 h-10 text-border-strong mx-auto mb-3 group-hover:text-primary group-hover:scale-110 transition-transform" />
                <p className="font-bold text-ink text-sm">Vista Kanban</p>
                <p className="text-xs text-text-muted mt-1.5 font-medium">Columnas por categoría: Alto / Medio / Bajo</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Configuración de voz del agente ---
function VoiceConfigCard({ processId }: { processId: string }) {
  const qc = useQueryClient();
  const { data: process } = useQuery({
    queryKey: ['process', processId],
    queryFn: () => processesApi.get(processId).then((r) => r.data),
  });

  const [systemPrompt, setSystemPrompt] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (process && !initialized) {
      setSystemPrompt(process.voice_override_system_prompt ?? '');
      setFirstMessage(process.voice_override_first_message ?? '');
      setInitialized(true);
    }
  }, [process, initialized]);

  const saveMutation = useMutation({
    mutationFn: () =>
      processesApi.updateVoiceConfig(processId, {
        voice_override_system_prompt: systemPrompt.trim() || null,
        voice_override_first_message: firstMessage.trim() || null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['process', processId] }),
  });

  return (
    <Card>
      <CardContent className="p-6">
        <SectionTitle icon={Phone} title="Configuración de voz del agente" />
        <p className="text-xs text-text-muted mb-5 leading-relaxed">
          Personaliza el prompt y el saludo con el que el agente llama a los candidatos de{' '}
          <strong className="text-text">este proceso</strong>. Usa <code className="bg-bg-subtle border border-border px-1.5 py-0.5 rounded font-mono text-[10px] text-ink">{'{{candidate_name}}'}</code>{' '}
          y <code className="bg-bg-subtle border border-border px-1.5 py-0.5 rounded font-mono text-[10px] text-ink">{'{{job_title}}'}</code> para personalizar cada llamada.
          Si se deja vacío, se usa la configuración por defecto del set de preguntas.
        </p>
        <div className="space-y-4">
          <Textarea
            label="System prompt"
            placeholder="Eres un agente de voz de Riwi llamando a un candidato para..."
            rows={6}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
          <Textarea
            label="Primer saludo (first message)"
            placeholder="Hola, ¿hablo con {{candidate_name}}? Te llamo de parte de Riwi..."
            rows={2}
            value={firstMessage}
            onChange={(e) => setFirstMessage(e.target.value)}
          />
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
              Guardar configuración de voz
            </Button>
            {saveMutation.isSuccess && (
              <span className="text-xs font-bold text-mint-dark bg-mint-light px-2 py-1 rounded-[var(--radius-sm)]">Guardado</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Step 3: Profiling ---
function QuestionSetAssignmentCard({ processId, currentQuestionSetId }: { processId: string; currentQuestionSetId?: string | null }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(currentQuestionSetId ?? '');

  const { data: questionSets = [], isLoading } = useQuery({
    queryKey: ['question-sets'],
    queryFn: () => questionSetsApi.list().then((r) => r.data),
  });
  const activeSets = questionSets.filter((qs) => qs.status === 'ACTIVE');

  const saveMutation = useMutation({
    mutationFn: (questionSetId: string) => processesApi.updateQuestionSet(processId, questionSetId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['process', processId] }),
  });

  const errorDetail = (saveMutation.error as { response?: { data?: { detail?: string } } } | undefined)
    ?.response?.data?.detail;

  return (
    <Card>
      <CardContent className="p-6">
        <SectionTitle icon={CheckCircle2} title="Set de preguntas de profiling" />
        <p className="text-xs text-text-muted mb-5 leading-relaxed">
          Asocia un set de preguntas activo a este proceso (RB-003): es requisito para poder iniciar
          llamadas de profiling desde el Kanban o el Ranking.
        </p>
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="w-full sm:flex-1 sm:max-w-sm">
            <Select
              label="Set de preguntas"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={isLoading}
              options={[
                { value: '', label: isLoading ? 'Cargando...' : 'Selecciona un set activo' },
                ...activeSets.map((qs) => ({ value: qs.id, label: qs.name })),
              ]}
            />
          </div>
          <Button
            className="w-full sm:w-auto"
            disabled={!selected || selected === currentQuestionSetId || saveMutation.isPending}
            onClick={() => saveMutation.mutate(selected)}
          >
            {saveMutation.isPending ? 'Guardando...' : 'Asociar'}
          </Button>
        </div>
        {activeSets.length === 0 && !isLoading && (
          <p className="text-xs text-accent-dark bg-accent-light px-3 py-2 rounded-[var(--radius-sm)] font-medium mt-4">
            No hay sets de preguntas activos. Crea uno en Question Sets antes de continuar.
          </p>
        )}
        {errorDetail && <p className="text-xs text-coral-dark bg-coral-light px-3 py-2 rounded-[var(--radius-sm)] mt-4">{errorDetail}</p>}
      </CardContent>
    </Card>
  );
}

function ProfilingStep({ processId }: { processId: string }) {
  const qc = useQueryClient();
  const [pollStart] = useState(() => Date.now());
  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['profiling-runs', processId],
    queryFn: () => processesApi.getProfilingRuns(processId).then((r) => r.data),
    refetchInterval: (q) => {
      const d = q.state.data as ProfilingRun[] | undefined;
      return profilingRunsRefetchInterval(d?.map((r) => r.status), pollStart);
    },
  });

  const statusCls: Record<string, string> = {
    PENDING:   'bg-bg-subtle text-text-muted border-border',
    CALLING:   'bg-blue-light text-blue-dark border-blue',
    COMPLETED: 'bg-mint-light text-mint-dark border-mint',
    FAILED:    'bg-coral-light text-coral-dark border-coral',
    NO_ANSWER: 'bg-accent-light text-accent-dark border-accent',
  };

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between bg-surface-raised rounded-t-[var(--radius-xl)]">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-text-muted" />
          <h3 className="text-sm font-semibold text-ink">Estado de llamadas de profiling</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ['profiling-runs', processId] })}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Actualizar
        </Button>
      </CardHeader>
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : runs.length === 0 ? (
          <div className="py-12 text-center bg-surface">
            <Phone className="w-10 h-10 text-border-strong mx-auto mb-3" />
            <p className="text-sm font-medium text-text mb-4">Selecciona candidatos finalistas en el Kanban para iniciar las llamadas</p>
            <Link href={`/hiring-processes/${processId}/candidates`} className="inline-block">
              <Button size="sm" variant="outline">Ir al Kanban</Button>
            </Link>
          </div>
        ) : (
          runs.map((run) => (
            <div key={run.id} className="flex items-center justify-between px-6 py-4 bg-surface hover:bg-bg-subtle/30 transition-colors">
              <div>
                <p className="text-sm font-semibold text-ink">{run.candidate?.name} {run.candidate?.last_name}</p>
                <p className="text-[11px] font-medium text-text-muted mt-0.5">{run.call_attempts} intento(s)</p>
              </div>
              <div className="flex items-center gap-3">
                {run.advancement_prob && <span className="text-xs font-bold text-primary-dark">Prob: {run.advancement_prob}</span>}
                <span className={`px-2.5 py-0.5 rounded-[var(--radius-sm)] border text-[10px] font-bold uppercase tracking-wider ${statusCls[run.status] ?? 'bg-bg-subtle text-text-muted border-border'}`}>
                  {run.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

// --- Main Page ---
export default function ProcessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const { data: process, isLoading } = useQuery({
    queryKey: ['process', id],
    queryFn: () => processesApi.get(id).then((r) => r.data),
    refetchInterval: (q) => {
      const d = q.state.data as HiringProcess | undefined;
      return d?.status === 'MATCHING' ? POLL_INTERVAL_MS : false;
    },
  });

  const currentStep = getProcessStep(process?.status ?? 'DRAFT');

  useEffect(() => {
    if (process?.status) {
      const step = getProcessStep(process.status);
      if (activeStep === null || activeStep > step) {
        setActiveStep(step);
      }
    }
  }, [process?.status]);

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!process) return <div className="text-text-muted text-sm text-center py-20">Proceso no encontrado</div>;

  return (
    <div className="bg-bg min-h-screen py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <Header title={process.name} subtitle={`${process.job_title} · ${process.area} · ${process.seniority}`}>
        <Link href="/hiring-processes"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </Header>

      {/* Info bar */}
      <Card className="mb-6 shadow-sm overflow-visible">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <StatusBadge status={process.status} />
          <div className="hidden sm:block h-6 w-px bg-border mx-2" />
          <div className="flex-1 max-w-sm w-full">
            <div className="flex justify-between text-[11px] font-bold mb-1.5 uppercase tracking-wide">
              <span className="text-primary-dark">Consumo IA: {formatCurrency(process.budget_max_usd * 0.45)}</span>
              <span className="text-text-muted">Máx {formatCurrency(process.budget_max_usd)}</span>
            </div>
            <div className="w-full bg-bg-subtle rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '45%' }} />
            </div>
          </div>
          <div className="sm:ml-auto flex items-center gap-2 mt-2 sm:mt-0">
            <Link href={`/hiring-processes/${id}/ranking`}>
              <Button variant="outline" size="sm" className="bg-surface"><BarChart2 className="w-3.5 h-3.5 mr-2" />Ranking</Button>
            </Link>
            <Link href={`/hiring-processes/${id}/candidates`}>
              <Button variant="outline" size="sm" className="bg-surface"><Users className="w-3.5 h-3.5 mr-2" />Kanban</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Stepper
        activeStep={activeStep ?? currentStep}
        maxStep={currentStep}
        onChangeStep={(s) => setActiveStep(s)}
      />

      <div className="mt-6">
        {(activeStep ?? currentStep) === 0 && <JDStep processId={id} />}
        {(activeStep ?? currentStep) === 1 && <UploadCVsStep processId={id} />}
        {(activeStep ?? currentStep) === 2 && (
          <div className="space-y-6">
            <MatchStep processId={id} />
            <Card className="bg-primary-xlight border-primary-light">
              <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <div>
                  <h3 className="text-sm font-bold text-ink mb-1">Cargar más candidatos (CVs)</h3>
                  <p className="text-xs text-text-muted font-medium">Sube CVs (PDF, DOCX, JPG, PNG) de nuevos candidatos. Se normalizarán y evaluarán automáticamente con IA.</p>
                </div>
                <Button onClick={() => setIsUploadOpen(true)} className="shrink-0 bg-primary text-white shadow-sm hover:bg-primary-dark">
                  <Upload className="w-4 h-4 mr-2" /> Subir más CVs
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        {(activeStep ?? currentStep) === 3 && (
          <div className="space-y-6">
            <QuestionSetAssignmentCard processId={id} currentQuestionSetId={process.question_set_id} />
            <VoiceConfigCard processId={id} />
            <ProfilingStep processId={id} />
            <Card className="bg-primary-xlight border-primary-light mt-4">
              <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <div>
                  <h3 className="text-sm font-bold text-ink mb-1">Cargar más candidatos (CVs)</h3>
                  <p className="text-xs text-text-muted font-medium">Sube CVs (PDF, DOCX, JPG, PNG) de nuevos candidatos. Se normalizarán y evaluarán automáticamente con IA.</p>
                </div>
                <Button onClick={() => setIsUploadOpen(true)} className="shrink-0 bg-primary text-white shadow-sm hover:bg-primary-dark">
                  <Upload className="w-4 h-4 mr-2" /> Subir más CVs
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <UploadCvsModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        processId={id}
      />
    </div>
  );
}
