import type { ExamRecord } from './exam.types';

/**
 * Una orden agrupa los examenes que un paciente se tomo en una misma visita al laboratorio.
 * Regla de negocio: un paciente solo puede tener UNA orden por dia.
 */
export interface OrderRecord {
  id: string;
  /** Numero de orden de 6 digitos, ej. "546237". Se muestra como "#546237". */
  orderNumber: string;
  /** Fecha de la visita, formato ISO "YYYY-MM-DD". */
  date: string;
  /** Sede del laboratorio donde se tomaron las muestras. */
  site: string;
}

/** Cuantos examenes hay en cada estado (para las tarjetas "semaforo" del Home). */
export interface ExamSummary {
  ready: number;
  processing: number;
  issue: number;
}

/** Orden con sus examenes y el resumen por estado, tal como la recibe la app. */
export interface OrderWithExams extends OrderRecord {
  summary: ExamSummary;
  exams: ExamRecord[];
}
