'use client'

import { Download, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from './button'
import { Modal } from './modal'

interface PdfPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  fileUrl: string
}

export function PdfPreviewModal({ isOpen, onClose, title, fileUrl }: PdfPreviewModalProps) {
  const [loading, setLoading] = useState(true)

  // El spinner se reinicia cada vez que cambia fileUrl (el modal puede permanecer montado)
  useEffect(() => {
    setLoading(true)
  }, [fileUrl])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-4xl">
      <div className="flex flex-col gap-4">
        <div className="relative h-[60vh] overflow-hidden rounded-[14px] border border-border bg-bg-subtle">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
                role="status"
                aria-label="Cargando documento"
              />
            </div>
          )}
          <iframe
            key={fileUrl}
            src={fileUrl}
            title={title}
            className="h-full w-full"
            onLoad={() => setLoading(false)}
          />
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={() => window.open(fileUrl, '_blank', 'noopener,noreferrer')}>
            <ExternalLink className="size-4" />
            Abrir en pestaña nueva
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const a = document.createElement('a')
              a.href = fileUrl
              a.download = ''
              a.click()
            }}
          >
            <Download className="size-4" />
            Descargar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
