import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks para usar en vi.mock ────────────────────
const { mockDescontarStockFEFO, mockVentaCreate, mockClienteUpdate, mockTransaction } =
  vi.hoisted(() => ({
    mockDescontarStockFEFO: vi.fn(),
    mockVentaCreate: vi.fn(),
    mockClienteUpdate: vi.fn(),
    mockTransaction: vi.fn(),
  }))

vi.mock('../services/inventario.service', () => ({
  InventarioService: {
    descontarStockFEFO: mockDescontarStockFEFO,
  },
}))

vi.mock('../config/database', () => ({
  prisma: {
    $transaction: mockTransaction,
    cliente: { update: mockClienteUpdate },
  },
}))

import { VentasService } from '../services/ventas.service'

function crearTxMock() {
  return {
    venta: { create: mockVentaCreate },
    cliente: { update: mockClienteUpdate },
    lote: { findMany: vi.fn(), update: vi.fn() },
  }
}

describe('VentasService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('registrarVenta()', () => {
    const ventaBase = {
      sucursalId: 1,
      cajaId: 'caja-uuid',
      empleadoId: 'emp-uuid',
      metodoPago: 'EFECTIVO' as const,
      descuento: 0,
      items: [
        { productoId: 'prod-1', cantidad: 3, precioUnitario: 5000, descuento: 0 },
        { productoId: 'prod-2', cantidad: 2, precioUnitario: 8000, descuento: 500 },
      ],
    }

    it('registra una venta exitosa con FEFO', async () => {
      const tx = crearTxMock()
      mockTransaction.mockImplementation(async (cb: any) => cb(tx))

      mockDescontarStockFEFO
        .mockResolvedValueOnce([{ loteId: 'lote-1', cantidad: 3 }])
        .mockResolvedValueOnce([{ loteId: 'lote-2', cantidad: 2 }])

      mockVentaCreate.mockResolvedValue({
        id: 'venta-nueva', numero: 1, total: 30500, detalles: [],
      })

      const resultado = await VentasService.registrarVenta(ventaBase)

      expect(resultado).toBeDefined()
      expect(mockDescontarStockFEFO).toHaveBeenCalledTimes(2)
      expect(mockDescontarStockFEFO).toHaveBeenNthCalledWith(1, tx, 'prod-1', 1, 3)
      expect(mockDescontarStockFEFO).toHaveBeenNthCalledWith(2, tx, 'prod-2', 1, 2)
    })

    it('suma puntos de fidelidad cuando hay cliente', async () => {
      const tx = crearTxMock()
      mockTransaction.mockImplementation(async (cb: any) => cb(tx))
      mockDescontarStockFEFO.mockResolvedValue([{ loteId: 'lote-1', cantidad: 1 }])
      mockVentaCreate.mockResolvedValue({
        id: 'venta-123', numero: 2, total: 5000, detalles: [],
      })

      const ventaConCliente = {
        ...ventaBase,
        clienteId: 'cliente-uuid',
        items: [{ productoId: 'prod-1', cantidad: 1, precioUnitario: 5000, descuento: 0 }],
      }

      await VentasService.registrarVenta(ventaConCliente)

      // 1 punto por cada $100 COP (total = 5000 → 50 puntos)
      expect(mockClienteUpdate).toHaveBeenCalledWith({
        where: { id: 'cliente-uuid' },
        data: {
          puntosAcumulados: { increment: 50 },
          puntosExpiranEn: expect.any(Date),
        },
      })
    })

    it('no suma puntos si total < 100 (1 punto cada $100)', async () => {
      const tx = crearTxMock()
      mockTransaction.mockImplementation(async (cb: any) => cb(tx))
      mockDescontarStockFEFO.mockResolvedValue([{ loteId: 'lote-1', cantidad: 1 }])
      mockVentaCreate.mockResolvedValue({
        id: 'venta-456', numero: 3, total: 50, detalles: [],
      })

      const ventaSinPuntos = {
        ...ventaBase,
        clienteId: 'cliente-uuid',
        items: [{ productoId: 'prod-1', cantidad: 1, precioUnitario: 50, descuento: 0 }],
      }

      await VentasService.registrarVenta(ventaSinPuntos)

      expect(mockClienteUpdate).not.toHaveBeenCalled()
    })

    it('propaga el error si FEFO falla (stock insuficiente)', async () => {
      mockTransaction.mockImplementation(async (cb: any) => {
        const tx = crearTxMock()
        mockDescontarStockFEFO.mockRejectedValue(
          new Error('Sin stock suficiente para el producto prod-1. Faltan 5 unidades.')
        )
        return cb(tx)  // Propagar el reject para que $transaction falle
      })

      await expect(VentasService.registrarVenta(ventaBase)).rejects.toThrow()
    })

    it('registra venta sin cajaId y sin clienteId (tienda online)', async () => {
      const tx = crearTxMock()
      mockTransaction.mockImplementation(async (cb: any) => cb(tx))
      mockDescontarStockFEFO.mockResolvedValue([{ loteId: 'lote-1', cantidad: 2 }])
      mockVentaCreate.mockResolvedValue({
        id: 'venta-online', numero: 5, total: 20000, detalles: [],
      })

      const ventaOnline = {
        sucursalId: 1,
        empleadoId: 'emp-uuid',
        metodoPago: 'TRANSFERENCIA' as const,
        descuento: 0,
        items: [{ productoId: 'prod-1', cantidad: 2, precioUnitario: 10000, descuento: 0 }],
      }

      const resultado = await VentasService.registrarVenta(ventaOnline)
      expect(resultado).toBeDefined()
    })
  })
})
