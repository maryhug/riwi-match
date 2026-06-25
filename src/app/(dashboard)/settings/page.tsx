'use client';

import { useState } from 'react';
import { Settings, CheckCircle2, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Header from '@/components/layout/Header';

type Tab = 'usuarios' | 'parametros' | 'integraciones';

const TABS: { key: Tab; label: string }[] = [
  { key: 'usuarios',      label: 'Usuarios' },
  { key: 'parametros',    label: 'Parámetros de IA' },
  { key: 'integraciones', label: 'Integraciones' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('usuarios');

  return (
    <div className="space-y-5">
      <Header title="Configuración global" subtitle="Administración" />

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {TABS.map(({ key, label }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px ${
                active
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === 'usuarios' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <Settings className="w-9 h-9 text-slate-200" />
            <p className="font-medium text-slate-500 text-sm">Gestión de usuarios</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Este módulo estará disponible cuando el backend implemente el endpoint de administración de usuarios.
            </p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'parametros' && (
        <Card>
          <CardContent className="p-0 divide-y divide-slate-100">
            {[
              {
                label: 'Modelo activo',
                control: (
                  <div className="relative flex items-center">
                    <select className="text-xs border-none bg-transparent text-slate-900 font-medium cursor-pointer focus:ring-0 focus:outline-none appearance-none pr-5 z-10" style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}>
                      <option>gpt-X - medium</option>
                    </select>
                    <ChevronDown className="absolute right-0 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                  </div>
                ),
              },
              {
                label: 'Prompt de match',
                control: (
                  <div className="relative flex items-center">
                    <select className="text-xs border-none bg-transparent text-slate-900 font-medium cursor-pointer focus:ring-0 focus:outline-none appearance-none pr-5 z-10" style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}>
                      <option>Prompt match v3 — activo</option>
                    </select>
                    <ChevronDown className="absolute right-0 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                  </div>
                ),
              },
              {
                label: 'Umbral Match alto',
                control: <input type="number" defaultValue={80} className="w-16 text-right text-xs border border-slate-200 rounded-md py-1.5 px-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-colors" />,
              },
              {
                label: 'Umbral Match medio',
                control: <input type="number" defaultValue={60} className="w-16 text-right text-xs border border-slate-200 rounded-md py-1.5 px-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-colors" />,
              },
              {
                label: 'Umbral Match bajo',
                control: <input type="number" defaultValue={40} className="w-16 text-right text-xs border border-slate-200 rounded-md py-1.5 px-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-colors" />,
              },
            ].map(({ label, control }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-xs font-medium text-slate-700">{label}</span>
                {control}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === 'integraciones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { title: 'n8n · Webhook', subtitle: 'https://n8n.riwi.io/webhook/riwi-match', apiKey: '•••••••••••••a3f2' },
            { title: 'Modelo de voz · Vapi', subtitle: 'Voice assistant provider', apiKey: '•••••••••••••b81c' },
          ].map((integration) => (
            <Card key={integration.title}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center">
                    <Settings className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Conectado
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{integration.title}</h3>
                <p className="text-xs text-slate-400 mb-5">{integration.subtitle}</p>

                <div className="mb-5">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">API key</p>
                  <p className="text-xs font-medium text-slate-900 tracking-widest">{integration.apiKey}</p>
                </div>

                <button className="w-full py-2 bg-violet-600 text-white rounded-md text-xs font-semibold hover:bg-violet-700 transition-colors">
                  Probar conexión
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
