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

// ── Proveedores ────────────────────────────────────────────
export const crearProveedorSchema = z.object({
  nombre:    z.string().min(2, 'Nombre requerido').max(200),
  nit:       z.string().min(3, 'NIT requerido').max(50),
  contacto:  z.string().max(200).optional().nullable(),
  telefono:  z.string().max(50).optional().nullable(),
  email:     z.string().email().optional().nullable().or(z.literal('')),
  direccion: z.string().max(300).optional().nullable(),
  activo:    z.boolean().optional(),
})

export const actualizarProveedorSchema = crearProveedorSchema.partial()

// ── Sucursales ─────────────────────────────────────────────
export const crearSucursalSchema = z.object({
  nombre:    z.string().min(2, 'Nombre requerido').max(200),
  direccion: z.string().max(300).optional().nullable(),
  telefono:  z.string().max(50).optional().nullable(),
  activa:    z.boolean().optional(),
})

export const actualizarSucursalSchema = crearSucursalSchema.partial()
