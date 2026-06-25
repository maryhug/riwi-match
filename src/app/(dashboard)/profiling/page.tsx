'use client';

import { PhoneCall, ListTodo, PhoneForwarded, PhoneMissed, Mic } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Header from '@/components/layout/Header';

function TopCard({ label, value, icon: Icon, color }: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: { bg: string; text: string };
}) {
  return (
    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--color-ink)' }}>{value}</p>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: color.bg }}>
          <Icon className="w-5 h-5" style={{ color: color.text }} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfilingPage() {
  return (
    <div className="space-y-6">
      <Header title="Ejecución de Profiling" subtitle="Monitor en vivo de las llamadas de profiling automatizado." />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <TopCard label="LLAMADAS ACTIVAS" value="0 / 4" icon={PhoneCall}      color={{ bg: '#F3E8FF', text: '#9333EA' }} />
        <TopCard label="EN COLA"          value="0"     icon={ListTodo}        color={{ bg: '#F1F5F9', text: '#64748B' }} />
        <TopCard label="COMPLETADAS"      value="0"     icon={PhoneForwarded}  color={{ bg: '#ECFDF5', text: '#10B981' }} />
        <TopCard label="TASA CONTACTO"    value="—"     icon={PhoneMissed}     color={{ bg: '#FFF7ED', text: '#F97316' }} />
      </div>

      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center">
          <Mic className="w-7 h-7 text-primary-dark" />
        </div>
        <p className="font-semibold text-slate-700">Profiling de voz no iniciado</p>
        <p className="text-sm text-slate-400 text-center max-w-sm">
          Para iniciar llamadas de profiling, ve a un proceso con match completado, selecciona candidatos en el Kanban y presiona "Iniciar profiling".
        </p>
      </div>
    </div>
  );
}
