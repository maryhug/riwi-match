'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, GripVertical, X, Star } from 'lucide-react';
import Link from 'next/link';
import { questionSetsApi } from '@/lib/api';
import { Input, Textarea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Header from '@/components/layout/Header';
import type { ProfilingQuestion } from '@/lib/types';

const QUESTION_TYPE_OPTIONS = [
  { value: 'OPEN',            label: 'Abierta (respuesta libre)' },
  { value: 'CLOSED',          label: 'Cerrada (sí / no)' },
  { value: 'YES_NO',          label: 'Sí / No explícito' },
  { value: 'MULTIPLE_CHOICE', label: 'Opción múltiple' },
  { value: 'NUMERIC',         label: 'Numérica' },
];

const schema = z.object({
  name:        z.string().min(3, 'Mínimo 3 caracteres'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type DraftQuestion = Omit<ProfilingQuestion, 'id' | 'question_set_id'>;

const emptyQuestion = (): DraftQuestion => ({
  order_index: 0, text: '', type: 'OPEN', expected_answer: '',
  positive_keywords: [], risk_keywords: [], weight: 10, is_critical: false, eval_criteria: '',
});

function ChipInput({ label, sublabel, placeholder, values, onChange, accentColor, accentBg }: {
  label: string; sublabel: string; placeholder: string; values: string[];
  onChange: (v: string[]) => void; accentColor: string; accentBg: string;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const t = input.trim().toLowerCase();
    if (t && !values.includes(t)) { onChange([...values, t]); setInput(''); }
  };
  return (
    <div className="space-y-1.5">
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
        {sublabel && <p className="text-[10px] text-slate-400 mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-colors" />
        <button type="button" onClick={add}
          className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
          style={{ background: accentColor }}>+</button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
              style={{ background: accentBg, color: accentColor }}>
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionCard({ q, i, total, posKeywords, riskKeywords, onUpdate, onRemove, onPosChange, onRiskChange }: {
  q: DraftQuestion; i: number; total: number; posKeywords: string[]; riskKeywords: string[];
  onUpdate: (field: keyof DraftQuestion, value: unknown) => void; onRemove: () => void;
  onPosChange: (v: string[]) => void; onRiskChange: (v: string[]) => void;
}) {
  const showExpectedAnswer = q.type === 'CLOSED' || q.type === 'YES_NO' || q.type === 'NUMERIC';
  const showKeywords = q.type === 'OPEN' || q.type === 'MULTIPLE_CHOICE';

  return (
    <div className="bg-white border-y border-slate-200 flex items-stretch">
      {/* Grip + número */}
      <div className="w-10 flex flex-col items-center justify-start pt-4 gap-2 bg-slate-50 border-r border-slate-200 shrink-0">
        <GripVertical className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
      </div>

      <div className="flex-1 p-5 space-y-4">
        {/* Header de la pregunta */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-violet-700 px-2 py-0.5 bg-violet-50 rounded uppercase tracking-wide">
              {QUESTION_TYPE_OPTIONS.find((o) => o.value === q.type)?.label ?? q.type}
            </span>
            {q.is_critical && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 px-2 py-0.5 bg-orange-50 rounded">
                <Star className="w-2.5 h-2.5 fill-orange-600" />
                Crítica
              </span>
            )}
          </div>
          <button type="button" onClick={onRemove} disabled={total === 1}
            className="text-slate-300 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <Textarea label="Pregunta" placeholder="Texto exacto que el agente leerá al candidato..." rows={2}
          value={q.text} onChange={(e) => onUpdate('text', e.target.value)} required />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Tipo" value={q.type} onChange={(e) => onUpdate('type', e.target.value)} options={QUESTION_TYPE_OPTIONS} />
          <Input label="Peso % (1–100)" type="number" min="1" max="100" value={q.weight}
            onChange={(e) => onUpdate('weight', Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))} />
        </div>

        {showExpectedAnswer && (
          <Input label="Respuesta esperada"
            placeholder={q.type === 'NUMERIC' ? 'Ej. 3 o más años' : 'Ej. Sí'}
            value={q.expected_answer ?? ''} onChange={(e) => onUpdate('expected_answer', e.target.value)} />
        )}

        {showKeywords && (
          <div className="grid grid-cols-2 gap-5">
            <ChipInput label="Keywords positivas" sublabel="Suman puntos" placeholder="ej: microservicios..."
              values={posKeywords} onChange={onPosChange} accentColor="#059669" accentBg="#ECFDF5" />
            <ChipInput label="Keywords de riesgo" sublabel="Generan alerta" placeholder="ej: no sé..."
              values={riskKeywords} onChange={onRiskChange} accentColor="#D97706" accentBg="#FFFBEB" />
          </div>
        )}

        <Textarea label="Criterio de evaluación (instrucción interna para la IA)"
          placeholder="Qué aspectos evaluar... Este texto NO es leído al candidato." rows={2}
          value={q.eval_criteria ?? ''} onChange={(e) => onUpdate('eval_criteria', e.target.value)} />

        <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors rounded">
          <input type="checkbox" checked={q.is_critical} onChange={(e) => onUpdate('is_critical', e.target.checked)}
            className="w-3.5 h-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-200" />
          <div>
            <span className="text-xs font-semibold text-slate-900">Pregunta crítica (dealbreaker)</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Si el candidato la falla, se marcará para revisión urgente</span>
          </div>
        </label>
      </div>
    </div>
  );
}

export default function NewQuestionSetPage() {
  const router = useRouter();
  const [questions,    setQuestions]    = useState<DraftQuestion[]>([emptyQuestion()]);
  const [posKeywords,  setPosKeywords]  = useState<string[][]>([[]]);
  const [riskKeywords, setRiskKeywords] = useState<string[][]>([[]]);
  const [submitError,  setSubmitError]  = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { ...emptyQuestion(), order_index: prev.length }]);
    setPosKeywords((prev) => [...prev, []]);
    setRiskKeywords((prev) => [...prev, []]);
  };

  const removeQuestion = (i: number) => {
    setQuestions((prev) => prev.filter((_, j) => j !== i));
    setPosKeywords((prev) => prev.filter((_, j) => j !== i));
    setRiskKeywords((prev) => prev.filter((_, j) => j !== i));
  };

  const updateQ = (i: number, field: keyof DraftQuestion, value: unknown) => {
    setQuestions((prev) => { const next = [...prev]; next[i] = { ...next[i], [field]: value }; return next; });
  };

  const onSubmit = async (data: FormData) => {
    setSubmitError('');
    try {
      const qs = questions.map((q, i) => ({
        order_index: i, text: q.text, type: q.type, expected_answer: q.expected_answer || undefined,
        positive_keywords: posKeywords[i] ?? [], risk_keywords: riskKeywords[i] ?? [],
        weight: q.weight, is_critical: q.is_critical, eval_criteria: q.eval_criteria || undefined,
      }));
      const res = await questionSetsApi.create({ ...data, questions: qs });
      router.push(`/question-sets/${(res.data as { id: string }).id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setSubmitError(e?.response?.data?.detail ?? 'Error al guardar el cuestionario.');
    }
  };

  const totalWeight = questions.reduce((s, q) => s + (q.weight || 0), 0);

  return (
    <div className="max-w-2xl mx-auto">
      <Header title="Nuevo cuestionario" subtitle="Banco de preguntas para profiling de voz con IA">
        <Link href="/question-sets">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver
          </Button>
        </Link>
      </Header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-0 pb-10">

        {/* Datos del cuestionario — banda blanca */}
        <div className="bg-white border-y border-slate-200 mb-5">
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">Datos del cuestionario</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            <Input label="Nombre" placeholder="Ej. Backend Senior — Técnico y Valores"
              error={errors.name?.message} required {...register('name')} />
            <Textarea label="Descripción (opcional)" placeholder="Contexto, objetivo y perfil de candidato..." rows={2} {...register('description')} />
          </div>
        </div>

        {/* Preguntas */}
        <div className="space-y-0">
          {/* Header de sección */}
          <div className="flex items-center justify-between px-1 mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Preguntas <span className="text-slate-400 font-normal">({questions.length})</span>
              </h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                totalWeight > 100 ? 'bg-red-50 text-red-600' :
                totalWeight === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                Peso total: {totalWeight}%
              </span>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addQuestion}>
              <Plus className="w-3.5 h-3.5" />
              Agregar pregunta
            </Button>
          </div>

          <div className="space-y-3">
            {questions.map((q, i) => (
              <QuestionCard
                key={i} q={q} i={i} total={questions.length}
                posKeywords={posKeywords[i]} riskKeywords={riskKeywords[i]}
                onUpdate={(field, value) => updateQ(i, field, value)}
                onRemove={() => removeQuestion(i)}
                onPosChange={(vals) => setPosKeywords((prev) => { const n = [...prev]; n[i] = vals; return n; })}
                onRiskChange={(vals) => setRiskKeywords((prev) => { const n = [...prev]; n[i] = vals; return n; })}
              />
            ))}
          </div>
        </div>

        {/* Agregar pregunta — dashed */}
        <button type="button" onClick={addQuestion}
          className="w-full mt-3 py-3.5 border-2 border-dashed border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 transition-all flex items-center justify-center gap-2 font-medium text-xs">
          <Plus className="w-4 h-4" />
          Agregar otra pregunta
        </button>

        {submitError && (
          <p className="mt-3 text-xs text-red-600 bg-red-50 px-4 py-3 rounded border border-red-100">{submitError}</p>
        )}

        <div className="flex items-center justify-between pt-4">
          <Link href="/question-sets">
            <Button type="button" variant="ghost" className="text-slate-500">Cancelar</Button>
          </Link>
          <Button type="submit" loading={isSubmitting} disabled={questions.some((q) => !q.text.trim())}>
            Guardar cuestionario
          </Button>
        </div>
      </form>
    </div>
  );
}
