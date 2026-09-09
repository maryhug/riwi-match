// Activación operativa: configura VITE_ENABLE_PROFILING_OUTREACH=true y vuelve a desplegar.
// Gobierna el inicio completo del profiling: consentimiento por WhatsApp y llamada de voz.
export const PROFILING_OUTREACH_ENABLED =
  import.meta.env.VITE_ENABLE_PROFILING_OUTREACH?.toLowerCase() === "true";
