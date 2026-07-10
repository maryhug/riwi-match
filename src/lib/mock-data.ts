// Mock data for RIWI MATCH
export type Role = "admin" | "recruiter" | "lider";

export const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  recruiter: "Recruiter",
  lider: "Líder TA",
};

export type ProcesoEstado =
  | "Borrador"
  | "CVs cargados"
  | "Match procesado"
  | "Profiling configurado"
  | "Profiling en ejecución"
  | "Profiling completado"
  | "Cerrado"
  | "Archivado";

export interface Proceso {
  id: string;
  nombre: string;
  cargo: string;
  area: string;
  seniority: string;
  reclutador: string;
  estado: ProcesoEstado;
  candidatos: number;
  promedioMatch: number;
  costo: number;
  presupuesto: number;
  fecha: string;
  setPreguntas?: string;
}

export const procesos: Proceso[] = [
  { id: "p1", nombre: "Desarrollador Backend Node Sr", cargo: "Backend Sr", area: "Tecnología", seniority: "Sr", reclutador: "Camila Restrepo", estado: "Profiling en ejecución", candidatos: 24, promedioMatch: 72, costo: 184.5, presupuesto: 220, fecha: "2026-06-02", setPreguntas: "Profiling Backend Sr v2" },
  { id: "p2", nombre: "Data Engineer Medellín", cargo: "Data Engineer", area: "Datos", seniority: "Ssr", reclutador: "Julián Marín", estado: "Match procesado", candidatos: 18, promedioMatch: 68, costo: 92.3, presupuesto: 200, fecha: "2026-05-28" },
  { id: "p3", nombre: "QA Automation Jr", cargo: "QA Automation", area: "Tecnología", seniority: "Jr", reclutador: "Camila Restrepo", estado: "CVs cargados", candidatos: 31, promedioMatch: 0, costo: 12.4, presupuesto: 150, fecha: "2026-06-08" },
  { id: "p4", nombre: "Product Designer Sr", cargo: "Product Designer", area: "Diseño", seniority: "Sr", reclutador: "Andrés López", estado: "Profiling completado", candidatos: 14, promedioMatch: 81, costo: 145.0, presupuesto: 180, fecha: "2026-05-15", setPreguntas: "Profiling Diseño v1" },
  { id: "p5", nombre: "DevOps Engineer", cargo: "DevOps", area: "Tecnología", seniority: "Ssr", reclutador: "Julián Marín", estado: "Profiling configurado", candidatos: 9, promedioMatch: 74, costo: 56.2, presupuesto: 150, fecha: "2026-06-01", setPreguntas: "Profiling Backend Sr v2" },
  { id: "p6", nombre: "Account Manager Bogotá", cargo: "Account Manager", area: "Comercial", seniority: "Ssr", reclutador: "Laura Vélez", estado: "Cerrado", candidatos: 22, promedioMatch: 70, costo: 198.7, presupuesto: 200, fecha: "2026-04-30" },
  { id: "p7", nombre: "Frontend React Mid", cargo: "Frontend", area: "Tecnología", seniority: "Ssr", reclutador: "Camila Restrepo", estado: "Borrador", candidatos: 0, promedioMatch: 0, costo: 0, presupuesto: 180, fecha: "2026-06-09" },
  { id: "p8", nombre: "People Partner LATAM", cargo: "People Partner", area: "Personas", seniority: "Sr", reclutador: "Andrés López", estado: "Archivado", candidatos: 11, promedioMatch: 65, costo: 88.1, presupuesto: 150, fecha: "2026-03-20" },
];

export interface Candidato {
  id: string;
  nombre: string;
  avatar?: string;
  email: string;
  telefono: string;
  ciudad: string;
  match: number;
  categoria: "Alto" | "Medio" | "Bajo" | "No recomendado";
  topSkills: string[];
  seniority: string;
  profiling: "Sin iniciar" | "En cola" | "En llamada" | "Completado" | "No contestada";
  avance: "Alta" | "Media" | "Baja" | "—";
  fortalezas: string[];
  brechas: string[];
  flagExcluyente?: string;
  requiereRevision?: boolean;
  breakdown: { categoria: string; puntaje: number; peso: number }[];
}

export const candidatos: Candidato[] = [
  { id: "c1", nombre: "Mariana Ospina", email: "mariana.ospina@mail.com", telefono: "+57 300 555 1011", ciudad: "Medellín", match: 94, categoria: "Alto", topSkills: ["Node.js", "PostgreSQL", "AWS", "Kafka"], seniority: "Sr", profiling: "Completado", avance: "Alta", fortalezas: ["8 años en Node", "Liderazgo de squads", "Inglés C1"], brechas: ["Sin experiencia en GCP"], breakdown: [{categoria:"Skills técnicos",puntaje:96,peso:45},{categoria:"Experiencia",puntaje:92,peso:25},{categoria:"Seniority",puntaje:95,peso:15},{categoria:"Industria",puntaje:85,peso:7},{categoria:"Idiomas",puntaje:100,peso:5},{categoria:"Educación",puntaje:90,peso:3}] },
  { id: "c2", nombre: "Daniel Cárdenas", email: "daniel.c@mail.com", telefono: "+57 301 222 3344", ciudad: "Bogotá", match: 89, categoria: "Alto", topSkills: ["Node.js", "TypeScript", "MongoDB"], seniority: "Sr", profiling: "En llamada", avance: "Alta", fortalezas: ["Experto TS", "Open source"], brechas: ["Poca exposición a microservicios"], breakdown: [{categoria:"Skills técnicos",puntaje:92,peso:45},{categoria:"Experiencia",puntaje:88,peso:25},{categoria:"Seniority",puntaje:90,peso:15},{categoria:"Industria",puntaje:78,peso:7},{categoria:"Idiomas",puntaje:80,peso:5},{categoria:"Educación",puntaje:82,peso:3}] },
  { id: "c3", nombre: "Valentina Rojas", email: "vrojas@mail.com", telefono: "+57 302 111 9090", ciudad: "Medellín", match: 88, categoria: "Alto", topSkills: ["Node.js", "Express", "Redis"], seniority: "Ssr", profiling: "Sin iniciar", avance: "—", fortalezas: ["Fuerte en backend", "Buen ajuste cultural"], brechas: ["Inglés B1 (requerido B2)"], flagExcluyente: "Inglés B2 requerido — actual B1", breakdown: [{categoria:"Skills técnicos",puntaje:94,peso:45},{categoria:"Experiencia",puntaje:86,peso:25},{categoria:"Seniority",puntaje:80,peso:15},{categoria:"Industria",puntaje:75,peso:7},{categoria:"Idiomas",puntaje:55,peso:5},{categoria:"Educación",puntaje:85,peso:3}] },
  { id: "c4", nombre: "Esteban Quintero", email: "equintero@mail.com", telefono: "+57 310 444 5566", ciudad: "Cali", match: 82, categoria: "Alto", topSkills: ["Node.js", "GraphQL"], seniority: "Sr", profiling: "Completado", avance: "Media", fortalezas: ["GraphQL avanzado"], brechas: ["Expectativa salarial sobre rango"], breakdown: [{categoria:"Skills técnicos",puntaje:88,peso:45},{categoria:"Experiencia",puntaje:80,peso:25},{categoria:"Seniority",puntaje:85,peso:15},{categoria:"Industria",puntaje:70,peso:7},{categoria:"Idiomas",puntaje:75,peso:5},{categoria:"Educación",puntaje:80,peso:3}] },
  { id: "c5", nombre: "Laura Mendoza", email: "lmendoza@mail.com", telefono: "+57 320 777 1212", ciudad: "Bogotá", match: 76, categoria: "Medio", topSkills: ["Node.js", "Docker"], seniority: "Ssr", profiling: "En cola", avance: "—", fortalezas: ["Buena base DevOps"], brechas: ["Limitada experiencia en alta concurrencia"], breakdown: [{categoria:"Skills técnicos",puntaje:80,peso:45},{categoria:"Experiencia",puntaje:72,peso:25},{categoria:"Seniority",puntaje:70,peso:15},{categoria:"Industria",puntaje:68,peso:7},{categoria:"Idiomas",puntaje:82,peso:5},{categoria:"Educación",puntaje:78,peso:3}] },
  { id: "c6", nombre: "Juan Pablo Henao", email: "jp.henao@mail.com", telefono: "+57 311 909 1010", ciudad: "Medellín", match: 71, categoria: "Medio", topSkills: ["Java", "Spring"], seniority: "Sr", profiling: "Sin iniciar", avance: "—", fortalezas: ["Backend sólido"], brechas: ["Stack distinto al requerido"], breakdown: [{categoria:"Skills técnicos",puntaje:65,peso:45},{categoria:"Experiencia",puntaje:80,peso:25},{categoria:"Seniority",puntaje:88,peso:15},{categoria:"Industria",puntaje:72,peso:7},{categoria:"Idiomas",puntaje:75,peso:5},{categoria:"Educación",puntaje:80,peso:3}] },
  { id: "c7", nombre: "Sara Gutiérrez", email: "sara.g@mail.com", telefono: "+57 313 121 8989", ciudad: "Medellín", match: 68, categoria: "Medio", topSkills: ["Node.js"], seniority: "Ssr", profiling: "Completado", avance: "Baja", fortalezas: ["Comunicación clara"], brechas: ["Reportó conflicto en último empleo"], requiereRevision: false, breakdown: [{categoria:"Skills técnicos",puntaje:70,peso:45},{categoria:"Experiencia",puntaje:65,peso:25},{categoria:"Seniority",puntaje:70,peso:15},{categoria:"Industria",puntaje:60,peso:7},{categoria:"Idiomas",puntaje:80,peso:5},{categoria:"Educación",puntaje:75,peso:3}] },
  { id: "c8", nombre: "Carlos Aristizábal", email: "caristi@mail.com", telefono: "+57 318 565 7878", ciudad: "Bogotá", match: 64, categoria: "Medio", topSkills: ["Python", "Django"], seniority: "Ssr", profiling: "Sin iniciar", avance: "—", fortalezas: ["Python fuerte"], brechas: ["No es stack objetivo"], breakdown: [{categoria:"Skills técnicos",puntaje:58,peso:45},{categoria:"Experiencia",puntaje:75,peso:25},{categoria:"Seniority",puntaje:70,peso:15},{categoria:"Industria",puntaje:70,peso:7},{categoria:"Idiomas",puntaje:75,peso:5},{categoria:"Educación",puntaje:72,peso:3}] },
  { id: "c9", nombre: "Isabella Cano", email: "icano@mail.com", telefono: "+57 304 333 2121", ciudad: "Pereira", match: 58, categoria: "Bajo", topSkills: ["Node.js"], seniority: "Jr", profiling: "Sin iniciar", avance: "—", fortalezas: ["Actitud de aprendizaje"], brechas: ["Seniority menor al requerido"], requiereRevision: true, breakdown: [{categoria:"Skills técnicos",puntaje:62,peso:45},{categoria:"Experiencia",puntaje:50,peso:25},{categoria:"Seniority",puntaje:45,peso:15},{categoria:"Industria",puntaje:60,peso:7},{categoria:"Idiomas",puntaje:78,peso:5},{categoria:"Educación",puntaje:70,peso:3}] },
  { id: "c10", nombre: "Miguel Ángel Soto", email: "ma.soto@mail.com", telefono: "+57 315 656 4747", ciudad: "Cali", match: 52, categoria: "Bajo", topSkills: ["PHP", "Laravel"], seniority: "Ssr", profiling: "No contestada", avance: "—", fortalezas: ["Experiencia en e-commerce"], brechas: ["Stack lejos del requerido"], breakdown: [{categoria:"Skills técnicos",puntaje:45,peso:45},{categoria:"Experiencia",puntaje:65,peso:25},{categoria:"Seniority",puntaje:70,peso:15},{categoria:"Industria",puntaje:75,peso:7},{categoria:"Idiomas",puntaje:60,peso:5},{categoria:"Educación",puntaje:70,peso:3}] },
  { id: "c11", nombre: "Natalia Pérez", email: "npp@mail.com", telefono: "+57 312 818 5050", ciudad: "Manizales", match: 44, categoria: "Bajo", topSkills: [".NET"], seniority: "Ssr", profiling: "Sin iniciar", avance: "—", fortalezas: [".NET sólido"], brechas: ["No coincide con el stack"], breakdown: [{categoria:"Skills técnicos",puntaje:35,peso:45},{categoria:"Experiencia",puntaje:60,peso:25},{categoria:"Seniority",puntaje:65,peso:15},{categoria:"Industria",puntaje:55,peso:7},{categoria:"Idiomas",puntaje:60,peso:5},{categoria:"Educación",puntaje:70,peso:3}] },
  { id: "c12", nombre: "Andrés Felipe Ruiz", email: "afruiz@mail.com", telefono: "+57 314 232 9090", ciudad: "Cartagena", match: 31, categoria: "No recomendado", topSkills: ["WordPress"], seniority: "Jr", profiling: "Sin iniciar", avance: "—", fortalezas: ["Buen frontend básico"], brechas: ["Perfil muy alejado"], breakdown: [{categoria:"Skills técnicos",puntaje:20,peso:45},{categoria:"Experiencia",puntaje:40,peso:25},{categoria:"Seniority",puntaje:40,peso:15},{categoria:"Industria",puntaje:50,peso:7},{categoria:"Idiomas",puntaje:60,peso:5},{categoria:"Educación",puntaje:65,peso:3}] },
];

export interface QuestionSet {
  id: string;
  nombre: string;
  descripcion: string;
  cargo: string;
  idioma: string;
  preguntas: number;
  estado: "Borrador" | "Activo" | "Archivado";
  version: string;
  creador: string;
  fecha: string;
  enUso?: boolean;
}

export const sets: QuestionSet[] = [
  { id: "s1", nombre: "Profiling Backend Sr v2", descripcion: "Set estándar para perfiles backend senior — incluye disponibilidad híbrida y motivaciones.", cargo: "Backend Sr", idioma: "Español", preguntas: 6, estado: "Activo", version: "v2", creador: "Camila Restrepo", fecha: "2026-05-18", enUso: true },
  { id: "s2", nombre: "Profiling Diseño v1", descripcion: "Profiling para roles de Product Design — afinidad con producto y proceso.", cargo: "Product Designer", idioma: "Español", preguntas: 5, estado: "Activo", version: "v1", creador: "Andrés López", fecha: "2026-04-22", enUso: true },
  { id: "s3", nombre: "Profiling Comercial Jr", descripcion: "Borrador inicial para perfiles comerciales junior.", cargo: "Account Manager", idioma: "Español", preguntas: 4, estado: "Borrador", version: "v1", creador: "Laura Vélez", fecha: "2026-06-05" },
];

export interface CallItem {
  id: string;
  candidato: string;
  cargo: string;
  estado: "activa" | "cola" | "completada" | "fallida";
  duracion?: string;
  posicion?: number;
  intento?: number;
  proximoIntento?: string;
}

export const llamadas: CallItem[] = [
  { id: "l1", candidato: "Daniel Cárdenas", cargo: "Backend Sr", estado: "activa", duracion: "02:14" },
  { id: "l2", candidato: "Mariana Ospina", cargo: "Backend Sr", estado: "activa", duracion: "04:32" },
  { id: "l3", candidato: "Esteban Quintero", cargo: "Backend Sr", estado: "activa", duracion: "01:08" },
  { id: "l4", candidato: "Sara Gutiérrez", cargo: "Backend Sr", estado: "activa", duracion: "03:45" },
  { id: "l5", candidato: "Laura Mendoza", cargo: "Backend Sr", estado: "cola", posicion: 1 },
  { id: "l6", candidato: "Juan Pablo Henao", cargo: "Backend Sr", estado: "cola", posicion: 2 },
  { id: "l7", candidato: "Carlos Aristizábal", cargo: "Backend Sr", estado: "cola", posicion: 3 },
  { id: "l8", candidato: "Camilo Restrepo", cargo: "DevOps", estado: "completada" },
  { id: "l9", candidato: "Diana Marín", cargo: "DevOps", estado: "completada" },
  { id: "l10", candidato: "Miguel Ángel Soto", cargo: "Backend Sr", estado: "fallida", intento: 2, proximoIntento: "Hoy 14:30" },
];

export const matchDistribution = [
  { name: "Alto", value: 8, color: "hsl(155 55% 58%)" },
  { name: "Medio", value: 14, color: "hsl(45 75% 61%)" },
  { name: "Bajo", value: 6, color: "hsl(9 99% 65%)" },
  { name: "No recomendado", value: 3, color: "hsl(233 20% 60%)" },
];

export const avanceData = [
  { name: "Alta", value: 6 },
  { name: "Media", value: 11 },
  { name: "Baja", value: 7 },
];

export const funnelData = [
  { etapa: "CVs cargados", value: 31 },
  { etapa: "Match alto", value: 12 },
  { etapa: "Enviados a profiling", value: 8 },
  { etapa: "Avance alta", value: 4 },
];

export const costoSerie = [
  { dia: "01", costo: 12 }, { dia: "02", costo: 18 }, { dia: "03", costo: 22 },
  { dia: "04", costo: 17 }, { dia: "05", costo: 28 }, { dia: "06", costo: 35 },
  { dia: "07", costo: 30 }, { dia: "08", costo: 42 }, { dia: "09", costo: 38 },
  { dia: "10", costo: 45 },
];

export const equipoCargas = [
  { recruiter: "Camila R.", cvs: 87, match: 73 },
  { recruiter: "Julián M.", cvs: 54, match: 71 },
  { recruiter: "Andrés L.", cvs: 38, match: 78 },
  { recruiter: "Laura V.", cvs: 42, match: 69 },
];

export const calidadCVs = [
  { semana: "S1", calidad: 62 }, { semana: "S2", calidad: 65 },
  { semana: "S3", calidad: 71 }, { semana: "S4", calidad: 74 },
  { semana: "S5", calidad: 70 }, { semana: "S6", calidad: 78 },
];

export const usuariosAdmin = [
  { id: "u1", nombre: "Camila Restrepo", email: "camila@riwi.io", rol: "Recruiter", estado: "Activo" },
  { id: "u2", nombre: "Julián Marín", email: "julian@riwi.io", rol: "Recruiter", estado: "Activo" },
  { id: "u3", nombre: "Andrés López", email: "andres@riwi.io", rol: "Recruiter", estado: "Activo" },
  { id: "u4", nombre: "Laura Vélez", email: "laura@riwi.io", rol: "Recruiter", estado: "Inactivo" },
  { id: "u5", nombre: "Sofía Henríquez", email: "sofia@riwi.io", rol: "Líder TA", estado: "Activo" },
  { id: "u6", nombre: "Mateo Vargas", email: "mateo@riwi.io", rol: "Administrador", estado: "Activo" },
];
