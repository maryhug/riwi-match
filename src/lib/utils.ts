import { clsx, type ClassValue } from 'clsx';
import type { MatchCategory, ProcessStatus } from './types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export const matchCategoryConfig: Record<MatchCategory, { label: string; color: string; bg: string; border: string }> = {
  HIGH: { label: 'Alto', color: 'text-mint', bg: 'bg-mint-light', border: 'border-emerald-200' },
  MEDIUM: { label: 'Medio', color: 'text-accent', bg: 'bg-accent-light', border: 'border-amber-200' },
  LOW: { label: 'Bajo', color: 'text-coral-dark', bg: 'bg-coral-light', border: 'border-red-200' },
};

export const processStatusConfig: Record<ProcessStatus, { label: string; color: string; bg: string }> = {
  DRAFT:                { label: 'Borrador',         color: 'text-slate-600',    bg: 'bg-slate-100' },
  READY_FOR_MATCH:      { label: 'JD Lista',         color: 'text-blue-700',     bg: 'bg-blue-50' },
  CVS_UPLOADED:         { label: 'CVs Cargados',     color: 'text-primary-dark', bg: 'bg-primary-xlight' },
  MATCHING:             { label: 'En Match...',       color: 'text-orange-700',   bg: 'bg-orange-50' },
  PROFILING_CONFIGURED: { label: 'Match Completado', color: 'text-teal-700',     bg: 'bg-teal-50' },
  COMPLETED:            { label: 'Completado',        color: 'text-mint',         bg: 'bg-mint-light' },
};

export const processSteps = [
  { key: 'jd',       label: 'Job Description', statuses: ['DRAFT', 'READY_FOR_MATCH'] as ProcessStatus[] },
  { key: 'cvs',      label: 'Subir CVs',       statuses: ['CVS_UPLOADED', 'MATCHING'] as ProcessStatus[] },
  { key: 'match',    label: 'Match & Ranking', statuses: ['PROFILING_CONFIGURED'] as ProcessStatus[] },
  { key: 'profiling',label: 'Profiling',       statuses: ['COMPLETED'] as ProcessStatus[] },
];

export function getProcessStep(status: ProcessStatus | string): number {
  if (status === 'DRAFT' || status === 'READY_FOR_MATCH') return 0;
  if (status === 'CVS_UPLOADED' || status === 'MATCHING') return 1;
  if (status === 'PROFILING_CONFIGURED') return 2;
  if (status === 'COMPLETED') return 3;
  return 0;
}
