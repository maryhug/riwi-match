import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ensureFeedbackTable, getSql, withRetry } from "../db.server";

export interface NoteData {
  id: string;
  x: number;
  y: number;
  text: string;
  minimized: boolean;
  url?: string;
  magnetId?: string;
}

const noteSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  text: z.string(),
  minimized: z.boolean(),
  url: z.string().optional(),
});

function mapRow(row: Record<string, unknown>): NoteData {
  return {
    id: row.id as string,
    x: Number(row.x),
    y: Number(row.y),
    text: (row.text as string) ?? "",
    minimized: row.minimized as boolean,
    url: (row.url as string | null) ?? undefined,
    magnetId: row.magnetId as string,
  };
}

export const getNotes = createServerFn({ method: "GET" })
  .validator(z.object({ magnetId: z.string() }))
  .handler(async ({ data }) => {
    await ensureFeedbackTable();
    return withRetry(async () => {
      const sql = getSql();
      const rows = await sql`
        SELECT id, x, y, text, minimized, url, magnet_id as "magnetId"
        FROM feedback_notes
        WHERE magnet_id = ${data.magnetId}
        ORDER BY created_at ASC
      `;
      return rows.map(mapRow);
    });
  });

export const getAllNotes = createServerFn({ method: "GET" }).handler(async () => {
  await ensureFeedbackTable();
  return withRetry(async () => {
    const sql = getSql();
    const rows = await sql`
      SELECT id, x, y, text, minimized, url, magnet_id as "magnetId"
      FROM feedback_notes
      ORDER BY created_at DESC
    `;
    return rows.map(mapRow);
  });
});

export const saveNote = createServerFn({ method: "POST" })
  .validator(z.object({ note: noteSchema, magnetId: z.string() }))
  .handler(async ({ data }) => {
    await ensureFeedbackTable();
    const { note, magnetId } = data;
    await withRetry(async () => {
      const sql = getSql();
      await sql`
        INSERT INTO feedback_notes (id, magnet_id, x, y, text, minimized, url, updated_at)
        VALUES (${note.id}, ${magnetId}, ${note.x}, ${note.y}, ${note.text}, ${note.minimized}, ${note.url ?? null}, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          x = EXCLUDED.x,
          y = EXCLUDED.y,
          text = EXCLUDED.text,
          minimized = EXCLUDED.minimized,
          url = EXCLUDED.url,
          updated_at = CURRENT_TIMESTAMP
      `;
    });
    return { success: true };
  });

export const deleteNote = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await ensureFeedbackTable();
    await withRetry(async () => {
      const sql = getSql();
      await sql`DELETE FROM feedback_notes WHERE id = ${data.id}`;
    });
    return { success: true };
  });

export const deleteAllNotes = createServerFn({ method: "POST" }).handler(async () => {
  await ensureFeedbackTable();
  await withRetry(async () => {
    const sql = getSql();
    await sql`DELETE FROM feedback_notes`;
  });
  return { success: true };
});
