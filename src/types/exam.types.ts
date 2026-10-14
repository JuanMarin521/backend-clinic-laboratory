/** Estados posibles de un examen (mismo semaforo que usa la app movil). */
export type ExamStatus = 'ready' | 'processing' | 'issue';

/** Representa un examen de laboratorio. */
export interface ExamRecord {
  id: string;
  name: string;
  /** Fecha corta de toma de muestra, ej. "19 sep". */
  takenDate: string;
  site: string;
  status: ExamStatus;
}

/** Respuesta simulada de descarga de PDF (no hay almacenamiento real de archivos en este MVP). */
export interface ExamPdfResponse {
  examId: string;
  fileName: string;
  downloadUrl: string;
  generatedAt: string;
}
