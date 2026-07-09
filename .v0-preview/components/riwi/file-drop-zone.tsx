'use client'

import { FileText, UploadCloud, X } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { cn } from '@/lib/utils'

interface FileDropZoneProps {
  allowedExtensions: string[]
  multiple?: boolean
  files: File[]
  onFilesChange: (files: File[]) => void
  helperText?: string
}

export function FileDropZone({
  allowedExtensions,
  multiple = true,
  files,
  onFilesChange,
  helperText,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [rejected, setRejected] = useState<string[]>([])

  const isAllowed = (file: File) => {
    const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
    return allowedExtensions.includes(ext)
  }

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const accepted: File[] = []
    const bad: string[] = []
    Array.from(incoming).forEach((f) => {
      if (isAllowed(f)) accepted.push(f)
      else bad.push(f.name)
    })
    setRejected(bad)
    if (accepted.length > 0) {
      onFilesChange(multiple ? [...files, ...accepted] : accepted.slice(0, 1))
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Zona para arrastrar y soltar archivos, o hacer click para seleccionar"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed p-8 text-center transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-bg',
          dragOver ? 'border-primary bg-primary-xlight' : 'border-border-strong bg-bg-subtle hover:border-primary',
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-primary-light">
          <UploadCloud className="size-5 text-primary" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">
            Arrastra tus archivos aquí o haz click para seleccionar
          </p>
          <p className="mt-1 text-[11px] text-text-muted">
            {helperText ?? `Formatos permitidos: ${allowedExtensions.join(', ')}`}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={allowedExtensions.join(',')}
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {rejected.length > 0 && (
        <p className="rounded-[10px] bg-coral-light px-3 py-2 text-[11px] font-medium text-coral">
          Archivos rechazados por formato no permitido: {rejected.join(', ')}
        </p>
      )}

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-3 rounded-[10px] border border-border bg-surface px-3 py-2"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-light">
                <FileText className="size-4 text-blue" />
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">{f.name}</span>
              <span className="font-mono text-[11px] text-text-muted">
                {(f.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                aria-label={`Quitar archivo ${f.name}`}
                onClick={() => onFilesChange(files.filter((_, idx) => idx !== i))}
                className="flex size-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-subtle hover:text-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
