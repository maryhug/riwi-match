'use client';

import { useQuery } from '@tanstack/react-query';
import { PhoneCall, ListTodo, PhoneForwarded, PhoneMissed, Mic } from 'lucide-react';
import Header from '@/components/layout/Header';
import { processesApi } from '@/lib/api';

// RB-005: límite de concurrencia configurado en el backend (settings.max_concurrent_calls, default 4).
const MAX_CONCURRENT_CALLS = 4;

function StatCard({ label, value, icon: Icon, accentColor, iconBg }: {
  label: string; value: string; icon: React.ElementType; accentColor: string; iconBg: string;
}) {
  return (
    <div
      className="bg-white rounded p-5 flex items-center justify-between"
      style={{
        border: '1px solid #E2E8F0',
        borderLeft: `4px solid ${accentColor}`,
      }}
    >
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <div className="w-9 h-9 rounded flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        <Icon className="w-4.5 h-4.5" style={{ color: accentColor }} />
      </div>
    </div>
  );
}

export default function ProfilingPage() {
  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['profiling-runs-global'],
    queryFn: () => processesApi.getGlobalProfilingRuns().then((r) => r.data),
    refetchInterval: 10000,
  });

  const activeCount = runs.filter((r) => r.status === 'CALLING').length;
  const queuedCount = runs.filter((r) => r.status === 'PENDING').length;
  const completedCount = runs.filter((r) => r.status === 'COMPLETED').length;
  const failedCount = runs.filter((r) => r.status === 'FAILED' || r.status === 'NO_ANSWER').length;
  const contactableTotal = completedCount + failedCount;
  const contactRate = contactableTotal > 0
    ? `${Math.round((completedCount / contactableTotal) * 100)}%`
    : '—';

  return (
    <div className="space-y-5">
      <Header title="Ejecución de Profiling" subtitle="Monitor en vivo de las llamadas de profiling automatizado." />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Llamadas activas" value={isLoading ? '—' : `${activeCount} / ${MAX_CONCURRENT_CALLS}`} icon={PhoneCall}     accentColor="#7C3AED" iconBg="#EDE9FE" />
        <StatCard label="En cola"          value={isLoading ? '—' : `${queuedCount}`}                            icon={ListTodo}       accentColor="#94A3B8" iconBg="#F1F5F9" />
        <StatCard label="Completadas"      value={isLoading ? '—' : `${completedCount}`}                         icon={PhoneForwarded} accentColor="#059669" iconBg="#ECFDF5" />
        <StatCard label="Tasa contacto"    value={isLoading ? '—' : contactRate}                                 icon={PhoneMissed}    accentColor="#D97706" iconBg="#FEF3C7" />
      </div>

      {!isLoading && runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-12 h-12 rounded bg-violet-50 flex items-center justify-center">
            <Mic className="w-6 h-6 text-violet-600" />
          </div>
          <p className="font-semibold text-slate-700 text-sm">Profiling de voz no iniciado</p>
          <p className="text-xs text-slate-400 text-center max-w-sm">
            Para iniciar llamadas de profiling, ve a un proceso con match completado, selecciona candidatos en el Kanban y presiona &quot;Iniciar profiling&quot;.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded divide-y divide-slate-100">
          {runs.map((run) => (
            <div key={run.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{run.candidate?.name} {run.candidate?.last_name}</p>
                <p className="text-xs text-slate-400">{run.call_attempts} intento(s)</p>
              </div>
              <div className="flex items-center gap-3">
                {run.advancement_prob && (
                  <span className="text-xs font-semibold text-violet-700">Prob: {run.advancement_prob}</span>
                )}
                <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">{run.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
