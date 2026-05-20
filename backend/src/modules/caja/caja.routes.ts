// ══════════════════════════════════════════════════════════
//  MÓDULO CAJA — Apertura, cierre, estado actual
// ══════════════════════════════════════════════════════════
import { Router, Request, Response } from 'express'
import { prisma } from '../../config/database'
import { responder } from '../../utils/respuesta.utils'
import { autenticar, autorizar } from '../../middlewares/index'

export const cajaRouter = Router()

cajaRouter.get('/actual', autenticar, autorizar('ADMINISTRADOR','FARMACEUTA'),
  async (req: Request, res: Response) => {
    try {
      const caja = await prisma.caja.findFirst({
        where: { empleadoId: req.empleado!.id, cerradaEn: null },
        include: { sucursal: { select: { nombre: true } } },
      })
      return responder.ok(res, caja)
    } catch (err) { return responder.serverError(res, err) }
  }
)

cajaRouter.post('/abrir', autenticar, autorizar('ADMINISTRADOR','FARMACEUTA'),
  async (req: Request, res: Response) => {
    const { sucursalId, montoApertura } = req.body
    try {
      const yaAbierta = await prisma.caja.findFirst({
        where: { empleadoId: req.empleado!.id, cerradaEn: null },
      })
      if (yaAbierta) return responder.error(res, 'Ya tienes una caja abierta', 409)

      const caja = await prisma.caja.create({
        data: { sucursalId, empleadoId: req.empleado!.id, montoApertura },
      })
      return responder.creado(res, caja, 'Caja abierta')
    } catch (err) { return responder.serverError(res, err) }
  }
)

cajaRouter.post('/:id/cerrar', autenticar, autorizar('ADMINISTRADOR','FARMACEUTA'),
  async (req: Request, res: Response) => {
    const { montoCierre, totalEfectivo, totalTarjeta, totalOnline, observaciones } = req.body
    try {
      // Verificar ventas pendientes (R_RF4.3)
      const pendientes = await prisma.venta.count({
        where: { cajaId: req.params.id, estado: 'PENDIENTE' },
      })
      if (pendientes > 0) {
        return responder.error(res, `Hay ${pendientes} venta(s) pendientes por procesar`)
      }

      const totalVentas = await prisma.venta.aggregate({
        where:  { cajaId: req.params.id, estado: 'PAGADO' },
        _sum:   { total: true },
      })

      const total      = Number(totalVentas._sum.total ?? 0)
      const diferencia = (montoCierre ?? 0) - total

      const caja = await prisma.caja.update({
        where: { id: req.params.id },
        data: {
          montoCierre, totalEfectivo, totalTarjeta, totalOnline,
          totalVentas: total, diferencia, observaciones,
          cerradaEn: new Date(),
        },
      })
      return responder.ok(res, caja, 'Caja cerrada exitosamente')
    } catch (err) { return responder.serverError(res, err) }
  }
)

cajaRouter.get('/historial', autenticar, autorizar('ADMINISTRADOR','FARMACEUTA'),
  async (req: Request, res: Response) => {
    const esAdmin = req.empleado!.rol === 'ADMINISTRADOR'
    try {
      const cajas = await prisma.caja.findMany({
        where: esAdmin ? {} : { empleadoId: req.empleado!.id },
        orderBy: { abiertaEn: 'desc' },
        take: 30,
        include: {
          empleado: { select: { nombre: true, apellido: true } },
          sucursal: { select: { nombre: true } },
          _count:   { select: { ventas: true } },
        },
      })
      return responder.ok(res, cajas)
    } catch (err) { return responder.serverError(res, err) }
  }
)