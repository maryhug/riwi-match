import { neon } from "@neondatabase/serverless";

// En Cloudflare Workers el binding de env solo existe en tiempo de request — por eso
// process.env.DATABASE_URL se lee dentro de esta función, nunca a nivel de módulo
// (mismo criterio que ya documenta src/lib/config.server.ts).
export function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("Falta la variable de entorno DATABASE_URL");
  return neon(databaseUrl);
}

// El pooler de Neon falla intermitentemente (ETIMEDOUT) desde algunos entornos —
// unos pocos reintentos con backoff corto absorben esos cortes transitorios sin que
// el usuario note nada.
export async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastError;
}

let tableReady: Promise<void> | null = null;

export function ensureFeedbackTable() {
  if (!tableReady) {
    tableReady = withRetry(async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS feedback_notes (
          id VARCHAR(255) PRIMARY KEY,
          magnet_id VARCHAR(255) NOT NULL,
          x FLOAT NOT NULL,
          y FLOAT NOT NULL,
          text TEXT,
          minimized BOOLEAN DEFAULT false,
          url VARCHAR(1024),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
    }).catch((error) => {
      // No memoizar un fallo: el próximo request debe poder reintentar desde cero.
      tableReady = null;
      throw error;
    });
  }
  return tableReady;
}
