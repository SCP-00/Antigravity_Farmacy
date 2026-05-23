import { prisma } from '../config/database'
import { InventarioService } from './inventario.service'

export class VentasService {
  static async registrarVenta(data: {
    sucursalId: number
    cajaId?: string
    clienteId?: string
    empleadoId: string
    metodoPago: string
    descuento: number
    puntosUsados?: number
    items: Array<{ productoId: string; cantidad: number; precioUnitario: number; descuento?: number }>
  }) {
    return await prisma.$transaction(async (tx: any) => {
      let subtotal = 0
      const detalles: any[] = []

      for (const item of data.items) {
        // Descontar inventario FEFO
        const lotesUsados = await InventarioService.descontarStockFEFO(
          tx,
          item.productoId,
          data.sucursalId,
          item.cantidad
        )

        let descuentoRestante = item.descuento || 0

        for (const lu of lotesUsados) {
          const valorBruto = item.precioUnitario * lu.cantidad
          const descuentoAplicar = Math.min(valorBruto, descuentoRestante)
          const valorNeto = valorBruto - descuentoAplicar

          subtotal += valorNeto
          descuentoRestante -= descuentoAplicar

          detalles.push({
            productoId: item.productoId,
            loteId: lu.loteId,
            cantidad: lu.cantidad,
            precioUnitario: item.precioUnitario,
            descuento: descuentoAplicar,
            subtotal: valorNeto,
          })
        }
      }

      // El total ahora resta el descuento manual/código y los puntos usados ($1 = 1 punto)
      const puntosDescontados = data.puntosUsados ?? 0
      const total = Math.max(0, subtotal - (data.descuento ?? 0) - puntosDescontados)

      // Registrar venta
      const venta = await tx.venta.create({
        data: {
          sucursalId: data.sucursalId,
          cajaId: data.cajaId ?? null,
          empleadoId: data.empleadoId,
          clienteId: data.clienteId ?? null,
          metodoPago: data.metodoPago,
          subtotal,
          descuento: (data.descuento ?? 0) + puntosDescontados,
          iva: 0,
          total,
          estado: 'PAGADO',
          detalles: { createMany: { data: detalles } },
        },
        include: { detalles: true },
      })

      // Manejo de puntos (Fidelidad)
      if (data.clienteId) {
        // 1. Restar los puntos usados
        if (puntosDescontados > 0) {
          await tx.cliente.update({
            where: { id: data.clienteId },
            data: { puntosAcumulados: { decrement: puntosDescontados } }
          })
        }

        // 2. Sumar los nuevos puntos generados (1 punto por cada $100 COP pagados en TOTAL FINAL)
        const puntosGanados = Math.floor(total / 100)
        if (puntosGanados > 0) {
          const expira = new Date()
          expira.setFullYear(expira.getFullYear() + 1)
          await tx.cliente.update({
            where: { id: data.clienteId },
            data: {
              puntosAcumulados: { increment: puntosGanados },
              puntosExpiranEn: expira,
            },
          })
        }
      }

      return venta
    })
  }
}
