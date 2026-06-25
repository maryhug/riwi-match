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

  // Reset state when modal is closed (but not cleared by the success path)
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
      // Invalidate queries so that the main detail, ranking, and kanban tables refresh
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

  const isAllowed = (f: File) =>
    ALLOWED_EXTS.some((ext) => f.name.toLowerCase().endsWith(ext));

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        {/* Click outside backdrop to close */}
        <div className="absolute inset-0" onClick={() => { setUploadedCount(null); onClose(); }} />

        {/* Success Modal Container */}
        <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-300">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            ¡Carga completada con éxito!
          </h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Se han subido y encolado <strong className="text-slate-800">{uploadedCount} nuevo(s) candidato(s)</strong> para procesamiento.
            La IA los normalizará y evaluará su porcentaje de match de forma automática en pocos segundos.
          </p>
          <Button
            onClick={() => {
              setUploadedCount(null);
              onClose();
            }}
            className="w-full"
          >
            Entendido
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Subir más candidatos (CVs)
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Los nuevos CVs se normalizarán y evaluarán automáticamente
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-150 ${
              dragging
                ? 'border-violet-400 bg-violet-50/50'
                : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50/50'
            }`}
          >
            <Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 mb-1">
              Arrastra los CVs aquí
            </p>
            <p className="text-xs text-slate-400 mb-4">
              PDF · DOCX · JPG · PNG · WEBP · máx. 10 MB por archivo
            </p>
            <label className="cursor-pointer">
              <span className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors duration-150">
                Seleccionar archivos
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp,.tiff,.bmp"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700 border-b border-slate-100 pb-1.5">
                {files.length} archivo(s) seleccionado(s)
              </p>
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-lg bg-slate-50/50 px-3">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-700 truncate max-w-[340px]">
                        {f.name}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setFiles((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 bg-slate-50/50 border-t border-slate-100 shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => mutate()}
            loading={isPending}
            disabled={files.length === 0}
          >
            Subir candidatos
          </Button>
        </div>
      </div>
    </div>
  );
}
