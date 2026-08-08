import type {
  ProfilingAnswersResponse,
  ProfilingRunListResponse,
  ProfilingRunOut,
  UploadCVsResponse,
} from "../../src/lib/types/api";

export async function uploadCVs(): Promise<UploadCVsResponse> {
  return { uploaded: 1, message: "CV cargado", candidates: [] };
}

export async function getCandidateProfilingHistory(): Promise<ProfilingRunListResponse> {
  return { total: 0, profiling_runs: [] };
}

export async function getProfilingRunDetail(): Promise<ProfilingRunOut> {
  throw new Error("La prueba debe precargar el detalle de la corrida");
}

export async function getProfilingAnswers(): Promise<ProfilingAnswersResponse> {
  return { answers: [] };
}
