import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

import { formatLongDate } from '../../utils/dates';

/** Datos que se imprimen en un PDF de resultados (de un examen o de una orden completa). */
export interface ResultsPdfData {
  patientName: string;
  orderNumber: string;
  /** Fecha de la orden, formato "YYYY-MM-DD". */
  orderDate: string;
  site: string;
  /** Examenes validados que se incluyen en el documento. */
  validatedExams: string[];
  /** Cuantos examenes de la orden quedaron por fuera porque aun no estan validados. */
  pendingCount: number;
}

const PAGE_SIZE: [number, number] = [595, 842]; // A4 en puntos
const MARGIN_X = 50;
const TOP_Y = 780;
const BOTTOM_Y = 70;
const TEXT_COLOR = rgb(0.1, 0.1, 0.1);
const MUTED_COLOR = rgb(0.4, 0.4, 0.4);
const LINE_COLOR = rgb(0.82, 0.82, 0.82);
const VALIDATED_COLOR = rgb(0.06, 0.55, 0.32);

/**
 * Escritor de lineas con salto de pagina automatico: si la siguiente linea no cabe,
 * agrega una pagina nueva. Asi una orden con muchos examenes nunca se corta.
 */
class PageWriter {
  private page: PDFPage;
  private cursorY = TOP_Y;

  constructor(
    private readonly document: PDFDocument,
    private readonly fonts: { regular: PDFFont; bold: PDFFont },
  ) {
    this.page = document.addPage(PAGE_SIZE);
  }

  private ensureSpace(height: number): void {
    if (this.cursorY - height < BOTTOM_Y) {
      this.page = this.document.addPage(PAGE_SIZE);
      this.cursorY = TOP_Y;
    }
  }

  text(value: string, { size = 11, bold = false, gap = 20, color = TEXT_COLOR } = {}): void {
    this.ensureSpace(gap);
    this.page.drawText(value, { x: MARGIN_X, y: this.cursorY, size, font: bold ? this.fonts.bold : this.fonts.regular, color });
    this.cursorY -= gap;
  }

  /** Fila de la tabla: nombre del examen a la izquierda y su estado a la derecha. */
  row(name: string, status: string): void {
    this.ensureSpace(22);
    const font = this.fonts.regular;
    this.page.drawText(name, { x: MARGIN_X, y: this.cursorY, size: 11, font, color: TEXT_COLOR });
    const statusWidth = this.fonts.bold.widthOfTextAtSize(status, 10);
    this.page.drawText(status, {
      x: PAGE_SIZE[0] - MARGIN_X - statusWidth,
      y: this.cursorY,
      size: 10,
      font: this.fonts.bold,
      color: VALIDATED_COLOR,
    });
    this.cursorY -= 22;
  }

  divider(gapAfter = 20): void {
    this.ensureSpace(gapAfter);
    this.page.drawLine({
      start: { x: MARGIN_X, y: this.cursorY + 8 },
      end: { x: PAGE_SIZE[0] - MARGIN_X, y: this.cursorY + 8 },
      thickness: 1,
      color: LINE_COLOR,
    });
    this.cursorY -= gapAfter;
  }
}

/**
 * Genera el PDF de resultados (en memoria, con `pdf-lib`): encabezado con los datos del
 * paciente y la orden, la lista de examenes validados y, si aplica, un aviso de cuantos
 * examenes de la orden aun no estan validados (y por eso no se incluyen).
 */
export async function buildResultsPdf(data: ResultsPdfData): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  document.setTitle(`Resultados - Orden #${data.orderNumber}`);
  document.setProducer('CPO Conecta');

  const writer = new PageWriter(document, {
    regular: await document.embedFont(StandardFonts.Helvetica),
    bold: await document.embedFont(StandardFonts.HelveticaBold),
  });

  writer.text('CPO Conecta', { size: 22, bold: true, gap: 26 });
  writer.text('Resultados de laboratorio', { size: 12, color: MUTED_COLOR, gap: 30 });
  writer.divider(26);

  writer.text(`Paciente: ${data.patientName}`, { size: 11 });
  writer.text(`Orden: #${data.orderNumber}`, { size: 11 });
  writer.text(`Fecha de toma de muestra: ${formatLongDate(data.orderDate)}`, { size: 11 });
  writer.text(`Sede: ${data.site}`, { size: 11, gap: 30 });

  writer.text(`EXÁMENES VALIDADOS (${data.validatedExams.length})`, { size: 10, bold: true, color: MUTED_COLOR, gap: 20 });
  writer.divider(18);
  data.validatedExams.forEach((name) => writer.row(name, 'Validado'));
  writer.divider(24);

  if (data.pendingCount > 0) {
    const plural = data.pendingCount === 1 ? 'examen pendiente' : 'exámenes pendientes';
    writer.text(`Esta orden tiene ${data.pendingCount} ${plural} de validación que no se incluyen`, { size: 10, gap: 14 });
    writer.text('en este documento. Podrás descargarlos cuando estén listos.', { size: 10, gap: 28 });
  }

  writer.text('Este documento es una demostración generada automáticamente', { size: 9, color: MUTED_COLOR, gap: 13 });
  writer.text('por CPO Conecta y no sustituye un resultado médico oficial.', { size: 9, color: MUTED_COLOR, gap: 13 });

  return document.save();
}
