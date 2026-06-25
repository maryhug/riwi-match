'use client';

import { PhoneCall, ListTodo, PhoneForwarded, PhoneMissed, Mic } from 'lucide-react';
import Header from '@/components/layout/Header';

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
  return (
    <div className="space-y-5">
      <Header title="Ejecución de Profiling" subtitle="Monitor en vivo de las llamadas de profiling automatizado." />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Llamadas activas" value="0 / 4" icon={PhoneCall}     accentColor="#7C3AED" iconBg="#EDE9FE" />
        <StatCard label="En cola"          value="0"     icon={ListTodo}       accentColor="#94A3B8" iconBg="#F1F5F9" />
        <StatCard label="Completadas"      value="0"     icon={PhoneForwarded} accentColor="#059669" iconBg="#ECFDF5" />
        <StatCard label="Tasa contacto"    value="—"     icon={PhoneMissed}    accentColor="#D97706" iconBg="#FEF3C7" />
      </div>

      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-12 h-12 rounded bg-violet-50 flex items-center justify-center">
          <Mic className="w-6 h-6 text-violet-600" />
        </div>
        <p className="font-semibold text-slate-700 text-sm">Profiling de voz no iniciado</p>
        <p className="text-xs text-slate-400 text-center max-w-sm">
          Para iniciar llamadas de profiling, ve a un proceso con match completado, selecciona candidatos en el Kanban y presiona &quot;Iniciar profiling&quot;.
        </p>
      </div>
    </div>
  );
}
