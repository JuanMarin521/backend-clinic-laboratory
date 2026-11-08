import type { Request, Response } from 'express';

import { UnauthorizedError } from '../exceptions';
import { generateOrderPdfFile, getLatestOrder, listOrders } from '../services/orderService';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * GET /api/v1/orders
 * Todas las ordenes del paciente autenticado, de la mas reciente a la mas antigua,
 * cada una con sus examenes y su resumen por estado.
 */
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  res.status(200).json({ success: true, data: listOrders(req.user.id) });
});

/**
 * GET /api/v1/orders/latest
 * Solo la orden mas reciente (ultima visita al laboratorio). `data` es `null`
 * si el paciente todavia no tiene ordenes.
 */
export const getLatestOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  res.status(200).json({ success: true, data: getLatestOrder(req.user.id) });
});

/**
 * GET /api/v1/orders/:orderNumber/pdf/file
 * Un solo PDF con todos los examenes validados de la orden (bytes, no JSON).
 * 404 si la orden no es del paciente; 409 si aun no tiene examenes validados.
 */
export const downloadOrderPdf = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const { orderNumber } = req.params as { orderNumber: string };
  const { fileName, bytes } = await generateOrderPdfFile(orderNumber, req.user.id);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.status(200).send(Buffer.from(bytes));
});
