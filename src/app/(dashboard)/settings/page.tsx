'use client';

import { useState } from 'react';
import { Settings, CheckCircle2, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Header from '@/components/layout/Header';

type Tab = 'usuarios' | 'parametros' | 'integraciones';

const TABS: { key: Tab; label: string }[] = [
  { key: 'usuarios', label: 'Usuarios' },
  { key: 'parametros', label: 'Parámetros de IA' },
  { key: 'integraciones', label: 'Integraciones' },
];

const INITIAL_USERS = [
  { id: 1, name: 'Camila Restrepo', email: 'camila@riwi.io', role: 'Recruiter', status: 'Activo' },
  { id: 2, name: 'Julián Marín', email: 'julian@riwi.io', role: 'Recruiter', status: 'Activo' },
  { id: 3, name: 'Andrés López', email: 'andres@riwi.io', role: 'Recruiter', status: 'Activo' },
  { id: 4, name: 'Laura Vélez', email: 'laura@riwi.io', role: 'Recruiter', status: 'Inactivo' },
  { id: 5, name: 'Sofía Henríquez', email: 'sofia@riwi.io', role: 'Líder TA', status: 'Activo' },
  { id: 6, name: 'Mateo Vargas', email: 'mateo@riwi.io', role: 'Administrador', status: 'Activo' },
];

const ROLES = ['Recruiter', 'Líder TA', 'Administrador'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('usuarios');
  const [users, setUsers] = useState(INITIAL_USERS);

  const handleRoleChange = (id: number, newRole: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  return (
    <div>
      <Header title="Configuración global" subtitle="ADMINISTRACIÓN" />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(({ key, label }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: active ? 'var(--color-primary)' : 'white',
                color: active ? 'white' : '#6B7280',
                border: active ? 'none' : '1px solid #E5E7EB',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === 'usuarios' && (
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-white">
                  <th className="px-8 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">USUARIO</th>
                  <th className="px-8 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">EMAIL</th>
                  <th className="px-8 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">ROL</th>
                  <th className="px-8 py-4 font-semibold text-slate-500 uppercase tracking-wide text-xs">ESTADO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-medium text-slate-900">{user.name}</td>
                    <td className="px-8 py-5 text-slate-500">{user.email}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="text-sm border-none bg-transparent text-slate-700 font-medium cursor-pointer focus:ring-0 focus:outline-none pr-2"
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                        >
                          {ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                        {/* Custom dropdown arrow */}
                        <ChevronDown className="text-slate-400 w-4 h-4 shrink-0 pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
                        style={{
                          background: user.status === 'Activo' ? '#DAFBF2' : '#F3F4F6',
                          color: user.status === 'Activo' ? '#8ED9C4' : '#6B7280'
                        }}
                      >
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'parametros' && (
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between p-6">
                <span className="text-sm font-medium text-slate-700">Modelo activo</span>
                <div className="relative flex items-center">
                  <select className="text-sm border-none bg-transparent text-slate-900 font-medium cursor-pointer focus:ring-0 focus:outline-none appearance-none pr-6 z-10" style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}>
                    <option>gpt-X - medium</option>
                  </select>
                  <ChevronDown className="absolute right-0 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center justify-between p-6">
                <span className="text-sm font-medium text-slate-700">Prompt de match</span>
                <div className="relative flex items-center">
                  <select className="text-sm border-none bg-transparent text-slate-900 font-medium cursor-pointer focus:ring-0 focus:outline-none appearance-none pr-6 z-10" style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}>
                    <option>Prompt match v3 — activo</option>
                  </select>
                  <ChevronDown className="absolute right-0 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center justify-between p-6">
                <span className="text-sm font-medium text-slate-700">Umbral Match alto</span>
                <input type="number" defaultValue={80} className="w-20 text-right text-sm border border-slate-200 rounded-lg py-1.5 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex items-center justify-between p-6">
                <span className="text-sm font-medium text-slate-700">Umbral Match medio</span>
                <input type="number" defaultValue={60} className="w-20 text-right text-sm border border-slate-200 rounded-lg py-1.5 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex items-center justify-between p-6">
                <span className="text-sm font-medium text-slate-700">Umbral Match bajo</span>
                <input type="number" defaultValue={40} className="w-20 text-right text-sm border border-slate-200 rounded-lg py-1.5 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'integraciones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-[#DAFBF2] text-[#8ED9C4]">
                  <CheckCircle2 className="w-3 h-3" /> Conectado
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-1">n8n · Webhook</h3>
              <p className="text-sm text-slate-500 mb-6">https://n8n.riwi.io/webhook/riwi-match</p>
              
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">API key</p>
                <p className="text-sm font-medium text-slate-900 tracking-widest">•••••••••••••a3f2</p>
              </div>

              <button className="w-full py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors">
                Probar conexión
              </button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-[#DAFBF2] text-[#8ED9C4]">
                  <CheckCircle2 className="w-3 h-3" /> Conectado
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-1">Modelo de voz · Vapi</h3>
              <p className="text-sm text-slate-500 mb-6">Voice assistant provider</p>
              
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">API key</p>
                <p className="text-sm font-medium text-slate-900 tracking-widest">•••••••••••••b81c</p>
              </div>

              <button className="w-full py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors">
                Probar conexión
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
