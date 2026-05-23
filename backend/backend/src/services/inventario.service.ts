import { prisma } from '../config/database'
import { logger } from '../utils/logger'

export class InventarioService {
  /**
   * Obtiene todos los lotes de un producto que tengan stock,
   * ordenados por fecha de vencimiento ascendente (FEFO).
   */
  static async obtenerLotesFEFO(productoId: string, sucursalId: number) {
    return prisma.lote.findMany({
      where: {
        productoId,
        sucursalId,
        cantidadActual: { gt: 0 },
        fechaVencimiento: { gt: new Date() },
      },
      orderBy: { fechaVencimiento: 'asc' },
    })
  }

  /**
   * Descuenta stock de un producto usando el método FEFO.
   * Se ejecuta dentro de una transacción de Prisma.
   */
  static async descontarStockFEFO(
    tx: any, 
    productoId: string, 
    sucursalId: number, 
    cantidadSolicitada: number
  ) {
    const lotes = await tx.lote.findMany({
      where: {
        productoId,
        sucursalId,
        cantidadActual: { gt: 0 },
        fechaVencimiento: { gt: new Date() },
      },
      orderBy: { fechaVencimiento: 'asc' },
    })

    let restante = cantidadSolicitada
    const detallesLotesModificados = []

    for (const lote of lotes) {
      if (restante <= 0) break

      const cantidadADescontar = Math.min(lote.cantidadActual, restante)
      
      await tx.lote.update({
        where: { id: lote.id },
        data: { cantidadActual: { decrement: cantidadADescontar } }
      })

      detallesLotesModificados.push({
        loteId: lote.id,
        cantidad: cantidadADescontar
      })

      restante -= cantidadADescontar
    }

    if (restante > 0) {
      throw new Error(`Sin stock suficiente para el producto ${productoId}. Faltan ${restante} unidades.`)
    }

    return detallesLotesModificados
  }

  /**
   * Recalcula el costo promedio de un producto en base a sus lotes actuales.
   */
  static async actualizarCostoPromedio(productoId: string, nuevoPrecioCompraFallback: number) {
    const lotes = await prisma.lote.findMany({
      where: { productoId, cantidadActual: { gt: 0 } },
      select: { cantidadActual: true, precioCompra: true },
    })
    
    const totalCantidad = lotes.reduce((s: number, l: any) => s + l.cantidadActual, 0)
    const totalCosto = lotes.reduce((s: number, l: any) => s + (l.cantidadActual * Number(l.precioCompra)), 0)
    const promedio = totalCantidad > 0 ? (totalCosto / totalCantidad) : nuevoPrecioCompraFallback

    await prisma.producto.update({
      where: { id: productoId },
      data: { precioPromedio: promedio },
    })

    return promedio
  }
}
