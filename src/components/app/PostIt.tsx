import { useRef, useState, useEffect, type PointerEvent } from "react";
import { X, Minus, MessageSquareText } from "lucide-react";
import type { NoteData } from "@/lib/api/feedback.functions";

export function PostIt({
  note,
  onUpdate,
  onRemove,
}: {
  note: NoteData;
  onUpdate: (updates: Partial<NoteData>) => void;
  onRemove: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialLeft: 0, initialTop: 0 });
  const hasDraggedRef = useRef(false);
  const postItRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (note.minimized) return;

    const handleDocumentClick = (e: MouseEvent | TouchEvent) => {
      if (postItRef.current && postItRef.current.contains(e.target as Node)) return;
      if ((e.target as HTMLElement).closest(".feedback-menu")) return;
      if (!note.text || note.text.trim() === "") {
        onRemove();
      } else {
        onUpdate({ minimized: true });
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleDocumentClick);
      document.addEventListener("touchstart", handleDocumentClick);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("touchstart", handleDocumentClick);
    };
  }, [note.minimized, note.text, onRemove, onUpdate]);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest(".post-it-handle")) return;
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    if (!postItRef.current) return;
    postItRef.current.setPointerCapture(e.pointerId);
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY, initialLeft: note.x, initialTop: note.y };
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDraggedRef.current = true;
    onUpdate({ x: dragStartRef.current.initialLeft + dx, y: dragStartRef.current.initialTop + dy });
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    if (postItRef.current?.hasPointerCapture(e.pointerId)) {
      postItRef.current.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  return (
    <div
      ref={postItRef}
      className={`post-it absolute z-[100] flex flex-col overflow-hidden ${
        isDragging ? "" : "transition-all duration-300"
      } ${note.minimized ? "rounded-full cursor-pointer hover:scale-110" : "rounded-lg"}`}
      style={{
        left: note.x,
        top: note.y,
        width: note.minimized ? "44px" : "260px",
        height: note.minimized ? "44px" : "auto",
        boxShadow: note.minimized ? "0 4px 14px rgba(124, 58, 237, 0.4)" : "0 12px 30px -8px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        backgroundColor: note.minimized ? "#7C3AED" : "#FFFBEA",
        border: note.minimized ? "none" : "1px solid #E2E8F0",
        userSelect: isDragging ? "none" : "auto",
        transform: note.minimized ? "translate(-50%, -50%)" : "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {note.minimized ? (
        <div
          className="post-it-handle w-full h-full flex items-center justify-center text-white"
          onClick={(e) => { e.stopPropagation(); if (!hasDraggedRef.current) onUpdate({ minimized: false }); }}
        >
          <MessageSquareText className="h-5 w-5" />
        </div>
      ) : (
        <>
          <div className="post-it-handle bg-violet-100 border-b border-violet-200 flex justify-between items-center px-4 py-2 cursor-grab active:cursor-grabbing">
            <div className="flex items-center gap-2 text-violet-800">
              <MessageSquareText className="h-4 w-4" />
              <span className="text-xs font-semibold">Anotación</span>
            </div>
            <div className="flex gap-1.5">
              <button onClick={(e) => { e.stopPropagation(); onUpdate({ minimized: true }); }} className="h-5 w-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-white transition-colors" title="Minimizar">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="h-5 w-5 flex items-center justify-center rounded text-slate-400 hover:text-red-500 hover:bg-white transition-colors" title="Eliminar">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="p-4 flex-1">
            <textarea
              value={note.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              placeholder="Escribe tu apunte aquí..."
              className="w-full h-32 bg-transparent outline-none resize-none text-sm text-slate-800 placeholder:text-slate-400"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
        </>
      )}
    </div>
  );
}
