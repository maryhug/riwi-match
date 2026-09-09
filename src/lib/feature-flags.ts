// Activación operativa: configura VITE_ENABLE_VOICE_PROFILING=true y vuelve a desplegar.
// El valor seguro por defecto mantiene deshabilitada la originación de nuevas llamadas.
export const VOICE_PROFILING_ENABLED =
  import.meta.env.VITE_ENABLE_VOICE_PROFILING?.toLowerCase() === "true";
