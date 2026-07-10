'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { processesApi } from '@/lib/api';
import Button from '@/components/ui/Button';

interface UploadCvsModalProps {
  isOpen: boolean;
  onClose: () => void;
  processId: string;
}

export default function UploadCvsModal({
  isOpen,
  onClose,
  processId,
}: UploadCvsModalProps) {
  const qc = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [uploadedCount, setUploadedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setError('');
      document.body.style.overflow = '';
    } else {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const { mutate, isPending } = useMutation({
    mutationFn: () => processesApi.uploadCandidates(processId, files),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['process', processId] });
      qc.invalidateQueries({ queryKey: ['candidates', processId] });
      qc.invalidateQueries({ queryKey: ['kanban', processId] });
      
      setUploadedCount(res.data.queued);
      setFiles([]);
      setError('');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail ?? 'Error al subir los CVs.');
    },
  });

  const ALLOWED_EXTS = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp'];
  const isAllowed = (f: File) => ALLOWED_EXTS.some((ext) => f.name.toLowerCase().endsWith(ext));

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(isAllowed);
    if (dropped.length === 0) {
      setError('Formatos aceptados: PDF, DOCX, JPG, PNG, WEBP.');
      return;
    }
    setError('');
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).filter(isAllowed);
      if (selected.length === 0) {
        setError('Formatos aceptados: PDF, DOCX, JPG, PNG, WEBP.');
        return;
      }
      setError('');
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  if (!isOpen) return null;

  if (uploadedCount !== null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="absolute inset-0" onClick={() => { setUploadedCount(null); onClose(); }} />
        <div className="relative w-full max-w-md bg-surface-raised rounded-[var(--radius-lg)] shadow-2xl p-6 text-center animate-in zoom-in-95 duration-300">
          <div className="w-12 h-12 bg-mint-light text-mint-dark rounded-full flex items-center justify-center mx-auto mb-4 border border-mint">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-ink mb-1">
            ¡Carga completada con éxito!
          </h3>
          <p className="text-xs text-text-muted mb-6 leading-relaxed">
            Se han subido y encolado <strong className="text-ink">{uploadedCount} nuevo(s) candidato(s)</strong> para procesamiento.
            La IA los normalizará y evaluará su porcentaje de match de forma automática en pocos segundos.
          </p>
          <Button onClick={() => { setUploadedCount(null); onClose(); }} className="w-full">
            Entendido
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface-raised rounded-[var(--radius-lg)] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-surface">
          <div>
            <h3 className="text-sm font-semibold text-ink">
              Subir más candidatos (CVs)
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5">
              Los nuevos CVs se normalizarán y evaluarán automáticamente
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-text-muted hover:text-ink hover:bg-bg-subtle transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-[var(--radius-md)] p-8 text-center transition-colors duration-150 ${dragging ? 'border-primary bg-primary-light/50' : 'border-border hover:border-primary-light hover:bg-bg-subtle/50'}`}
          >
            <Upload className="w-8 h-8 text-text-muted mx-auto mb-3" />
            <p className="text-sm font-medium text-text mb-1">Arrastra los CVs aquí</p>
            <p className="text-xs text-text-muted mb-4">PDF · DOCX · JPG · PNG · WEBP · máx. 10 MB por archivo</p>
            <label className="cursor-pointer">
              <span className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-[var(--radius-sm)] text-xs font-semibold shadow-sm transition-colors duration-150">
                Seleccionar archivos
              </span>
              <input type="file" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp,.tiff,.bmp" multiple className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-coral-light border border-coral rounded-[var(--radius-md)] text-xs text-coral-dark">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-text border-b border-border pb-1.5">
                {files.length} archivo(s) seleccionado(s)
              </p>
              <div className="max-h-40 overflow-y-auto divide-y divide-border border border-border rounded-[var(--radius-md)] bg-bg-subtle/30 px-3">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span className="text-xs text-text truncate max-w-[340px]">{f.name}</span>
                    </div>
                    <button
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="text-text-muted hover:text-coral transition-colors p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 bg-surface border-t border-border shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button onClick={() => mutate()} loading={isPending} disabled={files.length === 0}>
            Subir candidatos
          </Button>
        </div>
      </div>
    </div>
  );
}
