import { cn } from '@/lib/utils';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'block w-full rounded-md px-3.5 py-2 text-sm bg-white transition-colors duration-150 outline-none',
          'placeholder:text-slate-400 text-slate-900',
          error
            ? 'border border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
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
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'block w-full rounded-md px-3.5 py-2 text-sm bg-white resize-y outline-none transition-colors duration-150',
          'placeholder:text-slate-400 text-slate-900',
          error
            ? 'border border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
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
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'block w-full rounded-md px-3.5 py-2 text-sm bg-white outline-none transition-colors duration-150',
          'text-slate-900',
          error
            ? 'border border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200',
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
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  ),
);
Select.displayName = 'Select';
