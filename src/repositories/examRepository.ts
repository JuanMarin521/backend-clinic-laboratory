import type { ExamRecord } from '../types/exam.types';

/**
 * "Base de datos" en memoria de examenes de laboratorio.
 * En el MVP, todos los usuarios autenticados ven el mismo conjunto de examenes de demostracion
 * (en un sistema real cada examen estaria asociado a un `patientId`).
 */
const exams: ExamRecord[] = [
  { id: '1', name: 'Hemograma completo', takenDate: '19 sep', site: 'Laureles', status: 'ready' },
  { id: '2', name: 'Perfil lipídico', takenDate: '19 sep', site: 'Laureles', status: 'ready' },
  { id: '3', name: 'Glisemia basal', takenDate: '19 sep', site: 'Laureles', status: 'issue' },
  { id: '4', name: 'Perfil Metabólico', takenDate: '13 sep', site: 'Laureles', status: 'processing' },
];

/** Devuelve la lista completa de examenes disponibles. */
export function findAllExams(): ExamRecord[] {
  return exams;
}

/** Busca un examen por su identificador. Devuelve `undefined` si no existe. */
export function findExamById(examId: string): ExamRecord | undefined {
  return exams.find((exam) => exam.id === examId);
}
