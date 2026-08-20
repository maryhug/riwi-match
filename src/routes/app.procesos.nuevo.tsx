import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Upload,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
} from "lucide-react";
import { GlassCard } from "@/components/app/GlassCard";
import { AppSelect, AppSelectItem } from "@/components/app/AppSelect";
import { toast } from "sonner";
import {
  createProcess,
  updateProcess,
  createJobDescription,
  parseJobDescription,
  assignQuestionSet,
} from "@/lib/api/processes.functions";
import { uploadCVs } from "@/lib/api/candidates.functions";
import { getQuestionSets } from "@/lib/api/question-sets.functions";
import { getUsers } from "@/lib/api/users.functions";
import { useAuth } from "@/lib/auth-context";
import type { ParseJDResponse } from "@/lib/types/api";

export const Route = createFileRoute("/app/procesos/nuevo")({
  head: () => ({ meta: [{ title: "Match" }] }),
  component: Wizard,
});

const steps = ["Datos básicos", "Job Description", "CVs y profiling"];

const JD_MARKDOWN_CLASSNAME =
  "w-full min-h-[140px] rounded-xl bg-background/70 border border-border p-3 text-sm " +
  "[&_h1]:mt-2 [&_h1]:mb-1.5 [&_h1]:text-base [&_h1]:font-bold [&_h1]:first:mt-0 " +
  "[&_h2]:mt-2 [&_h2]:mb-1.5 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:first:mt-0 " +
  "[&_h3]:mt-1.5 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold " +
  "[&_p]:my-1.5 [&_strong]:font-semibold [&_em]:italic " +
  "[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 " +
  "[&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_li]:my-0.5";

const AREAS = [
  "Tecnología",
  "Producto",
  "Diseño",
  "Datos",
  "Ventas",
  "Marketing",
  "Personas",
  "Comercial",
];
const SENIORITIES = ["Jr", "Ssr", "Sr", "Lead", "Manager"];
const ACCEPTED_CV_TYPES = ".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp";
const MAX_CV_FILES = 50;
const MAX_CV_SIZE_MB = 10;

const DEFAULT_WEIGHTS = {
  technical_skills: 45,
  relevant_experience: 25,
  seniority: 15,
  industry_domain: 7,
  languages: 5,
  education_certifications: 3,
};

const WEIGHT_FIELDS: { key: keyof typeof DEFAULT_WEIGHTS; label: string }[] = [
  { key: "technical_skills", label: "Habilidades técnicas (%)" },
  { key: "relevant_experience", label: "Experiencia relevante (%)" },
  { key: "seniority", label: "Seniority (%)" },
  { key: "industry_domain", label: "Dominio de industria (%)" },
  { key: "languages", label: "Idiomas (%)" },
  { key: "education_certifications", label: "Educación y cert. (%)" },
];

function Wizard() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [processId, setProcessId] = useState<string | null>(null);

  // Paso 0
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [area, setArea] = useState(AREAS[0]);
  const [seniority, setSeniority] = useState(SENIORITIES[0]);
  const [budget, setBudget] = useState("");
  const [recruiterId, setRecruiterId] = useState("");
  const [showWeights, setShowWeights] = useState(false);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);

  // Paso 1
  const [jdTab, setJdTab] = useState<"text" | "file">("text");
  const [jdText, setJdText] = useState("");
  const [jdSaved, setJdSaved] = useState(false);
  const [parseResult, setParseResult] = useState<ParseJDResponse | null>(null);
  const [preEnhanceJdText, setPreEnhanceJdText] = useState<string | null>(null);
  const [jdEditing, setJdEditing] = useState(true);

  // Paso 2
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [selectedQuestionSetId, setSelectedQuestionSetId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalWeights = Object.values(weights).reduce((a, b) => a + b, 0);
  const hasNegativeWeight = Object.values(weights).some((w) => w < 0);
  const weightsValid = !showWeights || (totalWeights === 100 && !hasNegativeWeight);
  const canAssignRecruiter = user?.role === "TA_LEADER" || user?.role === "ADMIN";
  const step0Valid =
    name.trim().length > 0 &&
    jobTitle.trim().length > 0 &&
    weightsValid &&
    (!canAssignRecruiter || Boolean(recruiterId));
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
    enabled: canAssignRecruiter,
  });
  const recruiters = (usersData ?? []).filter(
    (candidate) => candidate.role === "RECRUITER" && candidate.status === "ACTIVE",
  );

  const createProcessMutation = useMutation({
    mutationFn: () =>
      processId
        ? updateProcess({
            data: {
              processId,
              name,
              job_title: jobTitle,
              area,
              seniority,
              budget_max_usd: budget ? Number(budget) : undefined,
            },
          })
        : createProcess({
            data: {
              name,
              job_title: jobTitle,
              area,
              seniority,
              budget_max_usd: budget ? Number(budget) : undefined,
              match_weights_override: showWeights ? weights : undefined,
              recruiter_id: canAssignRecruiter ? recruiterId : undefined,
            },
          }),
    onSuccess: (res) => {
      setProcessId(res.process_id);
      setStep(1);
      qc.invalidateQueries({ queryKey: ["processes"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el proceso");
    },
  });

  const saveJDMutation = useMutation({
    mutationFn: () => createJobDescription({ data: { processId: processId!, jdRawText: jdText } }),
    onSuccess: () => {
      setJdSaved(true);
      toast.success("Job Description guardada");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la JD");
    },
  });

  const parseJDMutation = useMutation({
    mutationFn: () => parseJobDescription({ data: { processId: processId!, jdRawText: jdText } }),
    onSuccess: (res) => {
      setParseResult(res);
      if (res.enhanced_jd) {
        setPreEnhanceJdText(jdText);
        setJdText(res.enhanced_jd);
        setJdSaved(false);
        setJdEditing(false);
      }
      toast.success("JD analizada y enriquecida por IA", {
        description: "La versión mejorada ya está en el campo de texto — puedes editarla.",
      });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "No se pudo analizar la JD");
    },
  });

  const undoEnhance = () => {
    if (preEnhanceJdText === null) return;
    setJdText(preEnhanceJdText);
    setPreEnhanceJdText(null);
    setJdSaved(false);
    setJdEditing(true);
    toast.info("Se restauró el texto anterior a la mejora de IA");
  };

  const uploadMutation = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append("processId", processId!);
      files.forEach((f) => form.append("files", f));
      return uploadCVs({ data: form });
    },
    onSuccess: (res) => {
      toast.success(`${res.uploaded} CV(s) cargado(s) — se están procesando`);
      setFiles([]);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "No se pudieron subir los CVs");
    },
  });

  const { data: questionSets } = useQuery({
    queryKey: ["question-sets"],
    queryFn: () => getQuestionSets(),
    enabled: step === 2,
  });

  const assignSetMutation = useMutation({
    mutationFn: (questionSetId: string) =>
      assignQuestionSet({ data: { processId: processId!, questionSetId } }),
    onSuccess: () => toast.success("Set de preguntas asignado"),
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "No se pudo asignar el set");
    },
  });

  const addFiles = (incoming: FileList | File[]) => {
    const valid: File[] = [];
    for (const f of Array.from(incoming)) {
      if (f.size > MAX_CV_SIZE_MB * 1024 * 1024) {
        toast.error(`${f.name} supera ${MAX_CV_SIZE_MB}MB`);
        continue;
      }
      valid.push(f);
    }
    setFiles((prev) => {
      const next = [...prev, ...valid];
      if (next.length > MAX_CV_FILES) {
        toast.error(`Máximo ${MAX_CV_FILES} archivos por lote`);
        return next.slice(0, MAX_CV_FILES);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        to="/app"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Crear proceso</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Asistente en 3 pasos para configurar tu proceso de selección.
        </p>
      </div>

      <div className="flex items-center gap-4">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`h-8 w-8 grid place-items-center rounded-full text-xs font-bold ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div
              className={`text-sm font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}
            >
              {s}
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      <GlassCard className="p-6">
        {step === 0 && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nombre del proceso
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Backend Node Sr"
                  className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background/70 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cargo
                </label>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ej. Desarrollador Backend"
                  className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background/70 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Área
                </label>
                <AppSelect value={area} onValueChange={setArea} className="mt-1.5 w-full">
                  {AREAS.map((a) => (
                    <AppSelectItem key={a} value={a}>
                      {a}
                    </AppSelectItem>
                  ))}
                </AppSelect>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Seniority
                </label>
                <AppSelect value={seniority} onValueChange={setSeniority} className="mt-1.5 w-full">
                  {SENIORITIES.map((s) => (
                    <AppSelectItem key={s} value={s}>
                      {s}
                    </AppSelectItem>
                  ))}
                </AppSelect>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Reclutador responsable
                </label>
                {canAssignRecruiter ? (
                  <AppSelect
                    value={recruiterId || "none"}
                    onValueChange={(value) => setRecruiterId(value === "none" ? "" : value)}
                    className="mt-1.5 w-full"
                  >
                    <AppSelectItem value="none">Selecciona un recruiter</AppSelectItem>
                    {recruiters.map((recruiter) => (
                      <AppSelectItem key={recruiter.id} value={recruiter.id}>
                        {recruiter.name} {recruiter.last_name}
                      </AppSelectItem>
                    ))}
                  </AppSelect>
                ) : (
                  <div className="mt-1.5 w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground">
                    {user ? `${user.name} ${user.last_name} (tú)` : "…"}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Presupuesto máximo USD (opcional)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="Ej. 500"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background/70 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                />
              </div>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setShowWeights(!showWeights)}
                className="w-full px-4 py-3 flex items-center justify-between bg-background/40 hover:bg-background/70 transition-colors text-xs font-semibold"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Configuración avanzada de pesos de match (Opcional)
                </span>
                {showWeights ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showWeights && (
                <div className="p-4 border-t border-border space-y-4">
                  <p className="text-xs text-muted-foreground leading-normal">
                    Ajusta los porcentajes para dar más peso a dimensiones específicas durante el
                    análisis y ranking automatizado por IA. La suma total debe ser exactamente 100%.
                  </p>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {WEIGHT_FIELDS.map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {label}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={weights[key]}
                          onChange={(e) =>
                            setWeights({ ...weights, [key]: parseInt(e.target.value) || 0 })
                          }
                          className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background/70 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border/50 gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-md ${
                          totalWeights === 100 && !hasNegativeWeight
                            ? "bg-success/15 text-success"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        Suma total: {totalWeights}%
                      </span>
                      {totalWeights !== 100 && (
                        <span className="text-[11px] text-destructive font-medium">
                          Debe ser exactamente 100%
                        </span>
                      )}
                      {hasNegativeWeight && (
                        <span className="text-[11px] text-destructive font-medium">
                          No se permiten valores negativos
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setWeights(DEFAULT_WEIGHTS)}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      Restablecer valores por defecto
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 1 && processId && (
          <div className="space-y-5">
            <div className="flex gap-2 border-b border-border/40">
              <button
                onClick={() => setJdTab("text")}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${jdTab === "text" ? "border-primary" : "border-transparent text-muted-foreground"}`}
              >
                Escribir JD
              </button>
              <button
                onClick={() => setJdTab("file")}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${jdTab === "file" ? "border-primary" : "border-transparent text-muted-foreground"}`}
              >
                Cargar archivo
              </button>
            </div>

            {jdTab === "text" ? (
              <>
                {!jdEditing && jdText.trim().length > 0 ? (
                  <div className="space-y-1.5">
                    <div className={JD_MARKDOWN_CLASSNAME}>
                      <ReactMarkdown>{jdText}</ReactMarkdown>
                    </div>
                    <button
                      onClick={() => setJdEditing(true)}
                      className="px-3 py-1.5 rounded-lg border border-border bg-background/60 text-xs font-medium"
                    >
                      Editar
                    </button>
                  </div>
                ) : (
                  <textarea
                    value={jdText}
                    onChange={(e) => {
                      setJdText(e.target.value);
                      setJdSaved(false);
                    }}
                    placeholder="Pega aquí la descripción del cargo…"
                    className="w-full min-h-[140px] rounded-xl bg-background/70 border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveJDMutation.mutate()}
                    disabled={jdText.trim().length < 10 || saveJDMutation.isPending}
                    className="px-4 py-2 rounded-xl border border-border bg-background/60 text-sm font-medium disabled:opacity-40"
                  >
                    {saveJDMutation.isPending
                      ? "Guardando…"
                      : jdSaved
                        ? "JD guardada ✓"
                        : "Guardar JD"}
                  </button>
                </div>
              </>
            ) : (
              <UploadJDFile
                processId={processId}
                onUploaded={(text) => {
                  setJdText(text);
                  setJdSaved(true);
                  setJdTab("text");
                  setPreEnhanceJdText(null);
                  setJdEditing(true);
                }}
              />
            )}

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Analizar y enriquecer con IA
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Extrae requisitos obligatorios/deseables/excluyentes y sugiere una versión
                    mejorada + recomendaciones (no persiste nada hasta que la apliques).
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {preEnhanceJdText !== null && (
                    <button
                      onClick={undoEnhance}
                      title="Restaurar el texto anterior a la mejora de IA"
                      className="px-3 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition"
                    >
                      Deshacer
                    </button>
                  )}
                  <button
                    onClick={() => parseJDMutation.mutate()}
                    disabled={jdText.trim().length < 10 || parseJDMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 transition disabled:opacity-60"
                  >
                    {parseJDMutation.isPending
                      ? "Analizando…"
                      : parseResult
                        ? "Re-analizar"
                        : "Analizar con IA"}
                  </button>
                </div>
              </div>

              {parseResult && (
                <div className="mt-5 space-y-4">
                  {[
                    {
                      l: "Requisitos obligatorios",
                      c: parseResult.must_have,
                      color: "bg-primary/15 text-primary",
                    },
                    {
                      l: "Deseables",
                      c: parseResult.nice_to_have,
                      color: "bg-info/30 text-info-foreground",
                    },
                    {
                      l: "Criterios excluyentes",
                      c: parseResult.deal_breakers,
                      color: "bg-destructive/15 text-destructive",
                    },
                  ].map((g) => (
                    <div key={g.l}>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                        {g.l}
                      </div>
                      {g.c.length === 0 ? (
                        <div className="text-xs text-muted-foreground">—</div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {g.c.map((x) => (
                            <span
                              key={x}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium ${g.color}`}
                            >
                              {x}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {parseResult.summary && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                        Resumen
                      </div>
                      <p className="text-xs text-foreground/80">{parseResult.summary}</p>
                    </div>
                  )}

                  {(parseResult.recommendations.length > 0 ||
                    parseResult.missing_elements.length > 0) && (
                    <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                      {parseResult.recommendations.length > 0 && (
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                            Recomendaciones
                          </div>
                          <ul className="text-xs text-foreground/80 space-y-1 list-disc list-inside">
                            {parseResult.recommendations.map((r) => (
                              <li key={r}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {parseResult.missing_elements.length > 0 && (
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                            Elementos faltantes
                          </div>
                          <ul className="text-xs text-foreground/80 space-y-1 list-disc list-inside">
                            {parseResult.missing_elements.map((m) => (
                              <li key={m}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                    La versión mejorada ya se cargó en el campo de texto de arriba — puedes seguir
                    editándola antes de guardar.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && processId && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
              }}
              className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border bg-background/40"}`}
            >
              <div className="grid h-12 w-12 mx-auto place-items-center rounded-xl bg-primary/15 text-primary mb-3">
                <Upload className="h-5 w-5" />
              </div>
              <div className="font-semibold">Arrastra los CVs aquí</div>
              <div className="text-xs text-muted-foreground mt-1">
                PDF, DOCX, JPG, PNG · máx. {MAX_CV_FILES} por lote · {MAX_CV_SIZE_MB} MB c/u
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
              >
                Seleccionar archivos
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_CV_TYPES}
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  {files.length} archivo(s) seleccionado(s)
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/60 border border-border text-xs"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {f.name}
                      </span>
                      <button
                        onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => uploadMutation.mutate()}
                  disabled={uploadMutation.isPending}
                  className="w-full px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
                >
                  {uploadMutation.isPending ? "Subiendo…" : `Subir ${files.length} CV(s)`}
                </button>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Set de preguntas (opcional)
              </label>
              <AppSelect
                value={selectedQuestionSetId || "none"}
                onValueChange={(value) => {
                  const setId = value === "none" ? "" : value;
                  setSelectedQuestionSetId(setId);
                  if (setId) assignSetMutation.mutate(setId);
                }}
                className="mt-1.5 w-full"
              >
                <AppSelectItem value="none">— Asignar después —</AppSelectItem>
                {(questionSets?.question_sets ?? [])
                  .filter((qs) => qs.status === "ACTIVE")
                  .map((qs) => (
                    <AppSelectItem key={qs.id} value={qs.id}>
                      {qs.name}
                    </AppSelectItem>
                  ))}
              </AppSelect>
            </div>
          </div>
        )}
      </GlassCard>

      <div className="flex justify-between">
        <button
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
          className="px-4 py-2 rounded-xl border border-border bg-background/60 text-sm disabled:opacity-40"
        >
          Atrás
        </button>
        {step < steps.length - 1 ? (
          <button
            disabled={
              (step === 0 && (!step0Valid || createProcessMutation.isPending)) ||
              (step === 1 && !jdSaved)
            }
            onClick={() => (step === 0 ? createProcessMutation.mutate() : setStep(step + 1))}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 transition disabled:opacity-40"
          >
            {createProcessMutation.isPending ? "Guardando…" : "Siguiente"}{" "}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => {
              toast.success("Proceso creado exitosamente");
              nav({ to: "/app/procesos/$id", params: { id: processId! } });
            }}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 transition"
          >
            Finalizar
          </button>
        )}
      </div>
    </div>
  );
}

function UploadJDFile({
  processId,
  onUploaded,
}: {
  processId: string;
  onUploaded: (text: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const { uploadJobDescription } = await import("@/lib/api/processes.functions");
      const form = new FormData();
      form.append("processId", processId);
      form.append("file", file);
      const res = await uploadJobDescription({ data: form });
      toast.success(`JD cargada desde ${res.original_filename}`);
      onUploaded(`[Archivo: ${res.original_filename}]`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cargar el archivo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-background/40 p-8 text-center">
      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
      <div className="text-sm font-medium">Sube un archivo PDF, DOCX o TXT</div>
      <div className="text-xs text-muted-foreground mt-1">máx. 10 MB</div>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
      >
        {uploading ? "Subiendo…" : "Seleccionar archivo"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
