'use client'

import { cn } from '@/lib/utils'
import { useId } from 'react'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface FieldExtras {
  label?: string
  error?: string
  hint?: string
}

const baseFieldClasses =
  'w-full rounded-[10px] border bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-text-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg'

function fieldStateClasses(error?: string) {
  return error
    ? 'border-coral focus-visible:ring-coral'
    : 'border-border focus-visible:ring-primary'
}

function FieldWrapper({
  id,
  label,
  error,
  hint,
  children,
}: FieldExtras & { id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-ink">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[11px] font-medium text-coral">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({
  label,
  error,
  hint,
  className,
  id: idProp,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & FieldExtras) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint}>
      <input id={id} className={cn(baseFieldClasses, fieldStateClasses(error), className)} {...props} />
    </FieldWrapper>
  )
}

export function Textarea({
  label,
  error,
  hint,
  className,
  id: idProp,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldExtras) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        className={cn(baseFieldClasses, fieldStateClasses(error), 'min-h-24 resize-y', className)}
        {...props}
      />
    </FieldWrapper>
  )
}

export function Select({
  label,
  error,
  hint,
  options,
  className,
  id: idProp,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> &
  FieldExtras & { options: { value: string; label: string }[] }) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint}>
      <select
        id={id}
        className={cn(baseFieldClasses, fieldStateClasses(error), 'cursor-pointer appearance-none', className)}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
}
