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
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Header from '@/components/layout/Header';
import type { ProfilingQuestion } from '@/lib/types';

// ─── Tipos de pregunta — exactamente los del enum del backend ─────────────────
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
  order_index:      0,
  text:             '',
  type:             'OPEN',
  expected_answer:  '',
  positive_keywords: [],
  risk_keywords:    [],
  weight:           10,
  is_critical:      false,
  eval_criteria:    '',
});

// ─── Chip input ────────────────────────────────────────────────────────────────
function ChipInput({
  label, sublabel, placeholder, values, onChange, accentColor, accentBg,
}: {
  label: string;
  sublabel: string;
  placeholder: string;
  values: string[];
  onChange: (v: string[]) => void;
  accentColor: string;
  accentBg: string;
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
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={add}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
          style={{ background: accentColor }}
        >+</button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: accentBg, color: accentColor }}
            >
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Question card ─────────────────────────────────────────────────────────────
function QuestionCard({
  q, i, total, posKeywords, riskKeywords, onUpdate, onRemove, onPosChange, onRiskChange,
}: {
  q: DraftQuestion;
  i: number;
  total: number;
  posKeywords: string[];
  riskKeywords: string[];
  onUpdate: (field: keyof DraftQuestion, value: unknown) => void;
  onRemove: () => void;
  onPosChange: (v: string[]) => void;
  onRiskChange: (v: string[]) => void;
}) {
  const showExpectedAnswer = q.type === 'CLOSED' || q.type === 'YES_NO' || q.type === 'NUMERIC';
  const showKeywords = q.type === 'OPEN' || q.type === 'MULTIPLE_CHOICE';

  return (
    <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <CardContent className="p-0 flex items-stretch">
        {/* Drag handle + number */}
        <div className="w-12 flex flex-col items-center justify-start pt-5 gap-2 bg-slate-50/50 border-r border-slate-100 shrink-0">
          <GripVertical className="w-4 h-4 text-slate-300" />
          <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
        </div>

        <div className="flex-1 p-6 space-y-5">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-primary-dark px-2 py-0.5 bg-primary-xlight rounded uppercase tracking-wide">
                {QUESTION_TYPE_OPTIONS.find((o) => o.value === q.type)?.label ?? q.type}
              </span>
              {q.is_critical && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 px-2 py-0.5 bg-orange-50 rounded">
                  <Star className="w-3 h-3 fill-orange-600" />
                  Crítica
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onRemove}
              disabled={total === 1}
              className="text-slate-300 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Enunciado */}
          <Textarea
            label="Pregunta"
            placeholder="Texto exacto que el agente leerá al candidato durante la llamada..."
            rows={2}
            value={q.text}
            onChange={(e) => onUpdate('text', e.target.value)}
            required
          />

          {/* Tipo / Peso */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo"
              value={q.type}
              onChange={(e) => onUpdate('type', e.target.value)}
              options={QUESTION_TYPE_OPTIONS}
            />
            <Input
              label="Peso % (1–100)"
              type="number"
              min="1"
              max="100"
              value={q.weight}
              onChange={(e) => onUpdate('weight', Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
            />
          </div>

          {/* Respuesta esperada — solo para tipos cerrados */}
          {showExpectedAnswer && (
            <Input
              label="Respuesta esperada"
              placeholder={q.type === 'NUMERIC' ? 'Ej. 3 o más años' : 'Ej. Sí'}
              value={q.expected_answer ?? ''}
              onChange={(e) => onUpdate('expected_answer', e.target.value)}
            />
          )}

          {/* Keywords — solo para tipos abiertos */}
          {showKeywords && (
            <div className="grid grid-cols-2 gap-6">
              <ChipInput
                label="Keywords positivas"
                sublabel="Suman puntos cuando el candidato las menciona"
                placeholder="ej: microservicios, escalabilidad..."
                values={posKeywords}
                onChange={onPosChange}
                accentColor="#10B981"
                accentBg="#DCFCE7"
              />
              <ChipInput
                label="Keywords de riesgo"
                sublabel="Generan alerta o reducen puntuación"
                placeholder="ej: nunca lo usé, no sé..."
                values={riskKeywords}
                onChange={onRiskChange}
                accentColor="#F97316"
                accentBg="#FFF7ED"
              />
            </div>
          )}

          {/* Criterio de evaluación */}
          <Textarea
            label="Criterio de evaluación (instrucción interna para la IA)"
            placeholder="Qué aspectos evaluar: metodología, profundidad técnica, ejemplos concretos... Este texto NO es leído al candidato."
            rows={2}
            value={q.eval_criteria ?? ''}
            onChange={(e) => onUpdate('eval_criteria', e.target.value)}
          />

          {/* Checkbox crítica */}
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={q.is_critical}
              onChange={(e) => onUpdate('is_critical', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-primary-dark focus:ring-primary"
            />
            <div>
              <span className="text-sm font-semibold text-slate-900">Pregunta crítica (dealbreaker)</span>
              <span className="block text-xs text-slate-400 mt-0.5">Si el candidato la falla, se marcará para revisión urgente</span>
            </div>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function NewQuestionSetPage() {
  const router = useRouter();
  const [questions,    setQuestions]    = useState<DraftQuestion[]>([emptyQuestion()]);
  const [posKeywords,  setPosKeywords]  = useState<string[][]>([[]]);
  const [riskKeywords, setRiskKeywords] = useState<string[][]>([[]]);
  const [submitError,  setSubmitError]  = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const addQuestion = () => {
    setQuestions((prev)    => [...prev, { ...emptyQuestion(), order_index: prev.length }]);
    setPosKeywords((prev)  => [...prev, []]);
    setRiskKeywords((prev) => [...prev, []]);
  };

  const removeQuestion = (i: number) => {
    setQuestions((prev)    => prev.filter((_, j) => j !== i));
    setPosKeywords((prev)  => prev.filter((_, j) => j !== i));
    setRiskKeywords((prev) => prev.filter((_, j) => j !== i));
  };

  const updateQ = (i: number, field: keyof DraftQuestion, value: unknown) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const onSubmit = async (data: FormData) => {
    setSubmitError('');
    try {
      const qs = questions.map((q, i) => ({
        order_index:       i,
        text:              q.text,
        type:              q.type,
        expected_answer:   q.expected_answer || undefined,
        positive_keywords: posKeywords[i] ?? [],
        risk_keywords:     riskKeywords[i] ?? [],
        weight:            q.weight,
        is_critical:       q.is_critical,
        eval_criteria:     q.eval_criteria || undefined,
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
    <div>
      <Header title="Nuevo cuestionario" subtitle="Banco de preguntas para profiling de voz con IA">
        <Link href="/question-sets">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </Link>
      </Header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-10">
        {/* Datos generales */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Datos del cuestionario</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nombre"
              placeholder="Ej. Backend Senior — Técnico y Valores"
              error={errors.name?.message}
              required
              {...register('name')}
            />
            <Textarea
              label="Descripción (opcional)"
              placeholder="Contexto, objetivo y perfil de candidato al que aplica este cuestionario..."
              rows={2}
              {...register('description')}
            />
          </CardContent>
        </Card>

        {/* Preguntas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-slate-900">
                  Preguntas <span className="text-slate-400 font-normal">({questions.length})</span>
                </h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  totalWeight > 100
                    ? 'bg-red-50 text-red-600'
                    : totalWeight === 100
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  Peso total: {totalWeight}%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Define el texto, la respuesta esperada y las keywords para la evaluación de IA.
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addQuestion}>
              <Plus className="w-4 h-4" />
              Agregar pregunta
            </Button>
          </div>

          {questions.map((q, i) => (
            <QuestionCard
              key={i}
              q={q}
              i={i}
              total={questions.length}
              posKeywords={posKeywords[i]}
              riskKeywords={riskKeywords[i]}
              onUpdate={(field, value) => updateQ(i, field, value)}
              onRemove={() => removeQuestion(i)}
              onPosChange={(vals) => setPosKeywords((prev) => { const n = [...prev]; n[i] = vals; return n; })}
              onRiskChange={(vals) => setRiskKeywords((prev) => { const n = [...prev]; n[i] = vals; return n; })}
            />
          ))}
        </div>

        {/* Botón agregar extra */}
        <button
          type="button"
          onClick={addQuestion}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:text-primary-dark hover:border-primary-light hover:bg-primary-xlight/50 transition-all flex items-center justify-center gap-2 font-medium text-sm"
        >
          <Plus className="w-5 h-5" />
          Agregar otra pregunta
        </button>

        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{submitError}</p>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between pt-2">
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
