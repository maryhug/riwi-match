import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanAnswerText(normalized?: string | null, raw?: string | null): string {
  const textToClean = normalized && normalized.trim() ? normalized : (raw ?? "");
  if (!textToClean || !textToClean.trim()) {
    return "Sin respuesta registrada.";
  }

  let cleaned = textToClean.trim();
  // Strip common filler prefixes: "Eh,", "Este,", "Bueno,", "Pues,", "Mmm,", "O sea,"
  cleaned = cleaned.replace(/^(?:eh|este|bueno|pues|mmm?|o sea)[,\s]+/gi, "");
  cleaned = cleaned.replace(/^(?:eh|este|bueno|pues|mmm?|o sea)[,\s]+/gi, "");

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

