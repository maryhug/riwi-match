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
        <label className="block text-sm font-semibold text-slate-700">
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'block w-full rounded-lg px-4 py-2.5 text-sm transition-all duration-150 outline-none',
          className,
        )}
        style={{
          border: error ? '1.5px solid #EF4444' : '1.5px solid var(--color-border)',
          background: error ? '#FEF2F2' : '#FFFFFF',
          color: 'var(--color-text)',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = '1.5px solid var(--color-primary)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = error
            ? '1.5px solid #EF4444'
            : '1.5px solid var(--color-border)';
          e.currentTarget.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  ),
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
        <label className="block text-sm font-semibold text-slate-700">
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'block w-full rounded-lg px-4 py-2.5 text-sm resize-y outline-none transition-all duration-150',
          className,
        )}
        style={{
          border: error ? '1.5px solid #EF4444' : '1.5px solid var(--color-border)',
          background: error ? '#FEF2F2' : '#FFFFFF',
          color: 'var(--color-text)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = '1.5px solid var(--color-primary)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)';
          props.onFocus?.(e as React.FocusEvent<HTMLTextAreaElement>);
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = error
            ? '1.5px solid #EF4444'
            : '1.5px solid var(--color-border)';
          e.currentTarget.style.boxShadow = 'none';
          props.onBlur?.(e as React.FocusEvent<HTMLTextAreaElement>);
        }}
        {...props}
      />
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  ),
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
        <label className="block text-sm font-semibold text-slate-700">
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'block w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all duration-150 bg-white',
          className,
        )}
        style={{
          border: error ? '1.5px solid #EF4444' : '1.5px solid var(--color-border)',
          color: 'var(--color-text)',
        }}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  ),
);
Select.displayName = 'Select';
