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
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes = {
    sm:  'px-3 py-1.5 text-xs gap-1.5',
    md:  'px-4 py-2 text-sm gap-2',
    lg:  'px-5 py-2.5 text-sm gap-2',
  };

  const variants: Record<string, string> = {
    primary:   'bg-violet-600 hover:bg-violet-700 text-white focus:ring-violet-300',
    accent:    'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-300',
    secondary: 'bg-violet-50 hover:bg-violet-100 text-violet-700 focus:ring-violet-200',
    ghost:     'bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-200',
    danger:    'bg-red-600 hover:bg-red-700 text-white focus:ring-red-300',
    outline:   'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 focus:ring-slate-200',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(base, sizes[size], variants[variant], className)}
    >
      {loading && (
        <svg className="animate-spin -ml-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
