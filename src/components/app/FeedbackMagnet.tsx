import {
  createContext, useContext, useState, useRef, useCallback, useEffect,
  type ReactNode, type MouseEvent,
} from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageSquarePlus, List } from "lucide-react";
import { toast } from "sonner";
import { PostIt } from "@/components/app/PostIt";
import { getNotes, saveNote, deleteNote, type NoteData } from "@/lib/api/feedback.functions";

interface FeedbackContextType {
  setMagnetId: (id: string | null) => void;
}

const FeedbackContext = createContext<FeedbackContextType>({ setMagnetId: () => {} });

export function useFeedback() {
  return useContext(FeedbackContext);
}

export function FeedbackMagnet({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [customId, setMagnetId] = useState<string | null>(null);
  const currentId = customId || pathname;

  const [notes, setNotes] = useState<NoteData[]>([]);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const { data } = useQuery({
    queryKey: ["feedback-notes", currentId],
    queryFn: () => getNotes({ data: { magnetId: currentId } }),
  });

  useEffect(() => {
    setNotes(data ?? []);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (vars: { note: NoteData; magnetId: string }) => saveNote({ data: vars }),
    retry: 2,
    onError: () => toast.error("No se pudo guardar el apunte — revisa tu conexión e inténtalo de nuevo."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNote({ data: { id } }),
    retry: 2,
    onError: () => toast.error("No se pudo eliminar el apunte — inténtalo de nuevo."),
  });

  const scheduleSave = useCallback((note: NoteData, magnetId: string) => {
    if (saveTimers.current[note.id]) clearTimeout(saveTimers.current[note.id]);
    saveTimers.current[note.id] = setTimeout(() => {
      saveMutation.mutate({ note, magnetId });
    }, 500);
  }, [saveMutation]);

  const updateNoteAndSave = useCallback((id: string, updates: Partial<NoteData>) => {
    setNotes((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, ...updates } : n));
      const updated = next.find((n) => n.id === id);
      if (updated) scheduleSave(updated, currentId);
      return next;
    });
  }, [scheduleSave, currentId]);

  const removeNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    deleteMutation.mutate(id);
  };

  const handleContainerClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".feedback-menu")) return;

    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    if (!feedbackMode) return;
    if ((e.target as HTMLElement).closest(".post-it")) return;

    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNote: NoteData = { id: Date.now().toString(), x, y, text: "", minimized: false, url: pathname };
    setNotes((prev) => [...prev, newNote]);
    setFeedbackMode(false);
    scheduleSave(newNote, currentId);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full flex-1"
      onClickCapture={handleContainerClickCapture}
      style={{ cursor: feedbackMode ? "crosshair" : "default" }}
    >
      <div className="feedback-menu fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
        {!feedbackMode && menuOpen && (
          <div className="flex flex-col items-end gap-2 mb-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <button
              onClick={(e) => { e.stopPropagation(); setFeedbackMode(true); setMenuOpen(false); }}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-full shadow-lg hover:bg-slate-800 transition-colors"
            >
              <span className="text-xs font-semibold">Dejar apunte aquí</span>
              <MessageSquarePlus className="h-4 w-4" />
            </button>
            <Link
              to="/app/feedback-admin"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
              className="flex items-center gap-2 bg-violet-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-violet-700 transition-colors"
            >
              <span className="text-xs font-semibold">Gestor de apuntes</span>
              <List className="h-4 w-4" />
            </Link>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (feedbackMode) setFeedbackMode(false);
            else setMenuOpen(!menuOpen);
          }}
          className={`p-4 rounded-full shadow-2xl text-white transition-all ${
            feedbackMode ? "bg-red-500 hover:bg-red-600 rotate-45" : "bg-slate-900 hover:bg-slate-800"
          }`}
          title={feedbackMode ? "Cancelar" : "Opciones de feedback"}
        >
          <MessageSquarePlus className="h-6 w-6" />
        </button>
      </div>

      <FeedbackContext.Provider value={{ setMagnetId }}>{children}</FeedbackContext.Provider>

      {notes.map((note) => (
        <PostIt
          key={note.id}
          note={note}
          onUpdate={(updates) => updateNoteAndSave(note.id, updates)}
          onRemove={() => removeNote(note.id)}
        />
      ))}
    </div>
  );
}
