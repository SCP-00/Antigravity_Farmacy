import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'
import { responder, parsePaginacion } from '../../utils/respuesta.utils'
import { autenticar, autorizar, validarQuery } from '../../middlewares/index'

export const clientesAdminRouter: Router = Router()

// ── Schema validación query params — previene NoSQL injection
const listarClientesSchema = z.object({
  q:      z.string().optional(),
  pagina: z.string().optional(),
  limite: z.string().optional(),
})

// ── Insensitive mode helper ───────────────────────────────
const iLike = (value: unknown) => ({
  contains: typeof value === 'string' ? value : '',
  mode: Prisma.QueryMode.insensitive,
})

clientesAdminRouter.get('/', autenticar, autorizar('ADMINISTRADOR','FARMACEUTA'), validarQuery(listarClientesSchema),
  async (req: Request, res: Response) => {
    const { skip, limite, pagina } = parsePaginacion(req.query as any)
    const { q } = req.query as any
    const where = q
      ? { OR: [
          { nombre:    iLike(q) },
          { email:     iLike(q) },
          { documento: { contains: q } },
        ]} : {}
    try {
      const [total, clientes] = await Promise.all([
        prisma.cliente.count({ where }),
        prisma.cliente.findMany({
          where, skip, take: limite, orderBy: { creadoEn: 'desc' },
          select: {
            id: true, nombre: true, apellido: true, email: true,
            telefono: true, puntosAcumulados: true, creadoEn: true,
            _count: { select: { ventas: true } },
          },
        }),
      ])
      return responder.lista(res, clientes,
        { pagina, limite, total, totalPaginas: Math.ceil(total / limite) }
      )
    } catch (err) { return responder.serverError(res, err) }
  }
)

clientesAdminRouter.get('/:id', autenticar, autorizar('ADMINISTRADOR','FARMACEUTA'),
  async (req: Request, res: Response) => {
    try {
      const c = await prisma.cliente.findUnique({
        where: { id: req.params.id },
        include: {
          ventas: { take: 10, orderBy: { creadoEn: 'desc' },
            select: { numero: true, total: true, creadoEn: true, estado: true } },
        },
      })
      if (!c) return responder.noEncontrado(res, 'Cliente')
      return responder.ok(res, c)
    } catch (err) { return responder.serverError(res, err) }
  }
)

// ── GET /:id/compras — Historial de compras del cliente ───
clientesAdminRouter.get('/:id/compras', autenticar, autorizar('ADMINISTRADOR','FARMACEUTA'),
  async (req: Request, res: Response) => {
    try {
      const cliente = await prisma.cliente.findUnique({
        where: { id: req.params.id },
        select: { id: true },
      })
      if (!cliente) return responder.noEncontrado(res, 'Cliente')

      const ventas = await prisma.venta.findMany({
        where: { clienteId: req.params.id },
        orderBy: { creadoEn: 'desc' },
        select: {
          id: true, numero: true, total: true, estado: true,
          metodoPago: true, creadoEn: true,
          detalles: {
            select: {
              cantidad: true, precioUnitario: true,
              producto: { select: { nombre: true, presentacion: true } },
            },
          },
        },
      })

      return responder.ok(res, ventas)
    } catch (err) { return responder.serverError(res, err) }
  }
)