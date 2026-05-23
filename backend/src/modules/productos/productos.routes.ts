// ══════════════════════════════════════════════════════════
//  MÓDULO PRODUCTOS
//  GET  /api/v1/productos/buscar        (público — tienda web)
//  GET  /api/v1/productos               (empleados)
//  GET  /api/v1/productos/:id
//  POST /api/v1/productos               (ADMIN + AUXILIAR)
//  PATCH /api/v1/productos/:id          (ADMIN + AUXILIAR)
//  DELETE /api/v1/productos/:id         (solo ADMIN)
// ══════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/database'
import { cache } from '../../config/redis'
import { responder, parsePaginacion } from '../../utils/respuesta.utils'
import { autenticar, autorizar, validarCuerpo, validarQuery } from '../../middlewares/index'

export const productosRouter: Router = Router()

// ── Schemas ───────────────────────────────────────────────
const buscarSchema = z.object({
  q:          z.string().optional().default(''),
  categoria:  z.string().optional(),
  rx:         z.enum(['true','false']).optional(),
  ordenar:    z.enum(['nombre','precio_asc','precio_desc','stock']).optional().default('nombre'),
  pagina:     z.string().optional().default('1'),
  limite:     z.string().optional().default('20'),
})

const crearSchema = z.object({
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

const actualizarSchema = crearSchema.partial()

// ══════════════════════════════════════════════════════════
//  GET /buscar — Búsqueda pública (tienda web)
//  Soporta: texto libre, categoría, requiereRx, ordenamiento
// ══════════════════════════════════════════════════════════
productosRouter.get('/buscar', validarQuery(buscarSchema), async (req: Request, res: Response) => {
  const { q, categoria, rx, ordenar, pagina, limite } = req.query as any
  const { skip, limite: lim, pagina: pag } = parsePaginacion(req.query as any)

  // Cache key basada en los parámetros de búsqueda
  const cacheKey = `productos:buscar:${JSON.stringify(req.query)}`
  const cached = await cache.get(cacheKey)
  if (cached) return responder.lista(res, (cached as any).data, (cached as any).meta)

  try {
    const where: any = {
      activo: true,
      // Solo muestra productos con stock disponible
      lotes: {
        some: {
          cantidadActual: { gt: 0 },
          fechaVencimiento: { gt: new Date() },
        },
      },
    }

    if (q && q.trim().length > 0) {
      where.OR = [
        { nombre:       { contains: q, mode: 'insensitive' } },
        { laboratorio:  { contains: q, mode: 'insensitive' } },
        { concentracion:{ contains: q, mode: 'insensitive' } },
        { descripcion:  { contains: q, mode: 'insensitive' } },
      ]
    }

    if (categoria) where.categoria = { slug: categoria }
    if (rx !== undefined) where.requiereRx = rx === 'true'

    const orderMap: Record<string, any> = {
      nombre:      { nombre: 'asc' },
      precio_asc:  { precioVenta: 'asc' },
      precio_desc: { precioVenta: 'desc' },
      stock:       { lotes: { _count: 'desc' } },
    }

    const [total, productos] = await Promise.all([
      prisma.producto.count({ where }),
      prisma.producto.findMany({
        where,
        skip,
        take: lim,
        orderBy: orderMap[ordenar] ?? { nombre: 'asc' },
        select: {
          id: true, nombre: true, slug: true, presentacion: true,
          concentracion: true, laboratorio: true, requiereRx: true,
          precioVenta: true, imagenUrl: true,
          categoria: { select: { nombre: true, slug: true, icono: true } },
          lotes: {
            where: { cantidadActual: { gt: 0 }, fechaVencimiento: { gt: new Date() } },
            select: { cantidadActual: true },
          },
        },
      }),
    ])

    // Calcula stock total por producto
    const resultado = productos.map((p: any) => ({
      ...p,
      stockTotal: p.lotes.reduce((s: number, l: any) => s + l.cantidadActual, 0),
      lotes: undefined,
    }))

    const meta = {
      pagina: pag,
      limite: lim,
      total,
      totalPaginas: Math.ceil(total / lim),
    }

    // Cachea por 5 minutos
    await cache.set(cacheKey, { data: resultado, meta }, 300)

    return responder.lista(res, resultado, meta)
  } catch (err) {
    return responder.serverError(res, err)
  }
})

// ══════════════════════════════════════════════════════════
//  GET / — Listado completo para empleados (con stock y lotes)
// ══════════════════════════════════════════════════════════
productosRouter.get(
  '/',
  autenticar,
  async (req: Request, res: Response) => {
    const { skip, limite, pagina } = parsePaginacion(req.query as any)
    const { q, categoriaId, activo } = req.query as any

    const where: any = {}
    if (q) where.OR = [
      { nombre: { contains: q, mode: 'insensitive' } },
      { registroInvima: { contains: q, mode: 'insensitive' } },
    ]
    if (categoriaId) where.categoriaId = parseInt(categoriaId)
    if (activo !== undefined) where.activo = activo === 'true'

    try {
      const [total, productos] = await Promise.all([
        prisma.producto.count({ where }),
        prisma.producto.findMany({
          where, skip, take: limite,
          orderBy: { nombre: 'asc' },
          include: {
            categoria: { select: { nombre: true, icono: true } },
            lotes: {
              where: { cantidadActual: { gt: 0 } },
              select: { cantidadActual: true, fechaVencimiento: true, codigoLote: true },
              orderBy: { fechaVencimiento: 'asc' }, // FEFO
            },
          },
        }),
      ])

      const resultado = productos.map((p: any) => ({
        ...p,
        stockTotal: p.lotes.reduce((s: number, l: any) => s + l.cantidadActual, 0),
        proximoVencer: p.lotes[0]?.fechaVencimiento ?? null,
        stockBajo: p.lotes.reduce((s: number, l: any) => s + l.cantidadActual, 0) <= p.stockMinimo,
      }))

      return responder.lista(res, resultado, {
        pagina, limite, total, totalPaginas: Math.ceil(total / limite),
      })
    } catch (err) {
      return responder.serverError(res, err)
    }
  }
)

// ── GET /:id ──────────────────────────────────────────────
productosRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const producto = await prisma.producto.findUnique({
      where: { id: req.params.id },
      include: {
        categoria: true,
        lotes: {
          where: { cantidadActual: { gt: 0 } },
          orderBy: { fechaVencimiento: 'asc' },
          include: { sucursal: { select: { nombre: true } } },
        },
      },
    })
    if (!producto) return responder.noEncontrado(res, 'Producto')
    return responder.ok(res, producto)
  } catch (err) {
    return responder.serverError(res, err)
  }
})

// ── POST / ────────────────────────────────────────────────
productosRouter.post(
  '/',
  autenticar,
  autorizar('ADMINISTRADOR', 'AUXILIAR'),
  validarCuerpo(crearSchema),
  async (req: Request, res: Response) => {
    const data = req.body

    // Generar slug único
    const slug = data.nombre.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      + (data.concentracion ? '-' + data.concentracion.toLowerCase().replace(/\s/g, '') : '')

    try {
      const producto = await prisma.producto.create({
        data: { ...data, slug, precioVenta: data.precioVenta, precioPromedio: 0 },
        include: { categoria: { select: { nombre: true } } },
      })
      await cache.delPattern('productos:buscar:*')
      return responder.creado(res, producto)
    } catch (err: any) {
      if (err.code === 'P2002') {
        return responder.error(res, 'Ya existe un producto con ese Registro INVIMA', 409)
      }
      return responder.serverError(res, err)
    }
  }
)

// ── PATCH /:id ────────────────────────────────────────────
productosRouter.patch(
  '/:id',
  autenticar,
  autorizar('ADMINISTRADOR', 'AUXILIAR'),
  validarCuerpo(actualizarSchema),
  async (req: Request, res: Response) => {
    try {
      const producto = await prisma.producto.update({
        where: { id: req.params.id },
        data: req.body,
      })
      await cache.delPattern('productos:buscar:*')
      return responder.ok(res, producto, 'Producto actualizado')
    } catch (err) {
      return responder.serverError(res, err)
    }
  }
)

// ── DELETE /:id — solo desactiva, no elimina (trazabilidad) ─
productosRouter.delete(
  '/:id',
  autenticar,
  autorizar('ADMINISTRADOR'),
  async (req: Request, res: Response) => {
    try {
      await prisma.producto.update({
        where: { id: req.params.id },
        data: { activo: false },
      })
      await cache.delPattern('productos:buscar:*')
      return responder.ok(res, null, 'Producto desactivado')
    } catch (err) {
      return responder.serverError(res, err)
    }
  }
)