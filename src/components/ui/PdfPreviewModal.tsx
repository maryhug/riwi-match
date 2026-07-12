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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 truncate">
              Vista previa: {title}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Hoja de Vida Normalizada por IA</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Open in new tab */}
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-200"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Download button */}
            <a
              href={fileUrl}
              download
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-semibold transition-colors duration-200"
              title="Descargar archivo"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </a>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-200"
              title="Cerrar vista previa"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content / Visor */}
        <div className="flex-1 bg-slate-100 relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 gap-3">
              <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
              <p className="text-xs font-medium text-slate-500">Cargando visor de PDF...</p>
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
