// ══════════════════════════════════════════════════════════
//  MÓDULO AUDITORÍA
//  GET /api/v1/logs-actividad — visor de logs de actividad
// ══════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express'
import { prisma } from '../../config/database'
import { responder, parsePaginacion } from '../../utils/respuesta.utils'
import { autenticar, autorizar } from '../../middlewares/index'

export const auditoriaRouter: Router = Router()

// ── GET /logs-actividad ───────────────────────────────────
auditoriaRouter.get('/logs-actividad', autenticar, autorizar('ADMINISTRADOR'), async (req: Request, res: Response) => {
  const { skip, limite, pagina } = parsePaginacion(req.query as any)
  const { desde, hasta, accion, modulo, empleadoId, ip, q } = req.query as any

  try {
    const where: any = {}
    if (desde) where.creadoEn = { gte: new Date(desde) }
    if (hasta) {
      const hastaDate = new Date(hasta)
      hastaDate.setHours(23, 59, 59, 999)
      where.creadoEn = { ...where.creadoEn, lte: hastaDate }
    }
    if (accion) where.accion = { contains: accion, mode: 'insensitive' }
    if (modulo) where.modulo = { contains: modulo, mode: 'insensitive' }
    if (empleadoId) where.empleadoId = empleadoId
    if (ip) where.ip = { contains: ip }
    if (q) {
      where.OR = [
        { ip: { contains: q, mode: 'insensitive' } },
        { accion: { contains: q, mode: 'insensitive' } },
        { modulo: { contains: q, mode: 'insensitive' } },
        { empleado: { email: { contains: q, mode: 'insensitive' } } },
      ]
    }

    const [total, registros] = await Promise.all([
      prisma.logActividad.count({ where }),
      prisma.logActividad.findMany({
        where,
        skip,
        take: limite,
        orderBy: { creadoEn: 'desc' },
        include: {
          empleado: {
            select: { id: true, nombre: true, apellido: true, email: true, rol: true },
          },
        },
      }),
    ])

    return responder.lista(res, registros, {
      pagina, limite, total, totalPaginas: Math.ceil(total / limite),
    })
  } catch (err) {
    return responder.serverError(res, err)
  }
})

// ── GET /logs-actividad/acciones — lista de acciones disponibles ──
auditoriaRouter.get('/logs-actividad/acciones', autenticar, autorizar('ADMINISTRADOR'), async (_req: Request, res: Response) => {
  try {
    const acciones = await prisma.logActividad.groupBy({
      by: ['accion'],
      _count: { accion: true },
      orderBy: { _count: { accion: 'desc' } },
    })
    return responder.ok(res, acciones.map(a => ({ accion: a.accion, total: a._count.accion })))
  } catch (err) {
    return responder.serverError(res, err)
  }
})

// ── GET /productos/:id/historial-cambios — historial de cambios en producto ──
auditoriaRouter.get('/productos/:id/historial-cambios', autenticar, autorizar('ADMINISTRADOR', 'AUXILIAR'), async (req: Request, res: Response) => {
  const { skip, limite, pagina } = parsePaginacion(req.query as any)

  try {
    const where = { productoId: req.params.id }
    const [total, cambios] = await Promise.all([
      prisma.historialCambio.count({ where }),
      prisma.historialCambio.findMany({
        where,
        skip,
        take: limite,
        orderBy: { creadoEn: 'desc' },
        include: {
          empleado: {
            select: { id: true, nombre: true, apellido: true, email: true },
          },
        },
      }),
    ])

    return responder.lista(res, cambios, {
      pagina, limite, total, totalPaginas: Math.ceil(total / limite),
    })
  } catch (err) {
    return responder.serverError(res, err)
  }
})
