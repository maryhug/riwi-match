import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { uploadCVs } from "@/lib/api/candidates.functions";

const ACCEPTED = ".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp";
const MAX_FILES = 50;
const MAX_SIZE_MB = 10;

export function UploadCvsModal({
  processId,
  open,
  onClose,
}: {
  processId: string;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append("processId", processId);
      files.forEach((f) => form.append("files", f));
      return uploadCVs({ data: form });
    },
    onSuccess: (res) => {
      toast.success(`${res.uploaded} CV(s) cargado(s) — se están procesando`);
      setFiles([]);
      qc.invalidateQueries({ queryKey: ["candidates", processId] });
      qc.invalidateQueries({ queryKey: ["process", processId] });
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "No se pudieron subir los CVs");
    },
  });

  const addFiles = (incoming: FileList | File[]) => {
    const valid: File[] = [];
    for (const f of Array.from(incoming)) {
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${f.name} supera ${MAX_SIZE_MB}MB`);
        continue;
      }
      valid.push(f);
    }
    setFiles((prev) => [...prev, ...valid].slice(0, MAX_FILES));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cargar más CVs</DialogTitle>
        </DialogHeader>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border bg-background/40"}`}
        >
          <Upload className="h-8 w-8 mx-auto text-primary mb-2" />
          <div className="text-sm font-semibold">Arrastra los CVs aquí</div>
          <div className="text-xs text-muted-foreground mt-1">
            PDF, DOCX, JPG, PNG · máx. {MAX_FILES} · {MAX_SIZE_MB}MB c/u
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
          >
            Seleccionar archivos
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              {files.length} archivo(s)
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1.5">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/60 border border-border text-xs"
                >
                  <span className="flex items-center gap-2 truncate">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {f.name}
                  </span>
                  <button
                    onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => uploadMutation.mutate()}
              disabled={uploadMutation.isPending}
              className="w-full px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
            >
              {uploadMutation.isPending ? "Subiendo…" : `Subir ${files.length} CV(s)`}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
