import { cn } from '@/lib/utils';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, style, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
          {label}
          {props.required && <span className="ml-1" style={{ color: 'var(--color-coral)' }}>*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={cn('block w-full rounded-xl px-4 py-2.5 text-sm transition-all duration-150 outline-none', className)}
        style={{
          border: error ? '1.5px solid var(--color-coral)' : '1.5px solid var(--color-primary-light)',
          background: error ? '#FFF4F2' : '#FFFFFF',
          color: 'var(--color-text)',
          boxShadow: '0 1px 4px 0 rgba(150,125,245,0.05)',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = '1.5px solid var(--color-primary)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(150,125,245,0.12)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = error ? '1.5px solid var(--color-coral)' : '1.5px solid var(--color-primary-light)';
          e.currentTarget.style.boxShadow = '0 1px 4px 0 rgba(150,125,245,0.05)';
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && <p className="text-xs font-medium" style={{ color: 'var(--color-coral)' }}>{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>}
    </div>
  )
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
          {label}
          {props.required && <span className="ml-1" style={{ color: 'var(--color-coral)' }}>*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn('block w-full rounded-xl px-4 py-2.5 text-sm resize-y outline-none transition-all duration-150', className)}
        style={{
          border: error ? '1.5px solid var(--color-coral)' : '1.5px solid var(--color-primary-light)',
          background: error ? '#FFF4F2' : '#FFFFFF',
          color: 'var(--color-text)',
          boxShadow: '0 1px 4px 0 rgba(150,125,245,0.05)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = '1.5px solid var(--color-primary)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(150,125,245,0.12)';
          props.onFocus?.(e as React.FocusEvent<HTMLTextAreaElement>);
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = error ? '1.5px solid var(--color-coral)' : '1.5px solid var(--color-primary-light)';
          e.currentTarget.style.boxShadow = '0 1px 4px 0 rgba(150,125,245,0.05)';
          props.onBlur?.(e as React.FocusEvent<HTMLTextAreaElement>);
        }}
        {...props}
      />
      {error && <p className="text-xs font-medium" style={{ color: 'var(--color-coral)' }}>{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
          {label}
          {props.required && <span className="ml-1" style={{ color: 'var(--color-coral)' }}>*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn('block w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-150', className)}
        style={{
          border: error ? '1.5px solid var(--color-coral)' : '1.5px solid var(--color-primary-light)',
          background: '#FFFFFF',
          color: 'var(--color-text)',
          boxShadow: '0 1px 4px 0 rgba(150,125,245,0.05)',
        }}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs font-medium" style={{ color: 'var(--color-coral)' }}>{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';
