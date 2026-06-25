'use client';

import { PhoneCall, ListTodo, PhoneForwarded, PhoneMissed, X, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Header from '@/components/layout/Header';



function TopCard({ label, value, icon: Icon, color }: any) {
  return (
    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-3xl font-bold" style={{ color: '#1E1B4B' }}>{value}</p>
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

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <TopCard label="LLAMADAS ACTIVAS" value="4 / 4" icon={PhoneCall} color={{ bg: '#F3E8FF', text: '#9333EA' }} />
        <TopCard label="EN COLA" value="3" icon={ListTodo} color={{ bg: '#F1F5F9', text: '#64748B' }} />
        <TopCard label="COMPLETADAS HOY" value="12" icon={PhoneForwarded} color={{ bg: '#ECFDF5', text: '#10B981' }} />
        <TopCard label="TASA DE CONTACTO" value="78%" icon={PhoneMissed} color={{ bg: '#FFF7ED', text: '#F97316' }} />
      </div>

      {/* Settings Info Bar */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-500">
        <div className="flex items-center gap-4 font-medium">
          <span className="text-violet-600">Máx 3 intentos</span>
          <span>·</span>
          <span className="text-violet-600">Cada 2h</span>
          <span>·</span>
          <span className="text-violet-600">Horario 8:00 - 18:00</span>
        </div>
        <p>AIA + modelo de voz: cada llamada informa que es un asistente automatizado y solicita consentimiento.</p>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-2 items-start">
        
        {/* Column 1: En llamada */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 mb-4">
            <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-600"></div>
              En llamada <span className="text-slate-400 font-normal">(máx. 4)</span>
            </h4>
            <span className="text-xs font-semibold text-slate-400">4</span>
          </div>
          
          {[
            { id: 1, name: 'Daniel Cárdenas', role: 'Backend Sr', time: '02:14' },
            { id: 2, name: 'Mariana Ospina', role: 'Backend Sr', time: '04:32' },
            { id: 3, name: 'Esteban Quintero', role: 'Backend Sr', time: '01:03' },
            { id: 4, name: 'Sara Gutiérrez', role: 'Backend Sr', time: '02:45' },
          ].map((c) => (
            <Card key={c.id} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-violet-200 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-violet-700">{c.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{c.name}</p>
                    <p className="text-[10px] text-slate-400">{c.role}</p>
                  </div>
                </div>
                <div className="my-4 py-3 bg-violet-50 rounded-lg flex flex-col items-center justify-center border border-violet-100">
                  <span className="text-[10px] text-violet-500 font-semibold mb-1 uppercase tracking-wider">Duración de la llamada</span>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"></span>
                    </span>
                    <span className="text-2xl font-mono text-violet-700 font-bold">{c.time}</span>
                  </div>
                </div>
                <div className="flex justify-end items-center mt-1">
                  <span className="text-[10px] font-bold text-violet-600 px-2 py-0.5 bg-violet-100 rounded">En vivo</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Column 2: En cola */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 mb-4">
            <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-600"></div>
              En cola
            </h4>
            <span className="text-xs font-semibold text-slate-400">3</span>
          </div>

          {[
            { id: 1, name: 'Laura Mendoza', role: 'Backend Sr' },
            { id: 2, name: 'Juan Pablo Henao', role: 'Backend Sr' },
            { id: 3, name: 'Carlos Aristizábal', role: 'Backend Sr' },
          ].map((c) => (
            <Card key={c.id} className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-xl overflow-hidden opacity-80">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-slate-500">#{c.id}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 text-xs">{c.name}</p>
                  <p className="text-[10px] text-slate-400">{c.role}</p>
                </div>
                <button className="text-slate-300 hover:text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Column 3: Completadas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 mb-4">
            <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              Completadas
            </h4>
            <span className="text-xs font-semibold text-slate-400">2</span>
          </div>

          {[
            { id: 1, name: 'Camilo Restrepo', role: 'DevOps' },
            { id: 2, name: 'Diana Marín', role: 'DevOps' },
          ].map((c) => (
            <Card key={c.id} className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-xl overflow-hidden opacity-90">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-emerald-700">{c.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-xs">{c.name}</p>
                    <p className="text-[10px] text-slate-400">{c.role}</p>
                  </div>
                </div>
                <button className="text-[10px] font-semibold text-violet-600 hover:text-violet-700">Respuestas</button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Column 4: No contactadas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 mb-4">
            <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              No contactadas
            </h4>
            <span className="text-xs font-semibold text-slate-400">1</span>
          </div>

          {[
            { id: 1, name: 'Miguel Ángel Soto', role: 'Backend Sr' },
          ].map((c) => (
            <Card key={c.id} className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-xl overflow-hidden bg-slate-50/50">
              <CardContent className="p-4">
                <div className="flex gap-3 mb-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-red-700">{c.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-xs">{c.name}</p>
                    <p className="text-[10px] text-slate-400">{c.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-red-50 px-2 py-1.5 rounded border border-red-100 text-red-700">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-[10px] font-semibold">Rechazo 2/3 - Hoy 14:30</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}
