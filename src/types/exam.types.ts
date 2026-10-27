/** Estados posibles de un examen (mismo semaforo que usa la app movil). */
export type ExamStatus = 'ready' | 'processing' | 'issue';

/** Representa un examen de laboratorio. */
export interface ExamRecord {
  id: string;
  /** Id interno de la orden a la que pertenece el examen. */
  orderId: string;
  /** Numero de orden de 6 digitos, ej. "546237". */
  orderNumber: string;
  name: string;
  /** Fecha de toma de muestra (la fecha de su orden), formato ISO "YYYY-MM-DD". */
  takenDate: string;
  /** Sede donde se tomo la muestra (la sede de su orden). */
  site: string;
  status: ExamStatus;
}

/** Datos para crear un examen dentro de una orden (la fecha y la sede las pone la orden). */
export interface NewExam {
  name: string;
  status: ExamStatus;
}

/** Respuesta simulada de descarga de PDF (no hay almacenamiento real de archivos en este MVP). */
export interface ExamPdfResponse {
  examId: string;
  fileName: string;
  downloadUrl: string;
  generatedAt: string;
}
