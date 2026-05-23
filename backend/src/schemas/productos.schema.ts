import { z } from 'zod'

export const crearProductoSchema = z.object({
  registroInvima: z.string().min(5, 'Registro INVIMA inválido'),
  nombre:         z.string().min(2),
  presentacion:   z.string().optional(),
  concentracion:  z.string().optional(),
  laboratorio:    z.string().optional(),
  descripcion:    z.string().optional(),
  requiereRx:     z.boolean().default(false),
  categoriaId:    z.number().int().positive(),
  precioVenta:    z.number().positive('El precio debe ser mayor a 0'),
  stockMinimo:    z.number().int().min(0).default(10),
})

export const actualizarProductoSchema = crearProductoSchema.partial()
