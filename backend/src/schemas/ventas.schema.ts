import { z } from 'zod'

export const itemVentaSchema = z.object({
  productoId:    z.string().uuid(),
  cantidad:      z.number().int().positive(),
  precioUnitario:z.number().positive(),
  descuento:     z.number().min(0).default(0),
})

export const registrarVentaSchema = z.object({
  sucursalId: z.number().int().positive(),
  cajaId:     z.string().uuid().optional(),
  clienteId:  z.string().uuid().optional(),
  metodoPago: z.enum(['EFECTIVO','WOMPI','STRIPE','MERCADOPAGO','TRANSFERENCIA']),
  descuento:  z.number().min(0).default(0),
  items:      z.array(itemVentaSchema).min(1, 'Agrega al menos un producto'),
})
