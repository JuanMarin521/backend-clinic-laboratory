/**
 * Utilidades de fechas. Las fechas de las ordenes se guardan como texto ISO "YYYY-MM-DD"
 * (sin hora), para poder ordenarlas directamente en SQL y no tener problemas de zona horaria.
 */

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Fecha de hoy (segun la hora local del servidor) en formato "YYYY-MM-DD". */
export function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Convierte "2026-09-19" en "19 de septiembre de 2026". */
export function formatLongDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return `${day} de ${MONTHS_ES[month - 1]} de ${year}`;
}
