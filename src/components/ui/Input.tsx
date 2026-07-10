import { cn } from '@/lib/utils';
import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, className, ...props }, ref) => (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-sm font-medium text-text">
          {label}
          {props.required && <span className="ml-1 text-coral">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'block w-full rounded-[var(--radius-sm)] px-3.5 py-2 text-sm bg-surface transition-colors duration-150 outline-none',
            'placeholder:text-text-muted text-ink',
            leftIcon && 'pl-9',
            error
              ? 'border border-coral focus:border-coral-dark focus:ring-2 focus:ring-coral-light'
              : 'border border-border focus:border-primary focus:ring-2 focus:ring-primary-light',
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-coral font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  ),
);
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-sm font-medium text-text">
          {label}
          {props.required && <span className="ml-1 text-coral">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'block w-full rounded-[var(--radius-sm)] px-3.5 py-2 text-sm bg-surface resize-y outline-none transition-colors duration-150',
          'placeholder:text-text-muted text-ink',
          error
            ? 'border border-coral focus:border-coral-dark focus:ring-2 focus:ring-coral-light'
            : 'border border-border focus:border-primary focus:ring-2 focus:ring-primary-light',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-coral font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  ),
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-sm font-medium text-text">
          {label}
          {props.required && <span className="ml-1 text-coral">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'block w-full rounded-[var(--radius-sm)] px-3.5 py-2 text-sm bg-surface outline-none transition-colors duration-150',
          'text-ink',
          error
            ? 'border border-coral focus:border-coral-dark focus:ring-2 focus:ring-coral-light'
            : 'border border-border focus:border-primary focus:ring-2 focus:ring-primary-light',
          className,
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-coral font-medium">{error}</p>}
    </div>
  ),
);
Select.displayName = 'Select';
