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
        <label className="block text-sm font-semibold" style={{ color: '#1E1B4B' }}>
          {label}
          {props.required && <span className="ml-1" style={{ color: '#FF596D' }}>*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={cn('block w-full rounded-xl px-4 py-2.5 text-sm transition-all duration-150 outline-none', className)}
        style={{
          border: error ? '1.5px solid #FF596D' : '1.5px solid #EEE9FF',
          background: error ? '#FFF4F2' : '#FFFFFF',
          color: '#374151',
          boxShadow: '0 1px 4px 0 rgba(150,125,245,0.05)',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = '1.5px solid #967DF5';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(150,125,245,0.12)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = error ? '1.5px solid #FF596D' : '1.5px solid #EEE9FF';
          e.currentTarget.style.boxShadow = '0 1px 4px 0 rgba(150,125,245,0.05)';
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && <p className="text-xs font-medium" style={{ color: '#FF596D' }}>{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: '#9CA3AF' }}>{hint}</p>}
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
        <label className="block text-sm font-semibold" style={{ color: '#1E1B4B' }}>
          {label}
          {props.required && <span className="ml-1" style={{ color: '#FF596D' }}>*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn('block w-full rounded-xl px-4 py-2.5 text-sm resize-y outline-none transition-all duration-150', className)}
        style={{
          border: error ? '1.5px solid #FF596D' : '1.5px solid #EEE9FF',
          background: error ? '#FFF4F2' : '#FFFFFF',
          color: '#374151',
          boxShadow: '0 1px 4px 0 rgba(150,125,245,0.05)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = '1.5px solid #967DF5';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(150,125,245,0.12)';
          props.onFocus?.(e as React.FocusEvent<HTMLTextAreaElement>);
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = error ? '1.5px solid #FF596D' : '1.5px solid #EEE9FF';
          e.currentTarget.style.boxShadow = '0 1px 4px 0 rgba(150,125,245,0.05)';
          props.onBlur?.(e as React.FocusEvent<HTMLTextAreaElement>);
        }}
        {...props}
      />
      {error && <p className="text-xs font-medium" style={{ color: '#FF596D' }}>{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: '#9CA3AF' }}>{hint}</p>}
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
        <label className="block text-sm font-semibold" style={{ color: '#1E1B4B' }}>
          {label}
          {props.required && <span className="ml-1" style={{ color: '#FF596D' }}>*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn('block w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-150', className)}
        style={{
          border: error ? '1.5px solid #FF596D' : '1.5px solid #EEE9FF',
          background: '#FFFFFF',
          color: '#374151',
          boxShadow: '0 1px 4px 0 rgba(150,125,245,0.05)',
        }}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs font-medium" style={{ color: '#FF596D' }}>{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';
