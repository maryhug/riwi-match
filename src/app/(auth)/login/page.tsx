'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { Role } from '@/lib/types';

const schema = z.object({
  email:    z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

const DEMO_USERS: Record<string, { password: string; role: Role }> = {
  'admin@riwi.com':     { password: 'admin123',     role: 'ADMIN' },
  'recruiter@riwi.com': { password: 'recruiter123', role: 'RECRUITER' },
  'leader@riwi.com':    { password: 'leader123',    role: 'TA_LEADER' },
};

export default function LoginPage() {
  const router   = useRouter();
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
    const demo = DEMO_USERS[data.email];
    if (demo && demo.password === data.password) {
      login('demo-token', demo.role);
      router.push('/dashboard');
      return;
    }
    setError('Credenciales incorrectas. Usa los accesos de demo.');
  };

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoverEmail || !recoverEmail.includes('@')) {
      setError('Por favor ingresa un correo válido.');
      return;
    }
    setError('');
    // Simulate API call
    setTimeout(() => {
      setView('sent');
    }, 800);
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: '#F5F2FD' }}
    >
      {/* Panel izquierdo decorativo */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #4F3CC9 0%, var(--color-primary) 70%, #C4B2F9 100%)' }}
      >
        {/* Circulos decorativos */}
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20"
          style={{ background: '#fff', transform: 'translate(40%, -40%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15"
          style={{ background: 'var(--color-accent)', transform: 'translate(-30%, 30%)' }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
                <path d="M8 5L11 7V11H5V7L8 5Z" fill="white" fillOpacity="0.9"/>
              </svg>
            </div>
            <span
              className="text-xl font-bold text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Riwi Match
            </span>
          </div>

          <h2
            className="text-4xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Reclutamiento impulsado por IA
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            Analiza CVs, realiza matching inteligente y conduce entrevistas de voz automatizadas.
          </p>
        </div>

        {/* Stats decorativas */}
        <div className="relative z-10 space-y-3">
          {[
            { value: '10x', label: 'mas rapido que el proceso tradicional' },
            { value: '92%', label: 'precision en el ranking de candidatos' },
            { value: '3h',  label: 'ahorro promedio por vacante' },
          ].map((s) => (
            <div
              key={s.value}
              className="flex items-center gap-4 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
            >
              <span
                className="text-2xl font-bold text-white w-14 shrink-0"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {s.value}
              </span>
              <span className="text-sm text-white/75">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--color-primary)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
                <path d="M8 5L11 7V11H5V7L8 5Z" fill="white" fillOpacity="0.9"/>
              </svg>
            </div>
            <span className="font-bold text-lg" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
              Riwi Match
            </span>
          </div>

          {view === 'login' ? (
            <>
              <h1
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
              >
                Iniciar sesión
              </h1>
              <p className="text-sm mb-7" style={{ color: 'var(--color-text-muted)' }}>
                Ingresa con tu cuenta corporativa
              </p>

              {error && (
                <div
                  className="flex items-center gap-2.5 p-3.5 rounded-xl mb-5 text-sm font-medium"
                  style={{ background: '#FFF4F2', border: '1.5px solid var(--color-coral)', color: '#FF596D' }}
                >
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
                    style={{ paddingLeft: '2.75rem' }}
                    {...register('email')}
                  />
                  <Mail
                    className="absolute left-3.5 w-4 h-4 pointer-events-none"
                    style={{ top: '2.45rem', color: '#C4B2F9' }}
                  />
                </div>

                <div className="relative">
                  <Input
                    label="Contraseña"
                    type="password"
                    placeholder="••••••••"
                    error={errors.password?.message}
                    required
                    style={{ paddingLeft: '2.75rem' }}
                    {...register('password')}
                  />
                  <Lock
                    className="absolute left-3.5 w-4 h-4 pointer-events-none"
                    style={{ top: '2.45rem', color: '#C4B2F9' }}
                  />
                </div>
                
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => { setView('forgot'); setError(''); setRecoverEmail(''); }}
                    className="text-xs font-semibold hover:underline"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-2">
                  Ingresar
                </Button>
              </form>

              {/* Demo credentials */}
              <div
                className="mt-7 rounded-2xl p-4 space-y-2"
                style={{ background: 'var(--color-primary-light)', border: '1.5px solid #D0C8FC' }}
              >
                <p className="text-xs font-bold mb-3" style={{ color: 'var(--color-primary-dark)' }}>
                  Credenciales de demo
                </p>
                {[
                  { role: 'Admin',      email: 'admin@riwi.com',     pass: 'admin123' },
                  { role: 'Reclutador', email: 'recruiter@riwi.com', pass: 'recruiter123' },
                  { role: 'TA Leader',  email: 'leader@riwi.com',    pass: 'leader123' },
                ].map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => { setValue('email', u.email); setValue('password', u.pass); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors"
                    style={{ background: 'rgba(255,255,255,0.6)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                  >
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>{u.role}</span>
                    <span className="text-xs" style={{ color: 'var(--color-primary)' }}>{u.email}</span>
                  </button>
                ))}
                <p className="text-xs pt-1" style={{ color: 'var(--color-text-muted)' }}>
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

              <h1
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
              >
                Recuperar contraseña
              </h1>
              <p className="text-sm mb-7" style={{ color: 'var(--color-text-muted)' }}>
                Ingresa tu correo corporativo y te enviaremos un enlace temporal para restablecerla.
              </p>

              {error && (
                <div
                  className="flex items-center gap-2.5 p-3.5 rounded-xl mb-5 text-sm font-medium"
                  style={{ background: '#FFF4F2', border: '1.5px solid var(--color-coral)', color: '#FF596D' }}
                >
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
                    style={{ paddingLeft: '2.75rem' }}
                  />
                  <Mail
                    className="absolute left-3.5 w-4 h-4 pointer-events-none"
                    style={{ top: '2.45rem', color: '#C4B2F9' }}
                  />
                </div>

                <Button type="submit" size="lg" className="w-full mt-4">
                  Enviar enlace de recuperación
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                <div className="w-16 h-16 bg-mint-light rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-8 h-8 text-mint" />
                </div>
                <h1
                  className="text-2xl font-bold mb-1"
                  style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
                >
                  Revisa tu correo
                </h1>
                <p className="text-sm text-slate-500 max-w-[280px]">
                  Hemos enviado un enlace de recuperación a <span className="font-semibold text-slate-700">{recoverEmail}</span>. Haz clic en él para restablecer tu contraseña.
                </p>
                <Button variant="outline" className="w-full mt-6" onClick={() => setView('login')}>
                  Volver al inicio de sesión
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
