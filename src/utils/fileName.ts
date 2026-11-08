/**
 * Convierte el nombre de un examen en un nombre de archivo PDF seguro para cualquier
 * sistema operativo y para la cabecera Content-Disposition:
 * - quita tildes ("Ácido úrico" -> "Acido urico");
 * - reemplaza todo lo que no sea letra, numero o guion por "_" (incluida la "/" de
 *   "VDRL / RPR", que en el celular se interpretaba como una carpeta);
 * - evita "_" repetidos o al inicio/final.
 */
export function toPdfFileName(examName: string): string {
  const base = examName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${base || 'examen'}.pdf`;
}
