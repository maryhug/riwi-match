'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router    = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [view, setView] = useState<'login' | 'forgot' | 'sent'>('login');
  const [recoverEmail, setRecoverEmail] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await authApi.login(data.email, data.password);
      login(res.data.access_token, res.data.role);
      router.push('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
      if (axiosErr?.response?.status === 401) {
        setError('Credenciales incorrectas.');
      } else {
        setError(axiosErr?.response?.data?.detail ?? 'Error al conectar con el servidor.');
      }
    }
  };

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoverEmail || !recoverEmail.includes('@')) {
      setError('Por favor ingresa un correo válido.');
      return;
    }
    setError('');
    setTimeout(() => { setView('sent'); }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-xl p-8" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)' }}>
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-7">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-violet-600">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" fill="none" />
                <path d="M8 5L11 7V11H5V7L8 5Z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold text-violet-700">RIWI MATCH</span>
              <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 uppercase tracking-wide">AI</span>
            </div>
          </div>

          {view === 'login' ? (
            <>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Iniciar sesión</h1>
              <p className="text-sm text-slate-400 mb-6">Ingresa con tu cuenta corporativa</p>

              {error && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg mb-5 text-sm bg-red-50 border border-red-200 text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="relative">
                  <Input
                    label="Email corporativo"
                    type="email"
                    placeholder="nombre@empresa.com"
                    error={errors.email?.message}
                    required
                    style={{ paddingLeft: '2.5rem' }}
                    {...register('email')}
                  />
                  <Mail className="absolute left-3 w-4 h-4 pointer-events-none text-slate-400" style={{ top: '2.35rem' }} />
                </div>

                <div className="relative">
                  <Input
                    label="Contraseña"
                    type="password"
                    placeholder="••••••••"
                    error={errors.password?.message}
                    required
                    style={{ paddingLeft: '2.5rem' }}
                    {...register('password')}
                  />
                  <Lock className="absolute left-3 w-4 h-4 pointer-events-none text-slate-400" style={{ top: '2.35rem' }} />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setView('forgot'); setError(''); setRecoverEmail(''); }}
                    className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <Button type="submit" loading={isSubmitting} size="lg" className="w-full">
                  Ingresar
                </Button>
              </form>

              {/* Quick access */}
              <div className="mt-6 rounded-lg p-4 bg-violet-50 border border-violet-100">
                <p className="text-xs font-bold mb-2 text-violet-800">Acceso rápido</p>
                <button
                  type="button"
                  onClick={() => { setValue('email', 'recruiter@riwi.io'); setValue('password', 'riwi2026'); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md text-left bg-white hover:bg-violet-50 transition-colors border border-violet-100"
                >
                  <span className="text-xs font-semibold text-slate-900">Recruiter</span>
                  <span className="text-xs text-violet-600">recruiter@riwi.io</span>
                </button>
                <p className="text-xs mt-2 text-slate-400">
                  Haz clic para autocompletar, luego presiona Ingresar.
                </p>
              </div>
            </>
          ) : view === 'forgot' ? (
            <>
              <button
                onClick={() => setView('login')}
                className="flex items-center gap-2 text-sm font-medium mb-6 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al login
              </button>

              <h1 className="text-xl font-bold text-slate-900 mb-1">Recuperar contraseña</h1>
              <p className="text-sm text-slate-400 mb-6">
                Ingresa tu correo corporativo y te enviaremos un enlace temporal para restablecerla.
              </p>

              {error && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg mb-5 text-sm bg-red-50 border border-red-200 text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleRecover} className="space-y-4">
                <div className="relative">
                  <Input
                    label="Email corporativo"
                    type="email"
                    placeholder="nombre@empresa.com"
                    value={recoverEmail}
                    onChange={(e) => setRecoverEmail(e.target.value)}
                    required
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Mail className="absolute left-3 w-4 h-4 pointer-events-none text-slate-400" style={{ top: '2.35rem' }} />
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Enviar enlace de recuperación
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-6">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Revisa tu correo</h1>
              <p className="text-sm text-slate-500 max-w-[280px]">
                Hemos enviado un enlace de recuperación a{' '}
                <span className="font-semibold text-slate-700">{recoverEmail}</span>.
              </p>
              <Button variant="outline" className="w-full mt-4" onClick={() => setView('login')}>
                Volver al inicio de sesión
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
