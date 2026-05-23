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
    items: Array<{ productoId: string; cantidad: number; precioUnitario: number; descuento?: number }>
  }) {
    return await prisma.$transaction(async (tx: any) => {
      let subtotal = 0
      const detalles: any[] = []

      for (const item of data.items) {
        // Uso del servicio FEFO para descontar el inventario
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

      const total = subtotal - (data.descuento ?? 0)

      // Registrar la venta principal
      const venta = await tx.venta.create({
        data: {
          sucursalId: data.sucursalId,
          cajaId: data.cajaId ?? null,
          empleadoId: data.empleadoId,
          clienteId: data.clienteId ?? null,
          metodoPago: data.metodoPago,
          subtotal,
          descuento: data.descuento ?? 0,
          iva: 0,
          total,
          estado: 'PAGADO',
          detalles: { createMany: { data: detalles } },
        },
        include: { detalles: true },
      })

      // Sumar puntos de fidelidad si hay un cliente asociado
      if (data.clienteId) {
        const puntos = Math.floor(total / 1000)
        if (puntos > 0) {
          const expira = new Date()
          expira.setFullYear(expira.getFullYear() + 1)
          await tx.cliente.update({
            where: { id: data.clienteId },
            data: {
              puntosAcumulados: { increment: puntos },
              puntosExpiranEn: expira,
            },
          })
        }
      }

      return venta
    })
  }
}
