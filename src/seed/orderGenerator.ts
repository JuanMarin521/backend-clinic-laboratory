import type { ExamStatus, NewExam } from '../types/exam.types';
import { todayIsoDate } from '../utils/dates';
import { EXAM_CATALOG, LAB_SITES, type CatalogExam } from './examCatalog';

/** Datos de una orden lista para guardarse (aun sin numero: ese lo asigna el repositorio). */
export interface GeneratedOrder {
  date: string;
  site: string;
  exams: NewExam[];
}

/**
 * Generador de numeros pseudoaleatorios con semilla fija (algoritmo "mulberry32").
 * Con la misma semilla siempre salen los mismos datos, asi todo el equipo ve las
 * mismas ordenes y examenes en su base de datos local (solo cambia el numero de orden inicial).
 */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Entero aleatorio entre `min` y `max` (ambos incluidos). */
function randomInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

/** Suma (o resta, si `days` es negativo) dias a una fecha ISO "YYYY-MM-DD". */
function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Escoge `count` examenes distintos del catalogo. Los de mayor `weight` tienen mas
 * probabilidad de salir. Se descartan los que no aplican al sexo del paciente.
 */
function pickExams(random: () => number, count: number, sex?: 'F' | 'M'): CatalogExam[] {
  const pool = EXAM_CATALOG.filter((exam) => !exam.sex || exam.sex === sex);
  const picked: CatalogExam[] = [];

  while (picked.length < count && pool.length > 0) {
    const totalWeight = pool.reduce((sum, exam) => sum + exam.weight, 0);
    let target = random() * totalWeight;
    const index = pool.findIndex((exam) => (target -= exam.weight) < 0);
    picked.push(...pool.splice(index === -1 ? pool.length - 1 : index, 1));
  }

  return picked;
}

/**
 * Estado de cada examen segun que tan reciente es la orden:
 * - la orden mas reciente (ultima visita) tiene de todo: listos, en proceso y con novedad;
 * - las ordenes anteriores ya estan casi todas listas (alguna con novedad).
 */
function pickStatus(random: () => number, isLatestOrder: boolean): ExamStatus {
  const roll = random();
  if (isLatestOrder) return roll < 0.5 ? 'ready' : roll < 0.85 ? 'processing' : 'issue';
  return roll < 0.92 ? 'ready' : 'issue';
}

/** Ultima fecha posible de una orden de prueba (todas quedan en el pasado). */
const LATEST_SEED_DATE = '2026-10-24';

/**
 * Genera las ordenes de prueba de un paciente:
 * - entre 5 y 8 ordenes (visitas al laboratorio), en fechas distintas;
 * - cada orden con entre 8 y 13 examenes distintos;
 * - la mayoria en la sede habitual del paciente.
 * Se devuelven de la mas antigua a la mas reciente.
 */
export function generateOrdersForPatient(
  patientIndex: number,
  patient: { sex: 'F' | 'M'; usualSite: string },
): GeneratedOrder[] {
  const random = createRandom(2026 + patientIndex * 7919);
  const orderCount = randomInt(random, 5, 8);

  // Fechas: la ultima visita fue en las ultimas semanas; las anteriores, cada 3 a 10 semanas.
  const dates: string[] = [addDays(LATEST_SEED_DATE, -randomInt(random, 0, 18))];
  while (dates.length < orderCount) {
    dates.unshift(addDays(dates[0], -randomInt(random, 20, 75)));
  }

  return dates.map((date, index) => {
    const isLatestOrder = index === dates.length - 1;
    const site = random() < 0.75 ? patient.usualSite : LAB_SITES[randomInt(random, 0, LAB_SITES.length - 1)];
    const exams = pickExams(random, randomInt(random, 8, 13), patient.sex).map((exam) => ({
      name: exam.name,
      status: pickStatus(random, isLatestOrder),
    }));

    // La orden mas reciente siempre tiene al menos un examen en proceso (se acaba de tomar).
    if (isLatestOrder && !exams.some((exam) => exam.status === 'processing')) {
      exams[0].status = 'processing';
    }

    return { date, site, exams };
  });
}

/**
 * Orden inicial de un paciente recien registrado: fecha de hoy, 8 examenes comunes
 * en proceso. No se incluyen examenes especificos por sexo porque al registrarse no se pide.
 */
export function buildStarterOrder(): GeneratedOrder {
  const random = createRandom(Date.now());
  return {
    date: todayIsoDate(),
    site: LAB_SITES[0],
    exams: pickExams(random, 8).map((exam) => ({ name: exam.name, status: 'processing' as const })),
  };
}
