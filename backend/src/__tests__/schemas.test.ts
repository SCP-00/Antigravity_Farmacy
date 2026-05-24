import { describe, it, expect } from 'vitest'
import { crearLoteSchema, ajusteInventarioSchema } from '../schemas/inventario.schema'
import { crearProductoSchema, actualizarProductoSchema } from '../schemas/productos.schema'
import { registrarVentaSchema, itemVentaSchema } from '../schemas/ventas.schema'

// ═══════════════════════════════════════════════════════════
//  Inventario Schemas
// ═══════════════════════════════════════════════════════════
describe('crearLoteSchema', () => {
  const loteValido = {
    codigoLote: 'LOT-001',
    productoId: '550e8400-e29b-41d4-a716-446655440000',
    sucursalId: 1,
    fechaVencimiento: '2026-12-31',
    cantidadInicial: 100,
    precioCompra: 5000,
  }

  it('acepta datos válidos completos', () => {
    const result = crearLoteSchema.safeParse(loteValido)
    expect(result.success).toBe(true)
  })

  it('acepta campos opcionales', () => {
    const result = crearLoteSchema.safeParse({
      ...loteValido,
      proveedorId: '550e8400-e29b-41d4-a716-446655440001',
      ordenCompraId: '550e8400-e29b-41d4-a716-446655440002',
      fechaFabricacion: '2025-01-15',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza codigoLote menor a 3 caracteres', () => {
    const result = crearLoteSchema.safeParse({ ...loteValido, codigoLote: 'AB' })
    expect(result.success).toBe(false)
  })

  it('rechaza productoId que no es uuid', () => {
    const result = crearLoteSchema.safeParse({ ...loteValido, productoId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('rechaza sucursalId no positivo', () => {
    const result = crearLoteSchema.safeParse({ ...loteValido, sucursalId: -1 })
    expect(result.success).toBe(false)
  })

  it('rechaza cantidadInicial no positiva', () => {
    const result = crearLoteSchema.safeParse({ ...loteValido, cantidadInicial: 0 })
    expect(result.success).toBe(false)
  })

  it('rechaza precioCompra no positivo', () => {
    const result = crearLoteSchema.safeParse({ ...loteValido, precioCompra: -100 })
    expect(result.success).toBe(false)
  })

  it('rechaza fechaVencimiento vacía', () => {
    const result = crearLoteSchema.safeParse({ ...loteValido, fechaVencimiento: '' })
    expect(result.success).toBe(false)
  })
})

describe('ajusteInventarioSchema', () => {
  const ajusteValido = {
    loteId: '550e8400-e29b-41d4-a716-446655440000',
    tipo: 'AJUSTE_POSITIVO',
    cantidad: 10,
    motivo: 'INVENTARIO_FISICO',
  }

  it('acepta datos válidos', () => {
    const result = ajusteInventarioSchema.safeParse(ajusteValido)
    expect(result.success).toBe(true)
  })

  it('acepta AJUSTE_NEGATIVO', () => {
    const result = ajusteInventarioSchema.safeParse({ ...ajusteValido, tipo: 'AJUSTE_NEGATIVO' })
    expect(result.success).toBe(true)
  })

  it('rechaza tipo inválido', () => {
    const result = ajusteInventarioSchema.safeParse({ ...ajusteValido, tipo: 'INVALIDO' })
    expect(result.success).toBe(false)
  })

  it('rechaza motivo inválido', () => {
    const result = ajusteInventarioSchema.safeParse({ ...ajusteValido, motivo: 'MOTIVO_INEXISTENTE' })
    expect(result.success).toBe(false)
  })

  it('acepta descripción opcional', () => {
    const result = ajusteInventarioSchema.safeParse({ ...ajusteValido, descripcion: 'Ajuste por conteo físico' })
    expect(result.success).toBe(true)
  })

  it('rechaza cantidad no positiva', () => {
    const result = ajusteInventarioSchema.safeParse({ ...ajusteValido, cantidad: 0 })
    expect(result.success).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════
//  Productos Schemas
// ═══════════════════════════════════════════════════════════
describe('crearProductoSchema', () => {
  const productValido = {
    registroInvima: 'INVIMA2023M-001234',
    cum: '1234567890',
    nombre: 'Ibuprofeno',
    principioActivo: 'Ibuprofeno',
    categoriaId: 1,
    precioVenta: 8500,
  }

  it('acepta datos válidos mínimos', () => {
    const result = crearProductoSchema.safeParse(productValido)
    expect(result.success).toBe(true)
  })

  it('acepta datos completos con todos los campos regulatorios', () => {
    const completo = {
      ...productValido,
      atc: 'M01AE01',
      descripcionAtc: 'Antiinflamatorio no esteroideo',
      titular: 'Tecnoquímicas S.A.',
      expediente: 'EXP-2023-1234',
      formaFarmaceutica: 'Tableta',
      viaAdministracion: 'Oral',
      presentacion: 'Tabletas x 30',
      concentracion: '400mg',
      laboratorio: 'Tecnoquímicas',
      descripcion: 'Analgésico y antiinflamatorio',
      requiereRx: false,
      stockMinimo: 10,
      estadoCum: 'Activo',
      estadoRegistro: 'Vigente',
      fechaExpedicion: '2023-01-15',
      fechaVencimientoRegistro: '2028-01-15',
      esMuestraMedica: false,
      alergenos: 'Lactosa',
      advertencias: 'No exceder la dosis recomendada',
      indicaciones: 'Dolor de cabeza, muscular',
      contraindicaciones: 'Insuficiencia renal',
      reaccionesAdversas: 'Náuseas, vómito',
      interacciones: 'Evitar con anticoagulantes',
      modoUso: '1 tableta cada 8 horas',
      unidadReferencia: 'Tableta',
      cantidad: '30',
      unidadMedida: 'mg',
      ium: 'IUM-001',
    }
    const result = crearProductoSchema.safeParse(completo)
    expect(result.success).toBe(true)
  })

  it('rechaza nombre menor a 2 caracteres', () => {
    const result = crearProductoSchema.safeParse({ ...productValido, nombre: 'A' })
    expect(result.success).toBe(false)
  })

  it('rechaza precioVenta no positivo', () => {
    const result = crearProductoSchema.safeParse({ ...productValido, precioVenta: 0 })
    expect(result.success).toBe(false)
  })

  it('rechaza registroInvima menor a 5 caracteres', () => {
    const result = crearProductoSchema.safeParse({ ...productValido, registroInvima: 'ABC' })
    expect(result.success).toBe(false)
  })

  it('usa default requiereRx: false', () => {
    const result = crearProductoSchema.safeParse(productValido)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.requiereRx).toBe(false)
    }
  })

  it('usa default esMuestraMedica: false', () => {
    const result = crearProductoSchema.safeParse(productValido)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.esMuestraMedica).toBe(false)
    }
  })

  it('usa default stockMinimo: 10', () => {
    const result = crearProductoSchema.safeParse(productValido)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.stockMinimo).toBe(10)
    }
  })
})

describe('actualizarProductoSchema', () => {
  it('acepta actualización parcial con un solo campo', () => {
    const result = actualizarProductoSchema.safeParse({ nombre: 'Nuevo nombre' })
    expect(result.success).toBe(true)
  })

  it('acepta actualización con múltiples campos', () => {
    const result = actualizarProductoSchema.safeParse({ nombre: 'Nuevo', precioVenta: 10000 })
    expect(result.success).toBe(true)
  })

  it('rechaza precioVenta no positivo', () => {
    const result = actualizarProductoSchema.safeParse({ precioVenta: 0 })
    expect(result.success).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════
//  Ventas Schemas
// ═══════════════════════════════════════════════════════════
describe('itemVentaSchema', () => {
  const itemValido = {
    productoId: '550e8400-e29b-41d4-a716-446655440000',
    cantidad: 2,
    precioUnitario: 5000,
  }

  it('acepta ítem válido', () => {
    const result = itemVentaSchema.safeParse(itemValido)
    expect(result.success).toBe(true)
  })

  it('usa default descuento: 0', () => {
    const result = itemVentaSchema.safeParse(itemValido)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.descuento).toBe(0)
    }
  })

  it('rechaza cantidad no positiva', () => {
    const result = itemVentaSchema.safeParse({ ...itemValido, cantidad: 0 })
    expect(result.success).toBe(false)
  })

  it('rechaza productoId que no es uuid', () => {
    const result = itemVentaSchema.safeParse({ ...itemValido, productoId: 'bad-id' })
    expect(result.success).toBe(false)
  })
})

describe('registrarVentaSchema', () => {
  const ventaValida = {
    sucursalId: 1,
    metodoPago: 'EFECTIVO',
    items: [{ productoId: '550e8400-e29b-41d4-a716-446655440000', cantidad: 2, precioUnitario: 5000 }],
  }

  it('acepta venta válida', () => {
    const result = registrarVentaSchema.safeParse(ventaValida)
    expect(result.success).toBe(true)
  })

  it('acepta todos los métodos de pago', () => {
    for (const mp of ['EFECTIVO', 'WOMPI', 'STRIPE', 'MERCADOPAGO', 'TRANSFERENCIA']) {
      const result = registrarVentaSchema.safeParse({ ...ventaValida, metodoPago: mp })
      expect(result.success).toBe(true)
    }
  })

  it('rechaza método de pago inválido', () => {
    const result = registrarVentaSchema.safeParse({ ...ventaValida, metodoPago: 'BITCOIN' })
    expect(result.success).toBe(false)
  })

  it('rechaza items vacío', () => {
    const result = registrarVentaSchema.safeParse({ ...ventaValida, items: [] })
    expect(result.success).toBe(false)
  })

  it('rechaza sucursalId no positivo', () => {
    const result = registrarVentaSchema.safeParse({ ...ventaValida, sucursalId: 0 })
    expect(result.success).toBe(false)
  })

  it('acepta campos opcionales (cajaId, clienteId, descuento)', () => {
    const result = registrarVentaSchema.safeParse({
      ...ventaValida,
      cajaId: '550e8400-e29b-41d4-a716-446655440000',
      clienteId: '550e8400-e29b-41d4-a716-446655440001',
      descuento: 500,
    })
    expect(result.success).toBe(true)
  })

  it('rechaza descuento negativo', () => {
    const result = registrarVentaSchema.safeParse({ ...ventaValida, descuento: -100 })
    expect(result.success).toBe(false)
  })
})
