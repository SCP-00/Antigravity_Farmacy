import { z } from 'zod'

export const crearProductoSchema = z.object({
  registroInvima:    z.string().min(5, 'Registro INVIMA inválido'),
  cum:               z.string().min(3, 'CUM requerido'),
  nombre:            z.string().min(2),
  principioActivo:   z.string().min(2, 'Principio activo requerido'),
  atc:               z.string().optional().nullable(),
  titular:           z.string().optional().nullable(),
  formaFarmaceutica: z.string().optional().nullable(),
  viaAdministracion: z.string().optional().nullable(),
  presentacion:      z.string().optional().nullable(),
  concentracion:     z.string().optional().nullable(),
  laboratorio:       z.string().optional().nullable(),
  descripcion:       z.string().optional().nullable(),
  requiereRx:        z.boolean().default(false),
  categoriaId:       z.number().int().positive(),
  precioVenta:       z.number().positive('El precio debe ser mayor a 0'),
  stockMinimo:       z.number().int().min(0).default(10),
  estadoCum:         z.string().default('Activo'),
  esMuestraMedica:   z.boolean().default(false),
  alergenos:         z.string().optional().nullable(),
  advertencias:      z.string().optional().nullable(),
})

export const actualizarProductoSchema = crearProductoSchema.partial()