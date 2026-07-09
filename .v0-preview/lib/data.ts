import type {
  AIModelConfig,
  AIPrompt,
  BackendProfilingRunItem,
  CandidateListItem,
  DualKanbanResponse,
  DualMatchCandidate,
  HiringProcess,
  MetricsDashboard,
  ProfilingQuestion,
  QuestionSet,
  User,
} from './types'

// ===== Procesos de contratación =====

export const hiringProcesses: HiringProcess[] = [
  {
    id: 'hp-001',
    name: 'Backend Squad Pagos',
    job_title: 'Desarrollador Backend Senior',
    area: 'Ingeniería',
    seniority: 'Senior',
    status: 'MATCHING',
    budget_max_usd: 4500,
    created_at: '2026-07-06T14:20:00Z',
    updated_at: '2026-07-08T09:10:00Z',
    job_description_data: {
      jd_id: 'jd-101',
      version: 2,
      text_preview:
        'Buscamos un Desarrollador Backend Senior con experiencia sólida en Python (FastAPI o Django), diseño de APIs REST, mensajería con Celery/RabbitMQ y bases de datos PostgreSQL. Deseable experiencia en sistemas de pagos, PCI-DSS y arquitecturas orientadas a eventos...',
      jd_raw_text:
        'Buscamos un Desarrollador Backend Senior con experiencia sólida en Python (FastAPI o Django), diseño de APIs REST, mensajería con Celery/RabbitMQ y bases de datos PostgreSQL. Deseable experiencia en sistemas de pagos, PCI-DSS y arquitecturas orientadas a eventos. Responsabilidades: diseñar y mantener microservicios de la plataforma de pagos, garantizar SLAs de disponibilidad, participar en revisiones de código y mentoría de perfiles junior.',
      jd_file_url: '/documents/jd-backend-pagos.pdf',
      original_filename: 'JD_Backend_Senior_Pagos_v2.pdf',
      created_at: '2026-07-06T15:00:00Z',
    },
  },
  {
    id: 'hp-002',
    name: 'Diseño Producto Core',
    job_title: 'Product Designer',
    area: 'Diseño',
    seniority: 'Mid',
    status: 'COMPLETED',
    budget_max_usd: 3200,
    created_at: '2026-06-28T10:00:00Z',
    updated_at: '2026-07-05T16:45:00Z',
    job_description_data: {
      jd_id: 'jd-102',
      version: 1,
      text_preview:
        'Product Designer con enfoque en sistemas de diseño, prototipado de alta fidelidad y research generativo. Manejo avanzado de Figma...',
      jd_raw_text:
        'Product Designer con enfoque en sistemas de diseño, prototipado de alta fidelidad y research generativo. Manejo avanzado de Figma, experiencia colaborando con equipos de ingeniería en entornos ágiles.',
      jd_file_url: '/documents/jd-product-designer.pdf',
      original_filename: 'JD_Product_Designer.pdf',
      created_at: '2026-06-28T10:30:00Z',
    },
  },
  {
    id: 'hp-003',
    name: 'Data Platform',
    job_title: 'Ingeniero de Datos',
    area: 'Datos',
    seniority: 'Senior',
    status: 'PROFILING_CONFIGURED',
    budget_max_usd: 5000,
    created_at: '2026-07-01T08:30:00Z',
    updated_at: '2026-07-07T11:20:00Z',
    job_description_data: {
      jd_id: 'jd-103',
      version: 3,
      text_preview:
        'Ingeniero de Datos Senior para liderar la evolución del data lakehouse: pipelines con Airflow/dbt, modelado dimensional, Spark y gobernanza de datos...',
      jd_raw_text:
        'Ingeniero de Datos Senior para liderar la evolución del data lakehouse: pipelines con Airflow/dbt, modelado dimensional, Spark y gobernanza de datos. Experiencia con AWS (S3, Glue, Redshift) y CI/CD para datos.',
      jd_file_url: '/documents/jd-data-engineer.pdf',
      original_filename: 'JD_Data_Engineer_v3.pdf',
      created_at: '2026-07-01T09:00:00Z',
    },
  },
  {
    id: 'hp-004',
    name: 'Frontend Web App',
    job_title: 'Desarrollador Frontend',
    area: 'Ingeniería',
    seniority: 'Mid',
    status: 'CVS_UPLOADED',
    budget_max_usd: 3000,
    created_at: '2026-07-03T13:15:00Z',
    updated_at: '2026-07-06T10:05:00Z',
    job_description_data: {
      jd_id: 'jd-104',
      version: 1,
      text_preview:
        'Desarrollador Frontend con experiencia en React, TypeScript y Next.js. Sensibilidad por la accesibilidad y el rendimiento web...',
      jd_raw_text:
        'Desarrollador Frontend con experiencia en React, TypeScript y Next.js. Sensibilidad por la accesibilidad y el rendimiento web. Deseable experiencia con Tailwind CSS y testing con Playwright.',
      jd_file_url: '/documents/jd-frontend.pdf',
      original_filename: 'JD_Frontend_Mid.pdf',
      created_at: '2026-07-03T13:40:00Z',
    },
  },
  {
    id: 'hp-005',
    name: 'Growth Marketing Q3',
    job_title: 'Especialista en Growth',
    area: 'Marketing',
    seniority: 'Mid',
    status: 'READY_FOR_MATCH',
    budget_max_usd: 2600,
    created_at: '2026-07-05T09:45:00Z',
    updated_at: '2026-07-05T09:45:00Z',
    job_description_data: {
      jd_id: 'jd-105',
      version: 1,
      text_preview:
        'Especialista en Growth con experiencia en experimentación, funnels de adquisición, SEO/SEM y analítica de producto...',
      jd_raw_text:
        'Especialista en Growth con experiencia en experimentación, funnels de adquisición, SEO/SEM y analítica de producto (Amplitude o Mixpanel).',
      jd_file_url: null,
      original_filename: null,
      created_at: '2026-07-05T10:00:00Z',
    },
  },
  {
    id: 'hp-006',
    name: 'People Ops',
    job_title: 'Analista de Talento',
    area: 'Talento Humano',
    seniority: 'Junior',
    status: 'DRAFT',
    budget_max_usd: 1500,
    created_at: '2026-07-07T16:00:00Z',
    updated_at: '2026-07-07T16:00:00Z',
    job_description_data: null,
  },
  {
    id: 'hp-007',
    name: 'SRE Plataforma',
    job_title: 'Site Reliability Engineer',
    area: 'Ingeniería',
    seniority: 'Senior',
    status: 'COMPLETED',
    budget_max_usd: 5200,
    created_at: '2026-06-20T11:30:00Z',
    updated_at: '2026-07-02T14:00:00Z',
    job_description_data: {
      jd_id: 'jd-107',
      version: 2,
      text_preview:
        'SRE Senior con experiencia en Kubernetes, observabilidad (Prometheus/Grafana), IaC con Terraform y gestión de incidentes...',
      jd_raw_text:
        'SRE Senior con experiencia en Kubernetes, observabilidad (Prometheus/Grafana), IaC con Terraform y gestión de incidentes.',
      jd_file_url: '/documents/jd-sre.pdf',
      original_filename: 'JD_SRE_Senior.pdf',
      created_at: '2026-06-20T12:00:00Z',
    },
  },
  {
    id: 'hp-008',
    name: 'Ventas Enterprise',
    job_title: 'Account Executive',
    area: 'Ventas',
    seniority: 'Senior',
    status: 'MATCHING',
    budget_max_usd: 3800,
    created_at: '2026-07-04T08:00:00Z',
    updated_at: '2026-07-08T08:30:00Z',
    job_description_data: {
      jd_id: 'jd-108',
      version: 1,
      text_preview:
        'Account Executive con experiencia en ventas B2B enterprise en LATAM, ciclos de venta largos y manejo de CRM...',
      jd_raw_text:
        'Account Executive con experiencia en ventas B2B enterprise en LATAM, ciclos de venta largos y manejo de CRM (HubSpot o Salesforce).',
      jd_file_url: '/documents/jd-ae.pdf',
      original_filename: 'JD_Account_Executive.pdf',
      created_at: '2026-07-04T08:30:00Z',
    },
  },
  {
    id: 'hp-009',
    name: 'QA Automatización',
    job_title: 'QA Automation Engineer',
    area: 'Ingeniería',
    seniority: 'Mid',
    status: 'DRAFT',
    budget_max_usd: 2800,
    created_at: '2026-07-08T10:20:00Z',
    updated_at: '2026-07-08T10:20:00Z',
    job_description_data: null,
  },
  {
    id: 'hp-010',
    name: 'Analítica Financiera',
    job_title: 'Analista de Datos',
    area: 'Datos',
    seniority: 'Mid',
    status: 'CVS_UPLOADED',
    budget_max_usd: 2400,
    created_at: '2026-07-02T15:10:00Z',
    updated_at: '2026-07-06T17:40:00Z',
    job_description_data: {
      jd_id: 'jd-110',
      version: 1,
      text_preview:
        'Analista de Datos con SQL avanzado, visualización en Looker/Power BI y modelado financiero...',
      jd_raw_text:
        'Analista de Datos con SQL avanzado, visualización en Looker/Power BI y modelado financiero.',
      jd_file_url: '/documents/jd-analista-datos.pdf',
      original_filename: 'JD_Analista_Datos.pdf',
      created_at: '2026-07-02T15:30:00Z',
    },
  },
]

export function getProcessById(id: string): HiringProcess | undefined {
  return hiringProcesses.find((p) => p.id === id)
}

// ===== Candidatos (Kanban dual) =====

function makeDual(
  id: string,
  name: string,
  lastName: string,
  cvPct: number,
  cvCat: 'HIGH' | 'MEDIUM' | 'LOW',
  profPct: number,
  profCat: 'HIGH' | 'MEDIUM' | 'LOW' | null,
  status: string,
): DualMatchCandidate {
  return {
    id: `dm-${id}`,
    process_id: 'hp-001',
    candidate_id: `c-${id}`,
    status,
    match_percentage: profPct,
    match_category: profCat,
    cv_match_percentage: cvPct,
    cv_match_category: cvCat,
    candidate: {
      id: `c-${id}`,
      name,
      last_name: lastName,
      email: `${name.toLowerCase()}.${lastName.toLowerCase().split(' ')[0]}@mail.com`,
      phone: `+57 30${id} 555 12${id}`,
      cv_file_url: `/documents/cv-${id}.pdf`,
      created_at: '2026-07-06T10:00:00Z',
      updated_at: '2026-07-08T09:00:00Z',
    },
  }
}

export const dualKanban: DualKanbanResponse = {
  HIGH: [
    makeDual('01', 'Laura', 'Gómez', 94, 'HIGH', 91, 'HIGH', 'MATCHED'),
    makeDual('02', 'Andrés', 'Restrepo', 89, 'HIGH', 86, 'HIGH', 'MATCHED'),
    makeDual('03', 'Camila', 'Torres', 87, 'HIGH', 82, 'HIGH', 'MATCHED'),
  ],
  MEDIUM: [
    makeDual('04', 'Julián', 'Pérez', 74, 'MEDIUM', 69, 'MEDIUM', 'MATCHED'),
    makeDual('05', 'Sofía', 'Martínez', 68, 'MEDIUM', 72, 'MEDIUM', 'MATCHED'),
    makeDual('06', 'Mateo', 'López', 65, 'MEDIUM', 58, 'MEDIUM', 'MATCHED'),
    makeDual('07', 'Valentina', 'Ríos', 62, 'MEDIUM', 61, 'MEDIUM', 'MATCHED'),
  ],
  LOW: [
    makeDual('08', 'Daniel', 'Castaño', 41, 'LOW', 38, 'LOW', 'MATCHED'),
    makeDual('09', 'María', 'Ángel', 35, 'LOW', 30, 'LOW', 'MATCHED'),
  ],
  LOADED: [
    makeDual('10', 'Santiago', 'Muñoz', 0, 'LOW', 0, null, 'LOADED'),
    makeDual('11', 'Isabella', 'Cardona', 0, 'LOW', 0, null, 'LOADED'),
  ],
  PARSING: [makeDual('12', 'Tomás', 'Herrera', 0, 'LOW', 0, null, 'PARSING')],
}

// ===== Ranking =====

export const rankingCandidates: CandidateListItem[] = [
  {
    rank: 1,
    process_candidate_id: 'dm-01',
    candidate_id: 'c-01',
    name: 'Laura Gómez',
    email: 'laura.gomez@mail.com',
    phone: '+57 301 555 1201',
    status: 'MATCHED',
    match_percentage: 91,
    match_category: 'HIGH',
    normalized_cv_url: '/documents/cv-01.pdf',
    city: 'Medellín',
    match_summary:
      'Perfil altamente alineado: 7 años de experiencia backend con Python y FastAPI, lideró la migración de un monolito de pagos a microservicios. Experiencia directa con Celery y PostgreSQL a escala.',
    strengths: [
      'Experiencia directa en sistemas de pagos y PCI-DSS',
      'Dominio de FastAPI, Celery y PostgreSQL',
      'Liderazgo técnico y mentoría comprobada',
    ],
    gaps: ['Sin experiencia con RabbitMQ (usó Redis como broker)'],
    breakdown: {
      technical_skills: { raw_score: 95, weighted_score: 28.5, weight: 30 },
      relevant_experience: { raw_score: 92, weighted_score: 23, weight: 25 },
      seniority: { raw_score: 90, weighted_score: 13.5, weight: 15 },
      industry_domain: { raw_score: 88, weighted_score: 13.2, weight: 15 },
      languages: { raw_score: 85, weighted_score: 8.5, weight: 10 },
      education_certifications: { raw_score: 80, weighted_score: 4, weight: 5 },
    },
  },
  {
    rank: 2,
    process_candidate_id: 'dm-02',
    candidate_id: 'c-02',
    name: 'Andrés Restrepo',
    email: 'andres.restrepo@mail.com',
    phone: '+57 302 555 1202',
    status: 'MATCHED',
    match_percentage: 86,
    match_category: 'HIGH',
    normalized_cv_url: '/documents/cv-02.pdf',
    city: 'Bogotá',
    match_summary:
      'Backend senior con 6 años en fintech. Fuerte en diseño de APIs y arquitecturas orientadas a eventos; menor exposición a liderazgo de equipos.',
    strengths: [
      'Arquitecturas orientadas a eventos en producción',
      'Experiencia fintech y cumplimiento normativo',
    ],
    gaps: ['Poca experiencia en mentoría de juniors', 'Inglés intermedio'],
    breakdown: {
      technical_skills: { raw_score: 90, weighted_score: 27, weight: 30 },
      relevant_experience: { raw_score: 88, weighted_score: 22, weight: 25 },
      seniority: { raw_score: 85, weighted_score: 12.8, weight: 15 },
      industry_domain: { raw_score: 90, weighted_score: 13.5, weight: 15 },
      languages: { raw_score: 60, weighted_score: 6, weight: 10 },
      education_certifications: { raw_score: 75, weighted_score: 3.8, weight: 5 },
    },
  },
  {
    rank: 3,
    process_candidate_id: 'dm-03',
    candidate_id: 'c-03',
    name: 'Camila Torres',
    email: 'camila.torres@mail.com',
    phone: '+57 303 555 1203',
    status: 'MATCHED',
    match_percentage: 82,
    match_category: 'HIGH',
    normalized_cv_url: '/documents/cv-03.pdf',
    city: 'Cali',
    match_summary:
      'Sólida trayectoria en Python y Django con transición reciente a FastAPI. Gran fit cultural según notas del reclutador.',
    strengths: ['Excelentes fundamentos de bases de datos', 'Certificación AWS Solutions Architect'],
    gaps: ['FastAPI solo en proyectos recientes (1 año)'],
    breakdown: {
      technical_skills: { raw_score: 84, weighted_score: 25.2, weight: 30 },
      relevant_experience: { raw_score: 80, weighted_score: 20, weight: 25 },
      seniority: { raw_score: 82, weighted_score: 12.3, weight: 15 },
      industry_domain: { raw_score: 75, weighted_score: 11.3, weight: 15 },
      languages: { raw_score: 90, weighted_score: 9, weight: 10 },
      education_certifications: { raw_score: 95, weighted_score: 4.8, weight: 5 },
    },
  },
  {
    rank: 4,
    process_candidate_id: 'dm-04',
    candidate_id: 'c-04',
    name: 'Julián Pérez',
    email: 'julian.perez@mail.com',
    phone: '+57 304 555 1204',
    status: 'MATCHED',
    match_percentage: 69,
    match_category: 'MEDIUM',
    normalized_cv_url: '/documents/cv-04.pdf',
    city: 'Medellín',
    match_summary:
      'Perfil mid-senior con buena base técnica pero experiencia limitada en el dominio de pagos.',
    strengths: ['Buen manejo de PostgreSQL y optimización de consultas'],
    gaps: ['Sin experiencia en pagos', 'Seniority por debajo de lo requerido'],
    breakdown: {
      technical_skills: { raw_score: 75, weighted_score: 22.5, weight: 30 },
      relevant_experience: { raw_score: 65, weighted_score: 16.3, weight: 25 },
      seniority: { raw_score: 60, weighted_score: 9, weight: 15 },
      industry_domain: { raw_score: 50, weighted_score: 7.5, weight: 15 },
      languages: { raw_score: 80, weighted_score: 8, weight: 10 },
      education_certifications: { raw_score: 70, weighted_score: 3.5, weight: 5 },
    },
  },
  {
    rank: 5,
    process_candidate_id: 'dm-05',
    candidate_id: 'c-05',
    name: 'Sofía Martínez',
    email: 'sofia.martinez@mail.com',
    phone: null,
    status: 'MATCHED',
    match_percentage: 72,
    match_category: 'MEDIUM',
    normalized_cv_url: '/documents/cv-05.pdf',
    city: 'Barranquilla',
    match_summary:
      'Desarrolladora con experiencia integrando pasarelas de pago desde el lado del consumidor de APIs.',
    strengths: ['Integraciones con pasarelas de pago', 'Inglés avanzado'],
    gaps: ['Experiencia mayormente en empresas pequeñas', 'Sin Celery en producción'],
    breakdown: {
      technical_skills: { raw_score: 70, weighted_score: 21, weight: 30 },
      relevant_experience: { raw_score: 72, weighted_score: 18, weight: 25 },
      seniority: { raw_score: 65, weighted_score: 9.8, weight: 15 },
      industry_domain: { raw_score: 70, weighted_score: 10.5, weight: 15 },
      languages: { raw_score: 95, weighted_score: 9.5, weight: 10 },
      education_certifications: { raw_score: 65, weighted_score: 3.3, weight: 5 },
    },
  },
  {
    rank: 6,
    process_candidate_id: 'dm-08',
    candidate_id: 'c-08',
    name: 'Daniel Castaño',
    email: 'daniel.castano@mail.com',
    phone: '+57 308 555 1208',
    status: 'MATCHED',
    match_percentage: 38,
    match_category: 'LOW',
    normalized_cv_url: '/documents/cv-08.pdf',
    city: 'Bogotá',
    match_summary: 'Perfil principalmente frontend con conocimientos básicos de backend.',
    strengths: ['Buena comunicación y documentación'],
    gaps: ['Stack principal en JavaScript, no Python', 'Sin experiencia en pagos ni mensajería'],
    breakdown: {
      technical_skills: { raw_score: 35, weighted_score: 10.5, weight: 30 },
      relevant_experience: { raw_score: 40, weighted_score: 10, weight: 25 },
      seniority: { raw_score: 55, weighted_score: 8.3, weight: 15 },
      industry_domain: { raw_score: 30, weighted_score: 4.5, weight: 15 },
      languages: { raw_score: 70, weighted_score: 7, weight: 10 },
      education_certifications: { raw_score: 60, weighted_score: 3, weight: 5 },
    },
  },
]

// ===== Métricas / Costos =====

export const metricsDashboard: MetricsDashboard = {
  total_cost_usd: 1284.37,
  cost_by_process: [
    { process_id: 'hp-001', process_name: 'Backend Squad Pagos', total_cost: 342.18, candidate_count: 48 },
    { process_id: 'hp-003', process_name: 'Data Platform', total_cost: 289.4, candidate_count: 37 },
    { process_id: 'hp-007', process_name: 'SRE Plataforma', total_cost: 231.75, candidate_count: 29 },
    { process_id: 'hp-002', process_name: 'Diseño Producto Core', total_cost: 174.5, candidate_count: 26 },
    { process_id: 'hp-008', process_name: 'Ventas Enterprise', total_cost: 128.94, candidate_count: 21 },
    { process_id: 'hp-004', process_name: 'Frontend Web App', total_cost: 117.6, candidate_count: 19 },
  ],
  cost_by_user: [
    { user_id: 'u-01', user_name: 'Ana María Duque', total_cost: 512.4 },
    { user_id: 'u-02', user_name: 'Carlos Mejía', total_cost: 421.87 },
    { user_id: 'u-03', user_name: 'Paula Zapata', total_cost: 350.1 },
  ],
  cost_by_operation: [
    { operation_type: 'CV_PARSING', total_cost: 412.5, count: 180 },
    { operation_type: 'CV_MATCHING', total_cost: 386.2, count: 154 },
    { operation_type: 'PROFILING_CALL', total_cost: 331.47, count: 62 },
    { operation_type: 'JD_ANALYSIS', total_cost: 98.6, count: 41 },
    { operation_type: 'PROFILING_EVAL', total_cost: 55.6, count: 58 },
  ],
  daily_costs: [
    { date: '2026-06-25', cost: 42.1 },
    { date: '2026-06-26', cost: 58.3 },
    { date: '2026-06-27', cost: 35.7 },
    { date: '2026-06-28', cost: 71.2 },
    { date: '2026-06-29', cost: 66.8 },
    { date: '2026-06-30', cost: 94.5 },
    { date: '2026-07-01', cost: 112.4 },
    { date: '2026-07-02', cost: 88.9 },
    { date: '2026-07-03', cost: 105.3 },
    { date: '2026-07-04', cost: 76.4 },
    { date: '2026-07-05', cost: 61.2 },
    { date: '2026-07-06', cost: 132.6 },
    { date: '2026-07-07', cost: 148.9 },
    { date: '2026-07-08', cost: 190.07 },
  ],
}

// ===== Profiling =====

export const profilingRuns: BackendProfilingRunItem[] = [
  {
    id: 'pr-01',
    candidate_name: 'Laura Gómez',
    status: 'COMPLETED',
    call_attempts: 1,
    advancement_probability: 'HIGH',
    started_at: '2026-07-08T14:02:00Z',
    completed_at: '2026-07-08T14:18:00Z',
  },
  {
    id: 'pr-02',
    candidate_name: 'Andrés Restrepo',
    status: 'CALLING',
    call_attempts: 1,
    advancement_probability: null,
    started_at: '2026-07-09T10:05:00Z',
    completed_at: null,
  },
  {
    id: 'pr-03',
    candidate_name: 'Camila Torres',
    status: 'CALLING',
    call_attempts: 2,
    advancement_probability: null,
    started_at: '2026-07-09T10:12:00Z',
    completed_at: null,
  },
  {
    id: 'pr-04',
    candidate_name: 'Julián Pérez',
    status: 'PENDING',
    call_attempts: 0,
    advancement_probability: null,
    started_at: null,
    completed_at: null,
  },
  {
    id: 'pr-05',
    candidate_name: 'Sofía Martínez',
    status: 'NO_ANSWER',
    call_attempts: 3,
    advancement_probability: null,
    started_at: '2026-07-08T16:40:00Z',
    completed_at: null,
  },
  {
    id: 'pr-06',
    candidate_name: 'Mateo López',
    status: 'FAILED',
    call_attempts: 2,
    advancement_probability: null,
    started_at: '2026-07-08T15:20:00Z',
    completed_at: '2026-07-08T15:22:00Z',
  },
  {
    id: 'pr-07',
    candidate_name: 'Valentina Ríos',
    status: 'COMPLETED',
    call_attempts: 2,
    advancement_probability: 'MEDIUM',
    started_at: '2026-07-08T11:00:00Z',
    completed_at: '2026-07-08T11:14:00Z',
  },
  {
    id: 'pr-08',
    candidate_name: 'Daniel Castaño',
    status: 'COMPLETED',
    call_attempts: 1,
    advancement_probability: 'LOW',
    started_at: '2026-07-07T09:30:00Z',
    completed_at: '2026-07-07T09:41:00Z',
  },
]

export const MAX_CONCURRENT_CALLS = 3

// ===== Question Sets =====

export const questionSets: QuestionSet[] = [
  {
    id: 'qs-01',
    name: 'Screening Backend Senior',
    description:
      'Set estándar para validar experiencia backend, disponibilidad y expectativa salarial en perfiles senior.',
    version: 3,
    status: 'ACTIVE',
    created_at: '2026-05-12T09:00:00Z',
    updated_at: '2026-07-01T14:30:00Z',
  },
  {
    id: 'qs-02',
    name: 'Profiling Comercial LATAM',
    description: 'Preguntas de descubrimiento para roles de ventas enterprise en la región.',
    version: 1,
    status: 'ACTIVE',
    created_at: '2026-06-02T11:20:00Z',
    updated_at: '2026-06-02T11:20:00Z',
  },
  {
    id: 'qs-03',
    name: 'Screening General v2',
    description: 'Borrador de la nueva versión del screening genérico para todos los procesos.',
    version: 2,
    status: 'DRAFT',
    created_at: '2026-07-04T08:15:00Z',
    updated_at: '2026-07-08T10:00:00Z',
  },
  {
    id: 'qs-04',
    name: 'Cultura y Valores 2025',
    description: 'Set retirado tras la actualización del manifiesto cultural.',
    version: 4,
    status: 'ARCHIVED',
    created_at: '2025-11-10T10:00:00Z',
    updated_at: '2026-04-20T16:45:00Z',
  },
]

export const questionSetQuestions: Record<string, ProfilingQuestion[]> = {
  'qs-01': [
    {
      order_index: 0,
      text: '¿Cuántos años de experiencia tienes trabajando con Python en producción?',
      type: 'NUMERIC',
      expected_answer: '5',
      positive_keywords: [],
      risk_keywords: [],
      weight: 20,
      is_critical: true,
      eval_criteria: 'Mínimo 5 años para considerarse senior.',
    },
    {
      order_index: 1,
      text: 'Cuéntame sobre el sistema más complejo que hayas diseñado o mantenido.',
      type: 'OPEN',
      positive_keywords: ['microservicios', 'escalabilidad', 'eventos', 'pagos'],
      risk_keywords: ['solo mantenimiento', 'sin diseño'],
      weight: 30,
      is_critical: false,
      eval_criteria: 'Buscar profundidad técnica y ownership.',
    },
    {
      order_index: 2,
      text: '¿Tienes disponibilidad para incorporarte en menos de 30 días?',
      type: 'YES_NO',
      expected_answer: 'Sí',
      positive_keywords: [],
      risk_keywords: [],
      weight: 15,
      is_critical: true,
    },
    {
      order_index: 3,
      text: 'Del 1 al 10, ¿qué tan cómodo te sientes liderando técnicamente a otros desarrolladores?',
      type: 'SCALE',
      positive_keywords: [],
      risk_keywords: [],
      weight: 15,
      is_critical: false,
    },
    {
      order_index: 4,
      text: '¿Cuál es tu expectativa salarial mensual en USD?',
      type: 'NUMERIC',
      expected_answer: '4500',
      positive_keywords: [],
      risk_keywords: [],
      weight: 20,
      is_critical: true,
      eval_criteria: 'Debe estar dentro del presupuesto máximo del proceso.',
    },
  ],
  'qs-02': [
    {
      order_index: 0,
      text: 'Describe tu proceso para cerrar una cuenta enterprise desde el primer contacto.',
      type: 'OPEN',
      positive_keywords: ['descubrimiento', 'stakeholders', 'negociación'],
      risk_keywords: ['sin proceso', 'improvisación'],
      weight: 40,
      is_critical: true,
    },
    {
      order_index: 1,
      text: '¿Has manejado cuotas anuales superiores a 500.000 USD?',
      type: 'YES_NO',
      expected_answer: 'Sí',
      positive_keywords: [],
      risk_keywords: [],
      weight: 30,
      is_critical: false,
    },
    {
      order_index: 2,
      text: '¿Qué CRM has usado principalmente?',
      type: 'MULTIPLE_CHOICE',
      positive_keywords: ['Salesforce', 'HubSpot'],
      risk_keywords: ['ninguno'],
      weight: 30,
      is_critical: false,
    },
  ],
  'qs-03': [
    {
      order_index: 0,
      text: '¿Por qué te interesa esta posición?',
      type: 'OPEN',
      positive_keywords: ['crecimiento', 'reto', 'producto'],
      risk_keywords: ['solo salario'],
      weight: 50,
      is_critical: false,
    },
    {
      order_index: 1,
      text: '¿Actualmente estás participando en otros procesos de selección?',
      type: 'CLOSED',
      expected_answer: 'No',
      positive_keywords: [],
      risk_keywords: [],
      weight: 50,
      is_critical: false,
    },
  ],
  'qs-04': [
    {
      order_index: 0,
      text: '¿Qué valor de la empresa resuena más contigo y por qué?',
      type: 'OPEN',
      positive_keywords: ['colaboración', 'transparencia'],
      risk_keywords: [],
      weight: 100,
      is_critical: false,
    },
  ],
}

export function getQuestionSetById(id: string): QuestionSet | undefined {
  return questionSets.find((q) => q.id === id)
}

// ===== Settings =====

export const users: User[] = [
  { id: 'u-01', name: 'Ana María', last_name: 'Duque', email: 'ana.duque@riwi.io', role: 'ADMIN', status: 'ACTIVE' },
  { id: 'u-02', name: 'Carlos', last_name: 'Mejía', email: 'carlos.mejia@riwi.io', role: 'RECRUITER', status: 'ACTIVE' },
  { id: 'u-03', name: 'Paula', last_name: 'Zapata', email: 'paula.zapata@riwi.io', role: 'TA_LEADER', status: 'ACTIVE' },
  { id: 'u-04', name: 'Jorge', last_name: 'Alzate', email: 'jorge.alzate@riwi.io', role: 'RECRUITER', status: 'SUSPENDED' },
  { id: 'u-05', name: 'Lucía', last_name: 'Franco', email: 'lucia.franco@riwi.io', role: 'RECRUITER', status: 'ACTIVE' },
]

export const aiModelConfigs: AIModelConfig[] = [
  { id: 'mc-01', task_type: 'CV_PARSING', provider: 'OPENAI', model_name: 'gpt-5-mini', is_active: true },
  { id: 'mc-02', task_type: 'CV_MATCHING', provider: 'ANTHROPIC', model_name: 'claude-sonnet-4-5', is_active: true },
  { id: 'mc-03', task_type: 'JD_ANALYSIS', provider: 'OPENAI', model_name: 'gpt-5', is_active: true },
  { id: 'mc-04', task_type: 'PROFILING_VOICE', provider: 'ELEVENLABS', model_name: 'eleven-conversational-v3', is_active: true },
  { id: 'mc-05', task_type: 'PROFILING_EVAL', provider: 'ANTHROPIC', model_name: 'claude-haiku-4-5', is_active: false },
]

export const aiPrompts: AIPrompt[] = [
  {
    id: 'pp-01',
    task_type: 'CV_MATCHING',
    version_name: 'match-v4.2-es',
    system_prompt_text: 'Eres un evaluador experto de CVs. Analiza el CV contra la JD y devuelve un desglose ponderado...',
    is_active: true,
  },
  {
    id: 'pp-02',
    task_type: 'CV_MATCHING',
    version_name: 'match-v4.1-es',
    system_prompt_text: 'Versión anterior del prompt de matching...',
    is_active: false,
  },
  {
    id: 'pp-03',
    task_type: 'PROFILING_EVAL',
    version_name: 'profiling-eval-v2',
    system_prompt_text: 'Evalúa la transcripción de la llamada contra las preguntas del set y estima probabilidad de avance...',
    is_active: true,
  },
  {
    id: 'pp-04',
    task_type: 'JD_ANALYSIS',
    version_name: 'jd-extract-v3',
    system_prompt_text: 'Extrae requisitos, seniority y habilidades clave de la Job Description...',
    is_active: true,
  },
]

// ===== Utilidades de formato =====

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatUsd(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
