'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, CheckCircle2, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { Input, Select, Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

const SENIORITY_OPTIONS = [
  { value: 'Jr', label: 'Jr' },
  { value: 'Ssr', label: 'Ssr' },
  { value: 'Sr', label: 'Sr' },
  { value: 'Lead', label: 'Lead' },
  { value: 'Manager', label: 'Manager' },
];

const AREA_OPTIONS = [
  { value: 'Tecnología', label: 'Tecnología' },
  { value: 'Producto', label: 'Producto' },
  { value: 'Diseño', label: 'Diseño' },
  { value: 'Ventas', label: 'Ventas' },
  { value: 'Marketing', label: 'Marketing' },
];

const RECRUITER_OPTIONS = [
  { value: 'Camila Restrepo', label: 'Camila Restrepo' },
  { value: 'Julián Marín', label: 'Julián Marín' },
  { value: 'Laura Vélez', label: 'Laura Vélez' },
];

const QUESTION_SET_OPTIONS = [
  { value: '', label: '—' },
  { value: '1', label: 'Desarrollador Backend Sr' },
  { value: '2', label: 'Cultura General' },
];

export default function NewProcessPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [jdTab, setJdTab] = useState<'write' | 'upload'>('write');

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else router.push('/dashboard'); // Temporary route after creation
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header with Back button integrated */}
      <div className="flex flex-col items-center justify-center pt-6 space-y-2">
        <div className="w-full relative flex items-center justify-center">
          <div className="absolute left-0">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold" style={{ color: '#1E1B4B' }}>Crear proceso</h1>
            <p className="text-sm text-slate-500">Asistente en 3 pasos para configurar tu proceso de selección.</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center w-full max-w-2xl mx-auto mb-8">
        {/* Step 1 */}
        <div className="flex items-center">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${step >= 1 ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
            {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
          </div>
          <span className={`ml-2 text-xs font-medium ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>Datos básicos</span>
        </div>
        <div className={`flex-1 h-[1px] mx-4 ${step >= 2 ? 'bg-violet-500' : 'bg-slate-200'}`} />
        
        {/* Step 2 */}
        <div className="flex items-center">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${step >= 2 ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
            {step > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
          </div>
          <span className={`ml-2 text-xs font-medium ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>Job Description</span>
        </div>
        <div className={`flex-1 h-[1px] mx-4 ${step >= 3 ? 'bg-violet-500' : 'bg-slate-200'}`} />

        {/* Step 3 */}
        <div className="flex items-center">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${step >= 3 ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
            3
          </div>
          <span className={`ml-2 text-xs font-medium ${step >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>CVs y profiling</span>
        </div>
      </div>

      {/* Step Content */}
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <CardContent className="p-8">
          
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="NOMBRE DEL PROCESO"
                  placeholder="Ej. Backend Node Sr"
                />
                <Input
                  label="CARGO"
                  placeholder="Ej. Desarrollador Backend"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="ÁREA"
                  options={AREA_OPTIONS}
                />
                <Select
                  label="SENIORITY"
                  options={SENIORITY_OPTIONS}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="RECLUTADOR RESPONSABLE"
                  options={RECRUITER_OPTIONS}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex border-b border-slate-200 mb-4">
                <button
                  className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${jdTab === 'write' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setJdTab('write')}
                >
                  Escribir JD
                </button>
                <button
                  className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${jdTab === 'upload' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setJdTab('upload')}
                >
                  Cargar archivo
                </button>
              </div>

              {jdTab === 'write' ? (
                <div className="space-y-4">
                  <Textarea 
                    placeholder="Buscamos Desarrollador Backend Sr con experiencia en Node.js, PostgreSQL y arquitectura de microservicios. Liderazgo técnico, inglés B2, disponibilidad híbrida Medellín."
                    rows={6}
                    className="resize-none"
                  />
                  <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: '#F9F7FF', border: '1px solid #EEE9FF' }}>
                    <div className="flex items-start gap-3">
                      <Wand2 className="w-5 h-5 text-violet-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Estructuración por IA</p>
                        <p className="text-xs text-slate-500">Extrae automáticamente criterios, skills y pesos sugeridos.</p>
                      </div>
                    </div>
                    <Button variant="primary" style={{ background: '#967DF5' }}>
                      Analizar JD con IA
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">Sube el documento del Job Description</h3>
                  <p className="text-sm text-slate-500 mb-4">PDF, DOCX - máx. 5 MB</p>
                  <Button variant="outline">Seleccionar archivo</Button>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-violet-500" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Arrastra los CVs aquí</h3>
                <p className="text-sm text-slate-500 mb-4">PDF, DOCX, JPG, PNG - máx. 50 por lote - 10 MB c/u</p>
                <Button variant="primary" style={{ background: '#967DF5' }}>Seleccionar archivos</Button>
              </div>

              <div>
                <Select
                  label="SET DE PREGUNTAS [OPCIONAL]"
                  options={QUESTION_SET_OPTIONS}
                />
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center max-w-4xl mx-auto pb-10">
        <div className="w-24">
          {step > 1 && (
            <Button variant="ghost" onClick={handleBack} className="text-slate-500">
              Atrás
            </Button>
          )}
        </div>
        <Button onClick={handleNext} style={{ background: '#A78BFA' }}>
          {step === 3 ? 'Crear proceso' : 'Siguiente →'}
        </Button>
      </div>
    </div>
  );
}
