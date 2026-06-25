'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, GripVertical, X } from 'lucide-react';
import Link from 'next/link';
import { questionSetsApi } from '@/lib/api';
import { Input, Textarea, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Header from '@/components/layout/Header';
import type { ProfilingQuestion } from '@/lib/types';

const schema = z.object({
  name: z.string().min(3, 'Minimo 3 caracteres'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type DraftQuestion = Omit<ProfilingQuestion, 'id' | 'question_set_id'>;

const emptyQuestion = (): DraftQuestion => ({
  order_index: 0,
  text: '',
  type: 'OPEN',
  desired_answer: '',
  positive_keywords: [],
  risk_keywords: [],
  weight: 5,
  is_critical: false,
  eval_criteria: '',
});

// ─── Keywords chip input ──────────────────────────────────────────────────────
function ChipInput({
  label,
  sublabel,
  placeholder,
  values,
  onChange,
  accentColor,
  accentBg,
}: {
  label: string;
  sublabel: string;
  placeholder: string;
  values: string[];
  onChange: (vals: string[]) => void;
  accentColor: string;
  accentBg: string;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const t = input.trim();
    if (t && !values.includes(t)) { onChange([...values, t]); setInput(''); }
  };

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-semibold mb-0.5" style={{ color: '#1E1B4B' }}>{label}</label>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>{sublabel}</p>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 text-sm px-3 py-2 rounded-xl outline-none transition-all"
          style={{
            border: `1.5px solid #EEE9FF`,
            color: '#1E1B4B',
            background: 'white',
          }}
          onFocus={(e) => { e.target.style.borderColor = accentColor; e.target.style.boxShadow = `0 0 0 3px ${accentBg}`; }}
          onBlur={(e)  => { e.target.style.borderColor = '#EEE9FF'; e.target.style.boxShadow = 'none'; }}
        />
        <button
          type="button"
          onClick={add}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm transition-opacity hover:opacity-80"
          style={{ background: accentColor }}
        >
          +
        </button>
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
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="ml-0.5 opacity-60 hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────────
function QuestionCard({
  q,
  i,
  total,
  posKeywords,
  riskKeywords,
  onUpdate,
  onRemove,
  onPosChange,
  onRiskChange,
}: {
  q: DraftQuestion;
  i: number;
  total: number;
  posKeywords: string[];
  riskKeywords: string[];
  onUpdate: (field: keyof DraftQuestion, value: unknown) => void;
  onRemove: () => void;
  onPosChange: (vals: string[]) => void;
  onRiskChange: (vals: string[]) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4" style={{ color: '#C4B2F9' }} />
            <span className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>
              Pregunta {i + 1}
            </span>
            {q.is_critical && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: '#FEE2E2', color: '#DC2626' }}
              >
                Critica
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={total === 1}
            className="transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: '#D1D5DB' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#FF596D'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#D1D5DB'; }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Enunciado */}
        <Textarea
          label="Enunciado de la pregunta"
          placeholder="Texto exacto que el agente leera al candidato durante la llamada..."
          rows={3}
          value={q.text}
          onChange={(e) => onUpdate('text', e.target.value)}
          required
        />

        {/* Tipo / Peso / Critica */}
        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Tipo de pregunta"
            value={q.type}
            onChange={(e) => onUpdate('type', e.target.value)}
            options={[
              { value: 'OPEN',   label: 'Abierta' },
              { value: 'CLOSED', label: 'Cerrada (si/no)' },
              { value: 'scale',  label: 'Escala (1-10)' },
            ]}
          />
          <Input
            label="Peso (1-10)"
            type="number"
            min="1"
            max="10"
            value={q.weight}
            onChange={(e) => onUpdate('weight', parseInt(e.target.value) || 1)}
          />
          <div className="flex flex-col justify-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={q.is_critical}
                onChange={(e) => onUpdate('is_critical', e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#967DF5' }}
              />
              <span className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>Critica</span>
            </label>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Bloquea avance si falla</p>
          </div>
        </div>

        {/* Respuesta deseada */}
        <div>
          <Textarea
            label="Respuesta deseada"
            placeholder="Describe como deberia lucir una respuesta ideal. El agente de IA usara esto para evaluar la calidad de la respuesta del candidato..."
            rows={3}
            value={q.desired_answer ?? ''}
            onChange={(e) => onUpdate('desired_answer', e.target.value)}
          />
          <p className="text-xs mt-1" style={{ color: '#C4B2F9' }}>
            Esta descripcion es un template de referencia, no un texto que se lee al candidato.
          </p>
        </div>

        {/* Keywords separator */}
        <div className="grid grid-cols-2 gap-4">
          {/* Palabras clave positivas */}
          <ChipInput
            label="Palabras clave importantes"
            sublabel="Terminos que suman puntaje cuando el candidato los menciona"
            placeholder="ej: escalabilidad, microservicios..."
            values={posKeywords}
            onChange={onPosChange}
            accentColor="#8ED9C4"
            accentBg="#DAFBF2"
          />

          {/* Palabras no deseadas */}
          <ChipInput
            label="Palabras no deseadas"
            sublabel="Terminos que generan alerta o reducen puntaje"
            placeholder="ej: nunca lo use, no se..."
            values={riskKeywords}
            onChange={onRiskChange}
            accentColor="#FF596D"
            accentBg="#FFF4F2"
          />
        </div>

        {/* Criterios de evaluacion */}
        <Textarea
          label="Criterios de evaluacion (instruccion interna para la IA)"
          placeholder="Explica que aspectos debe considerar la IA al calificar: metodologia, profundidad tecnica, ejemplos concretos, etc. Este texto NO es leido al candidato."
          rows={2}
          value={q.eval_criteria ?? ''}
          onChange={(e) => onUpdate('eval_criteria', e.target.value)}
        />
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NewQuestionSetPage() {
  const router = useRouter();
  const [questions,    setQuestions]    = useState<DraftQuestion[]>([emptyQuestion()]);
  const [posKeywords,  setPosKeywords]  = useState<string[][]>([[]]);
  const [riskKeywords, setRiskKeywords] = useState<string[][]>([[]]);

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
    try {
      const qs = questions.map((q, i) => ({
        ...q,
        positive_keywords: posKeywords[i],
        risk_keywords:     riskKeywords[i],
        order_index:       i,
      }));
      const res = await questionSetsApi.create({ ...data, questions: qs });
      router.push(`/question-sets/${res.data.id}`);
    } catch {
      router.push('/question-sets');
    }
  };

  return (
    <div className="max-w-3xl">
      <Header title="Nuevo cuestionario" subtitle="Banco de preguntas para profiling de voz con IA">
        <Link href="/question-sets">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </Link>
      </Header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Datos generales */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold" style={{ color: '#1E1B4B' }}>Datos del cuestionario</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nombre del cuestionario"
              placeholder="ej. Ingenieros Backend Senior - Tecnico y Valores"
              error={errors.name?.message}
              required
              {...register('name')}
            />
            <Textarea
              label="Descripcion (opcional)"
              placeholder="Contexto, objetivo y perfil de candidato al que aplica este cuestionario..."
              rows={3}
              {...register('description')}
            />
          </CardContent>
        </Card>

        {/* Preguntas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold" style={{ color: '#1E1B4B' }}>
                Preguntas <span style={{ color: '#9CA3AF', fontWeight: 400 }}>({questions.length})</span>
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                Define el texto, la respuesta deseada y las palabras clave para la evaluacion de IA.
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

        <div className="flex justify-end gap-3 pb-8">
          <Link href="/question-sets">
            <Button type="button" variant="secondary">Cancelar</Button>
          </Link>
          <Button type="submit" loading={isSubmitting}>
            Guardar cuestionario
          </Button>
        </div>
      </form>
    </div>
  );
}
