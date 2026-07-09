'use client'

import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from './button'
import { FileDropZone } from './file-drop-zone'
import { Modal } from './modal'
import { processesApi } from '@/lib/api'

export const CV_EXTENSIONS = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp']

interface UploadCvsModalProps {
  isOpen: boolean
  onClose: () => void
  processId: string
  /** Se llama tras una subida exitosa, para que el padre invalide sus queries. */
  onUploaded?: () => void
}

type Phase = 'select' | 'uploading' | 'done' | 'error'

export function UploadCvsModal({ isOpen, onClose, processId, onUploaded }: UploadCvsModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [phase, setPhase] = useState<Phase>('select')
  const [uploadedCount, setUploadedCount] = useState(0)
  const [error, setError] = useState('')

  const handleClose = () => {
    setFiles([])
    setPhase('select')
    setUploadedCount(0)
    setError('')
    onClose()
  }

  const handleUpload = async () => {
    setPhase('uploading')
    try {
      const res = await processesApi.uploadCandidates(processId, files)
      setUploadedCount(res.data.queued)
      setPhase('done')
      onUploaded?.()
    } catch (err) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail || 'No se pudieron subir los archivos.')
      setPhase('error')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Subir CVs">
      {phase === 'select' && (
        <div className="flex flex-col gap-4">
          <FileDropZone
            allowedExtensions={CV_EXTENSIONS}
            files={files}
            onFilesChange={setFiles}
            helperText="PDF, Word o imágenes escaneadas (.pdf, .docx, .doc, .jpg, .jpeg, .png, .webp, .tiff, .bmp)"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={files.length === 0}>
              Subir {files.length > 0 ? `${files.length} archivo${files.length > 1 ? 's' : ''}` : 'archivos'}
            </Button>
          </div>
        </div>
      )}

      {phase === 'uploading' && (
        <div className="flex flex-col items-center gap-4 py-10">
          <div
            className="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent"
            role="status"
            aria-label="Subiendo archivos"
          />
          <p className="text-sm font-medium text-text">Subiendo {files.length} archivo(s)...</p>
        </div>
      )}

      {phase === 'error' && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-coral-light">
            <CheckCircle2 className="size-7 rotate-45 text-coral" />
          </span>
          <div>
            <p className="text-base font-bold text-ink">No se pudieron subir los archivos</p>
            <p className="mt-1 text-xs text-text-muted">{error}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleClose}>
              Cerrar
            </Button>
            <Button onClick={() => setPhase('select')}>Reintentar</Button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-mint-light">
            <CheckCircle2 className="size-7 text-mint" />
          </span>
          <div>
            <p className="text-base font-bold text-ink">CVs subidos con éxito</p>
            <p className="mt-1 text-xs text-text-muted">
              Se subieron {uploadedCount} archivo(s). El sistema comenzará a procesarlos en breve.
            </p>
          </div>
          <Button onClick={handleClose}>Entendido</Button>
        </div>
      )}
    </Modal>
  )
}
