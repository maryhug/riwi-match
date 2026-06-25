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
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes = {
    sm:  'px-3.5 py-1.5 text-sm gap-1.5',
    md:  'px-5 py-2.5 text-sm gap-2',
    lg:  'px-6 py-3 text-base gap-2',
  };

  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: '#967DF5', color: '#fff' },
    accent:    { background: '#FFB863', color: '#fff' },
    secondary: { background: '#EEE9FF', color: '#967DF5' },
    ghost:     { background: 'transparent', color: '#6B7280' },
    danger:    { background: '#FF596D', color: '#fff' },
    outline:   { background: 'transparent', color: '#967DF5', border: '1.5px solid #967DF5' },
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(base, sizes[size], className)}
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
