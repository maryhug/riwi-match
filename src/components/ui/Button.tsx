import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes = {
    sm:  'px-3.5 py-1.5 text-sm gap-1.5',
    md:  'px-5 py-2.5 text-sm gap-2',
    lg:  'px-6 py-3 text-base gap-2',
  };

  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: 'var(--color-primary)', color: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' },
    accent:    { background: 'var(--color-accent)', color: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' },
    secondary: { background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' },
    ghost:     { background: 'transparent', color: 'var(--color-text-muted)' },
    danger:    { background: 'var(--color-coral)', color: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' },
    outline:   { background: '#fff', color: 'var(--color-text)', border: '1.5px solid var(--color-border)' },
  };

  const focusRing: Record<string, string> = {
    primary:   'focus:ring-violet-300',
    accent:    'focus:ring-amber-300',
    secondary: 'focus:ring-violet-200',
    ghost:     'focus:ring-slate-200',
    danger:    'focus:ring-red-300',
    outline:   'focus:ring-slate-200',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(base, sizes[size], focusRing[variant], className)}
      style={{ ...variants[variant], ...style }}
    >
      {loading && (
        <svg className="animate-spin -ml-0.5 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
