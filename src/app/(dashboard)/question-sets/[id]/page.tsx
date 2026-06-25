'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Star, GripVertical, Trash2, Edit2, Plus, X,
  CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { questionSetsApi } from '@/lib/api';
import type { ProfilingQuestion, QuestionSet } from '@/lib/types';

const TYPE_LABELS: Record<string, string> = {
  OPEN: 'Abierta',
  CLOSED: 'Cerrada',
  MULTIPLE_CHOICE: 'Múltiple',
  YES_NO: 'Sí / No',
  NUMERIC: 'Numérica',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT:    { label: 'Borrador', bg: '#F1F5F9', color: '#64748B' },
  ACTIVE:   { label: 'Activo',   bg: '#DCFCE7', color: '#16A34A' },
  ARCHIVED: { label: 'Archivado', bg: '#FEF9C3', color: '#92400E' },
};

// ─── Chip keyword input ────────────────────────────────────────────────────────
function ChipInput({
  label, values, onChange, accentColor, accentBg,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  accentColor: string;
  accentBg: string;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const t = input.trim().toLowerCase();
    if (t && !values.includes(t)) onChange([...values, t]);
    setInput('');
  };
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          placeholder="Escribe y presiona Enter"
          className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
        />
        <button type="button" onClick={add}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
          style={{ background: accentColor }}>+</button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {values.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: accentBg, color: accentColor }}>
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

// ─── Question form state ───────────────────────────────────────────────────────
interface QForm {
  text: string;
  type: string;
  weight: number;
  is_critical: boolean;
  positive_keywords: string[];
  risk_keywords: string[];
  expected_answer: string;
  eval_criteria: string;
}

const emptyForm = (): QForm => ({
  text: '',
  type: 'OPEN',
  weight: 10,
  is_critical: false,
  positive_keywords: [],
  risk_keywords: [],
  expected_answer: '',
  eval_criteria: '',
});

// ─── Question modal ────────────────────────────────────────────────────────────
function QuestionModal({
  setId,
  editing,
  onClose,
}: {
  setId: string;
  editing: ProfilingQuestion | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<QForm>(
    editing
      ? {
          text: editing.text,
          type: editing.type,
          weight: editing.weight,
          is_critical: editing.is_critical,
          positive_keywords: editing.positive_keywords ?? [],
          risk_keywords: editing.risk_keywords ?? [],
          expected_answer: editing.desired_answer ?? '',
          eval_criteria: editing.eval_criteria ?? '',
        }
      : emptyForm()
  );

  const set = (k: keyof QForm, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        text: form.text.trim(),
        type: form.type,
        weight: form.weight,
        is_critical: form.is_critical,
        positive_keywords: form.positive_keywords,
        risk_keywords: form.risk_keywords,
        expected_answer: form.expected_answer || undefined,
        eval_criteria: form.eval_criteria || undefined,
      };
      return editing
        ? questionSetsApi.updateQuestion(setId, editing.id, payload as Partial<Omit<ProfilingQuestion, 'id' | 'question_set_id'>>)
        : questionSetsApi.addQuestion(setId, { ...payload, order_index: 0 } as Omit<ProfilingQuestion, 'id' | 'question_set_id'>);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['question-set', setId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl my-auto">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-semibold text-slate-900">
            {editing ? 'Editar pregunta' : 'Nueva pregunta'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Texto */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Pregunta *
            </label>
            <textarea
              value={form.text}
              onChange={(e) => set('text', e.target.value)}
              placeholder="Ej. ¿Cuántos años de experiencia tienes con este stack?"
              className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] resize-none"
            />
          </div>

          {/* Tipo + Peso */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Peso % (1–100)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.weight}
                onChange={(e) => set('weight', Number(e.target.value))}
                className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Respuesta esperada */}
          {(form.type === 'CLOSED' || form.type === 'YES_NO') && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Respuesta esperada
              </label>
              <input
                type="text"
                value={form.expected_answer}
                onChange={(e) => set('expected_answer', e.target.value)}
                placeholder="Ej. Sí / No"
                className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Keywords — solo para OPEN */}
          {form.type === 'OPEN' && (
            <div className="grid grid-cols-2 gap-6">
              <ChipInput
                label="Keywords positivas"
                values={form.positive_keywords}
                onChange={(v) => set('positive_keywords', v)}
                accentColor="#10B981"
                accentBg="#DCFCE7"
              />
              <ChipInput
                label="Keywords de riesgo"
                values={form.risk_keywords}
                onChange={(v) => set('risk_keywords', v)}
                accentColor="#F97316"
                accentBg="#FFF7ED"
              />
            </div>
          )}

          {/* Criterio de evaluación */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Criterio de evaluación (opcional)
            </label>
            <input
              type="text"
              value={form.eval_criteria}
              onChange={(e) => set('eval_criteria', e.target.value)}
              placeholder="Ej. Esperar respuesta positiva sobre disponibilidad"
              className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Crítica */}
          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={form.is_critical}
              onChange={(e) => set('is_critical', e.target.checked)}
              className="w-4 h-4 text-primary-dark rounded border-slate-300 focus:ring-primary"
            />
            <div>
              <span className="block text-sm font-semibold text-slate-900">Pregunta crítica (dealbreaker)</span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Si el candidato falla esta pregunta, se marcará para revisión urgente.
              </span>
            </div>
          </label>

          {mutation.isError && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Error al guardar la pregunta.
            </p>
          )}
        </div>

        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 rounded-b-3xl">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!form.text.trim()}
          >
            {editing ? 'Guardar cambios' : 'Agregar pregunta'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function QuestionSetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; editing: ProfilingQuestion | null }>({
    open: false,
    editing: null,
  });

  const { data: set, isLoading } = useQuery({
    queryKey: ['question-set', id],
    queryFn: () => questionSetsApi.get(id).then((r) => r.data as QuestionSet),
  });

  const deleteMutation = useMutation({
    mutationFn: (qId: string) => questionSetsApi.deleteQuestion(id, qId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['question-set', id] }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => questionSetsApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['question-set', id] }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!set) return null;

  const questions: ProfilingQuestion[] = (set.questions ?? []).sort(
    (a, b) => a.order_index - b.order_index
  );
  const totalWeight = questions.reduce((s, q) => s + q.weight, 0);
  const statusCfg = STATUS_CONFIG[set.status] ?? STATUS_CONFIG.DRAFT;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="pt-2 pb-6 border-b border-slate-100">
        <Link href="/question-sets" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Volver a sets
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>{set.name}</h1>
              <span className="text-xs font-bold text-primary-dark px-2 py-0.5 bg-primary-xlight rounded">
                v{set.version}
              </span>
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: statusCfg.bg, color: statusCfg.color }}
              >
                {statusCfg.label}
              </span>
            </div>
            {set.description && <p className="text-sm text-slate-500">{set.description}</p>}
            <p className="text-xs text-slate-400 mt-1">
              {questions.length} preguntas · Peso total: {totalWeight}%
            </p>
          </div>

          {/* Acciones de estado */}
          <div className="flex items-center gap-2 shrink-0">
            {set.status === 'DRAFT' && (
              <Button
                size="sm"
                onClick={() => statusMutation.mutate('ACTIVE')}
                loading={statusMutation.isPending}
              >
                <CheckCircle2 className="w-4 h-4" />
                Activar set
              </Button>
            )}
            {set.status === 'ACTIVE' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => statusMutation.mutate('ARCHIVED')}
                loading={statusMutation.isPending}
              >
                Archivar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm font-medium">Sin preguntas aún</p>
            <p className="text-xs mt-1">Agrega la primera pregunta para empezar a configurar el set.</p>
          </div>
        ) : (
          questions.map((q, index) => (
            <Card key={q.id} className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl overflow-hidden group">
              <CardContent className="p-0 flex items-stretch">
                <div className="w-10 flex items-center justify-center bg-slate-50/50 border-r border-slate-100 text-slate-300 group-hover:text-slate-400 transition-colors shrink-0">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="flex-1 p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        #{index + 1}
                      </span>
                      <span className="text-[10px] font-bold text-primary-dark px-2 py-0.5 bg-primary-xlight rounded">
                        {TYPE_LABELS[q.type] ?? q.type}
                      </span>
                      {q.is_critical && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 px-2 py-0.5 bg-orange-50 rounded">
                          <Star className="w-3 h-3 fill-orange-600" />
                          Crítica
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-semibold text-slate-900">Peso: {q.weight}%</span>
                      <button
                        onClick={() => setModal({ open: true, editing: q })}
                        className="text-slate-300 hover:text-primary-dark transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(q.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-900 mb-3">{q.text}</p>

                  {q.eval_criteria && (
                    <p className="text-xs text-slate-400 italic mb-2">Criterio: {q.eval_criteria}</p>
                  )}

                  <div className="space-y-1.5">
                    {(q.positive_keywords ?? []).length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap text-[10px]">
                        <span className="text-slate-400 font-medium">Positivas:</span>
                        {(q.positive_keywords ?? []).map((kw) => (
                          <span key={kw} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                    {(q.risk_keywords ?? []).length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap text-[10px]">
                        <span className="text-slate-400 font-medium">Riesgo:</span>
                        {(q.risk_keywords ?? []).map((kw) => (
                          <span key={kw} className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium border border-orange-100">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add question button */}
      <button
        onClick={() => setModal({ open: true, editing: null })}
        className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:text-primary-dark hover:border-primary-light hover:bg-primary-xlight/50 transition-all flex items-center justify-center gap-2 font-medium text-sm"
      >
        <Plus className="w-5 h-5" />
        Nueva pregunta
      </button>

      {/* Modal */}
      {modal.open && (
        <QuestionModal
          setId={id}
          editing={modal.editing}
          onClose={() => setModal({ open: false, editing: null })}
        />
      )}
    </div>
  );
}
