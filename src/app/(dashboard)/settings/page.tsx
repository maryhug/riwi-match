'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { settingsApi } from '@/lib/api';

type MatchThresholds = { high: number; medium: number; low: number };
const DEFAULT_THRESHOLDS: MatchThresholds = { high: 80, medium: 60, low: 40 };

type Tab = 'usuarios' | 'parametros' | 'integraciones';

const TABS: { key: Tab; label: string }[] = [
  { key: 'usuarios',      label: 'Usuarios' },
  { key: 'parametros',    label: 'Parámetros de IA' },
  { key: 'integraciones', label: 'Integraciones' },
];

function AIParamsPanel() {
  const qc = useQueryClient();

  const { data: models = [], isLoading: loadingModels } = useQuery({
    queryKey: ['ai-models'],
    queryFn: () => settingsApi.getModels().then((r) => r.data),
  });
  const matchModels = models.filter((m) => m.task_type === 'CV_MATCH');

  const { data: prompts = [], isLoading: loadingPrompts } = useQuery({
    queryKey: ['ai-prompts'],
    queryFn: () => settingsApi.getPrompts().then((r) => r.data),
  });
  const matchPrompts = prompts.filter((p) => p.task_type === 'CV_MATCH');

  const { data: globalSettings = [] } = useQuery({
    queryKey: ['global-settings'],
    queryFn: () => settingsApi.getGlobalSettings().then((r) => r.data),
  });
  const thresholdsSetting = globalSettings.find((s) => s.setting_key === 'match_thresholds');
  // Valor guardado en el backend (o default) + ediciones locales del usuario aún no guardadas.
  // Se deriva en el render en vez de sincronizarse vía efecto.
  const savedThresholds: MatchThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...(thresholdsSetting?.setting_value as Partial<MatchThresholds> | undefined),
  };
  const [thresholdOverrides, setThresholdOverrides] = useState<Partial<MatchThresholds>>({});
  const thresholds: MatchThresholds = { ...savedThresholds, ...thresholdOverrides };

  const [newModelName, setNewModelName] = useState('');
  const createModelMutation = useMutation({
    mutationFn: (modelName: string) =>
      settingsApi.createModel({ task_type: 'CV_MATCH', provider: 'OPENAI', model_name: modelName }),
    onSuccess: () => {
      setNewModelName('');
      qc.invalidateQueries({ queryKey: ['ai-models'] });
    },
  });

  const activateModelMutation = useMutation({
    mutationFn: (modelId: string) => settingsApi.setActiveModel(modelId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-models'] }),
  });

  const [newPromptText, setNewPromptText] = useState('');
  const createPromptMutation = useMutation({
    mutationFn: (text: string) =>
      settingsApi.updatePrompt({
        task_type: 'CV_MATCH',
        version_name: `v${matchPrompts.length + 1}`,
        system_prompt_text: text,
        activate: true,
      }),
    onSuccess: () => {
      setNewPromptText('');
      qc.invalidateQueries({ queryKey: ['ai-prompts'] });
    },
  });

  const thresholdsMutation = useMutation({
    mutationFn: (t: MatchThresholds) => settingsApi.updateThresholds(t),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['global-settings'] }),
  });

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5 space-y-3">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Modelo activo (match de CVs)</p>
          {loadingModels ? (
            <p className="text-xs text-slate-400">Cargando...</p>
          ) : matchModels.length === 0 ? (
            <p className="text-xs text-slate-400">Aún no hay modelos configurados para CV_MATCH.</p>
          ) : (
            <Select
              value={matchModels.find((m) => m.is_active)?.id ?? ''}
              onChange={(e) => e.target.value && activateModelMutation.mutate(e.target.value)}
              options={[
                { value: '', label: 'Selecciona un modelo' },
                ...matchModels.map((m) => ({ value: m.id, label: `${m.model_name} (${m.provider})${m.is_active ? ' — activo' : ''}` })),
              ]}
            />
          )}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nombre del modelo, ej. gpt-4o"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!newModelName.trim() || createModelMutation.isPending}
              onClick={() => createModelMutation.mutate(newModelName.trim())}
            >
              Agregar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Prompt de match</p>
          {loadingPrompts ? (
            <p className="text-xs text-slate-400">Cargando...</p>
          ) : matchPrompts.length === 0 ? (
            <p className="text-xs text-slate-400">Aún no hay versiones de prompt para CV_MATCH.</p>
          ) : (
            <ul className="text-xs text-slate-600 space-y-1">
              {matchPrompts.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span>{p.version_name}</span>
                  {p.is_active && <span className="text-emerald-600 font-semibold">activo</span>}
                </li>
              ))}
            </ul>
          )}
          <textarea
            rows={3}
            placeholder="Nuevo texto de prompt (se guarda como versión nueva y se activa)"
            value={newPromptText}
            onChange={(e) => setNewPromptText(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 resize-none"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!newPromptText.trim() || createPromptMutation.isPending}
            onClick={() => createPromptMutation.mutate(newPromptText.trim())}
          >
            Guardar nueva versión
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Umbrales de match</p>
          <div className="flex items-center gap-4">
            {(['high', 'medium', 'low'] as const).map((key) => (
              <label key={key} className="flex items-center gap-2 text-xs text-slate-600">
                {key === 'high' ? 'Alto' : key === 'medium' ? 'Medio' : 'Bajo'}
                <input
                  type="number"
                  value={thresholds[key]}
                  onChange={(e) => setThresholdOverrides((o) => ({ ...o, [key]: Number(e.target.value) }))}
                  className="w-16 text-right text-xs border border-slate-200 rounded-md py-1.5 px-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
                />
              </label>
            ))}
          </div>
          <Button
            size="sm"
            disabled={thresholdsMutation.isPending}
            onClick={() => thresholdsMutation.mutate(thresholds)}
          >
            {thresholdsMutation.isPending ? 'Guardando...' : 'Guardar umbrales'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

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

      {activeTab === 'parametros' && <AIParamsPanel />}

      {activeTab === 'integraciones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { title: 'n8n · Webhook', subtitle: 'https://n8n.riwi.io/webhook/riwi-match', apiKey: '•••••••••••••a3f2' },
            { title: 'Modelo de voz · Vapi', subtitle: 'Voice assistant provider', apiKey: '•••••••••••••b81c' },
          ].map((integration) => (
            <Card key={integration.title}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-9 h-9 rounded bg-violet-600 flex items-center justify-center">
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
