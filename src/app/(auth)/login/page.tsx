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
    <div className="min-h-screen flex items-center justify-center bg-bg-subtle px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-raised rounded-[var(--radius-xl)] p-8 shadow-xl border border-border">
          <div className="flex items-center gap-2.5 mb-7">
            <div className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center bg-primary">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" fill="none" />
                <path d="M8 5L11 7V11H5V7L8 5Z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold text-ink">RIWI MATCH</span>
              <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary-light text-primary uppercase tracking-wide">AI</span>
            </div>
          </div>

          {view === 'login' ? (
            <>
              <h1 className="text-xl font-bold text-ink mb-1">Iniciar sesión</h1>
              <p className="text-sm text-text-muted mb-6">Ingresa con tu cuenta corporativa</p>

              {error && (
                <div className="flex items-center gap-2.5 p-3 rounded-[var(--radius-sm)] mb-5 text-sm bg-coral-light border border-coral text-coral-dark">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Email corporativo"
                  type="email"
                  placeholder="nombre@empresa.com"
                  error={errors.email?.message}
                  required
                  leftIcon={<Mail size={16} />}
                  {...register('email')}
                />

                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  required
                  leftIcon={<Lock size={16} />}
                  {...register('password')}
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setView('forgot'); setError(''); setRecoverEmail(''); }}
                    className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <Button type="submit" loading={isSubmitting} size="lg" className="w-full">
                  Ingresar
                </Button>
              </form>

              <div className="mt-6 rounded-[var(--radius-md)] p-4 bg-primary-xlight border border-primary-light">
                <p className="text-xs font-bold mb-2 text-primary-dark">Acceso rápido</p>
                <button
                  type="button"
                  onClick={() => { setValue('email', 'recruiter@riwi.io'); setValue('password', 'riwi2026'); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md text-left bg-surface hover:bg-bg-subtle transition-colors border border-border"
                >
                  <span className="text-xs font-semibold text-ink">Recruiter</span>
                  <span className="text-xs text-primary">recruiter@riwi.io</span>
                </button>
                <p className="text-xs mt-2 text-text-muted">
                  Haz clic para autocompletar, luego presiona Ingresar.
                </p>
              </div>
            </>
          ) : view === 'forgot' ? (
            <>
              <button
                onClick={() => setView('login')}
                className="flex items-center gap-2 text-sm font-medium mb-6 text-text-muted hover:text-ink transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al login
              </button>

              <h1 className="text-xl font-bold text-ink mb-1">Recuperar contraseña</h1>
              <p className="text-sm text-text-muted mb-6">
                Ingresa tu correo corporativo y te enviaremos un enlace temporal para restablecerla.
              </p>

              {error && (
                <div className="flex items-center gap-2.5 p-3 rounded-[var(--radius-sm)] mb-5 text-sm bg-coral-light border border-coral text-coral-dark">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleRecover} className="space-y-4">
                <Input
                  label="Email corporativo"
                  type="email"
                  placeholder="nombre@empresa.com"
                  value={recoverEmail}
                  onChange={(e) => setRecoverEmail(e.target.value)}
                  required
                  leftIcon={<Mail size={16} />}
                />

                <Button type="submit" size="lg" className="w-full">
                  Enviar enlace de recuperación
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-6">
              <div className="w-14 h-14 bg-mint-light rounded-full flex items-center justify-center border border-mint">
                <CheckCircle2 className="w-7 h-7 text-mint-dark" />
              </div>
              <h1 className="text-xl font-bold text-ink">Revisa tu correo</h1>
              <p className="text-sm text-text max-w-[280px]">
                Hemos enviado un enlace de recuperación a{' '}
                <span className="font-semibold text-ink">{recoverEmail}</span>.
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
