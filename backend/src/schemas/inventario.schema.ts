import { z } from 'zod'

export const crearLoteSchema = z.object({
  codigoLote:       z.string().min(3),
  productoId:       z.string().uuid(),
  sucursalId:       z.number().int().positive(),
  proveedorId:      z.string().uuid().optional(),
  ordenCompraId:    z.string().uuid().optional(),
  fechaFabricacion: z.string().optional(),
  fechaVencimiento: z.string().min(1, 'Fecha de vencimiento requerida'),
  cantidadInicial:  z.number().int().positive(),
  precioCompra:     z.number().positive(),
})

export const ajusteInventarioSchema = z.object({
  loteId:      z.string().uuid(),
  tipo:        z.enum(['AJUSTE_POSITIVO','AJUSTE_NEGATIVO']),
  cantidad:    z.number().int().positive(),
  motivo:      z.enum(['PERDIDA','DANO','VENCIMIENTO','ERROR_DIGITACION','INVENTARIO_FISICO','OTRO']),
  descripcion: z.string().optional(),
})
