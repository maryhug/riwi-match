'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, Loader2 } from 'lucide-react';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string;
}

export default function PdfPreviewModal({
  isOpen,
  onClose,
  title,
  fileUrl,
}: PdfPreviewModalProps) {
  const [loading, setLoading] = useState(true);

  // Reset spinner whenever the PDF URL changes
  useEffect(() => { setLoading(true); }, [fileUrl]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl h-[85vh] bg-surface-raised rounded-[var(--radius-lg)] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink truncate">
              Vista previa: {title}
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wide font-semibold">Hoja de Vida Normalizada por IA</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Open in new tab */}
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-[var(--radius-sm)] text-text hover:text-ink hover:bg-bg-subtle transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary outline-none"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Download button */}
            <a
              href={fileUrl}
              download
              className="flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-sm)] bg-primary-light text-primary hover:bg-[#DDD6FE] text-xs font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary outline-none"
              title="Descargar archivo"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </a>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-[var(--radius-sm)] text-text hover:text-ink hover:bg-bg-subtle transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary outline-none"
              title="Cerrar vista previa"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content / Visor */}
        <div className="flex-1 bg-bg-subtle relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-subtle gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs font-medium text-text-muted">Cargando visor de PDF...</p>
            </div>
          )}

          <iframe
            src={fileUrl}
            className="w-full h-full border-none"
            onLoad={() => setLoading(false)}
            title={`CV Preview - ${title}`}
          />
        </div>
      </div>
    </div>
  );
}
