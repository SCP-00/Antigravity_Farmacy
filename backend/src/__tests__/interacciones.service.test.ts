import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ─────────────────────────────────────────
const { mockProductoFindMany, mockProductoFindUnique } = vi.hoisted(() => ({
  mockProductoFindMany: vi.fn(),
  mockProductoFindUnique: vi.fn(),
}))

vi.mock('../config/database', () => ({
  prisma: {
    producto: {
      findMany: mockProductoFindMany,
      findUnique: mockProductoFindUnique,
    },
  },
}))

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

import {
  verificarInteracciones,
  verificarAlergenos,
  recomendarSimilares,
  obtenerPrincipiosActivos,
} from '../services/interacciones.service'

// ── Helpers ───────────────────────────────────────────────
function producto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prod-1',
    nombre: 'Ibuprofeno',
    principioActivo: 'Ibuprofeno',
    interacciones: null,
    contraindicaciones: null,
    reaccionesAdversas: null,
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════
//  verificarInteracciones
// ═══════════════════════════════════════════════════════════
describe('verificarInteracciones()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna sin alertas si hay menos de 2 productos', async () => {
    const resultado = await verificarInteracciones(['prod-1'])
    expect(resultado).toEqual({ tieneAlertas: false, alertas: [] })
    expect(mockProductoFindMany).not.toHaveBeenCalled()
  })

  it('retorna sin alertas si los productos no interactúan', async () => {
    mockProductoFindMany.mockResolvedValue([
      producto({ id: 'prod-1', nombre: 'Ibuprofeno', principioActivo: 'Ibuprofeno', interacciones: '' }),
      producto({ id: 'prod-2', nombre: 'Acetaminofén', principioActivo: 'Acetaminofén', interacciones: '' }),
    ])

    const resultado = await verificarInteracciones(['prod-1', 'prod-2'])
    expect(resultado.tieneAlertas).toBe(false)
    expect(resultado.alertas).toEqual([])
  })

  it('detecta interacción cuando un producto menciona al otro por nombre', async () => {
    mockProductoFindMany.mockResolvedValue([
      producto({
        id: 'prod-1', nombre: 'Ibuprofeno',
        interacciones: 'Puede interactuar con Acetaminofén. Evitar uso conjunto prolongado.',
      }),
      producto({
        id: 'prod-2', nombre: 'Acetaminofén',
        interacciones: '',
      }),
    ])

    const resultado = await verificarInteracciones(['prod-1', 'prod-2'])
    expect(resultado.tieneAlertas).toBe(true)
    expect(resultado.alertas).toHaveLength(1)
    expect(resultado.alertas[0].tipo).toBe('INTERACCION_MEDICAMENTOSA')
    expect(resultado.alertas[0].productoA).toBe('Ibuprofeno')
    expect(resultado.alertas[0].productoB).toBe('Acetaminofén')
    expect(resultado.alertas[0].severidad).toBe('ALTA')
  })

  it('detecta interacción por principio activo', async () => {
    mockProductoFindMany.mockResolvedValue([
      producto({
        id: 'prod-1', nombre: 'Advil',
        principioActivo: 'Ibuprofeno',
        interacciones: 'No combinar con otros AINEs como Naproxeno.',
      }),
      producto({
        id: 'prod-2', nombre: 'Naproxeno',
        principioActivo: 'Naproxeno',
        interacciones: '',
      }),
    ])

    const resultado = await verificarInteracciones(['prod-1', 'prod-2'])
    expect(resultado.tieneAlertas).toBe(true)
    expect(resultado.alertas).toHaveLength(1)
    expect(resultado.alertas[0].productoA).toBe('Advil')
    expect(resultado.alertas[0].productoB).toBe('Naproxeno')
    expect(resultado.alertas[0].severidad).toBe('ALTA')
  })

  it('detecta interacción bidireccional', async () => {
    mockProductoFindMany.mockResolvedValue([
      producto({
        id: 'prod-1', nombre: 'Warfarina',
        interacciones: 'Interactúa con Ibuprofeno. Riesgo de sangrado.',
      }),
      producto({
        id: 'prod-2', nombre: 'Ibuprofeno',
        interacciones: 'Interactúa con Warfarina. Aumenta riesgo de sangrado.',
      }),
    ])

    const resultado = await verificarInteracciones(['prod-1', 'prod-2'])
    expect(resultado.tieneAlertas).toBe(true)
    expect(resultado.alertas.length).toBeGreaterThanOrEqual(2)
    // Debe detectar ambas direcciones
    const pares = resultado.alertas.filter(a => a.tipo === 'INTERACCION_MEDICAMENTOSA')
    expect(pares).toHaveLength(2)
  })

  it('detecta contraindicaciones cruzadas con severidad MEDIA', async () => {
    mockProductoFindMany.mockResolvedValue([
      producto({
        id: 'prod-1', nombre: 'Losartán',
        principioActivo: 'Losartán',
        contraindicaciones: 'Contraindicado con AINEs como Ibuprofeno. Riesgo de insuficiencia renal.',
      }),
      producto({
        id: 'prod-2', nombre: 'Ibuprofeno',
        principioActivo: 'Ibuprofeno',
        contraindicaciones: '',
      }),
    ])

    const resultado = await verificarInteracciones(['prod-1', 'prod-2'])
    expect(resultado.tieneAlertas).toBe(true)
    const contra = resultado.alertas.find(a => a.tipo === 'CONTRAINDICACION')
    expect(contra).toBeDefined()
    expect(contra!.severidad).toBe('MEDIA')
    expect(contra!.productoA).toBe('Losartán')
    expect(contra!.productoB).toBe('Ibuprofeno')
  })

  it('incluye reacciones adversas por producto individual (severidad INFO)', async () => {
    mockProductoFindMany.mockResolvedValue([
      producto({
        id: 'prod-1', nombre: 'Metformina',
        reaccionesAdversas: 'Náuseas, diarrea, dolor abdominal.',
      }),
      producto({
        id: 'prod-2', nombre: 'Omeprazol',
        reaccionesAdversas: 'Cefalea, dolor abdominal.',
      }),
    ])

    const resultado = await verificarInteracciones(['prod-1', 'prod-2'])
    expect(resultado.tieneAlertas).toBe(true)
    const reacciones = resultado.alertas.filter(a => a.tipo === 'REACCION')
    expect(reacciones).toHaveLength(2)
    expect(reacciones[0].severidad).toBe('INFO')
    expect(reacciones[0].productoA).toBe('Metformina')
    expect(reacciones[1].productoA).toBe('Omeprazol')
  })

  it('no duplica alertas para el mismo par', async () => {
    mockProductoFindMany.mockResolvedValue([
      producto({
        id: 'prod-1', nombre: 'Warfarina',
        interacciones: 'Interactúa con Ibuprofeno.',
        contraindicaciones: 'Contraindicado con Ibuprofeno.',
      }),
      producto({
        id: 'prod-2', nombre: 'Ibuprofeno',
        interacciones: '',
        contraindicaciones: '',
      }),
    ])

    const resultado = await verificarInteracciones(['prod-1', 'prod-2'])
    const interacciones = resultado.alertas.filter(a => a.tipo === 'INTERACCION_MEDICAMENTOSA')
    expect(interacciones).toHaveLength(1)
  })

  it('no se cae si algun producto tiene interacciones null', async () => {
    mockProductoFindMany.mockResolvedValue([
      producto({ id: 'prod-1', nombre: 'Vitamina C', interacciones: null }),
      producto({ id: 'prod-2', nombre: 'Vitamina D', interacciones: null }),
      producto({ id: 'prod-3', nombre: 'Zinc', interacciones: null }),
    ])

    const resultado = await verificarInteracciones(['prod-1', 'prod-2', 'prod-3'])
    expect(resultado.tieneAlertas).toBe(false)
  })

  it('no se cae si findMany lanza error', async () => {
    mockProductoFindMany.mockRejectedValue(new Error('DB error'))

    const resultado = await verificarInteracciones(['prod-1', 'prod-2'])
    expect(resultado.tieneAlertas).toBe(false)
    expect(resultado.alertas).toEqual([])
  })

  it('evalúa múltiples pares correctamente con 3+ productos', async () => {
    mockProductoFindMany.mockResolvedValue([
      producto({
        id: 'prod-1', nombre: 'A', principioActivo: 'A',
        interacciones: 'Interactúa con B.',
      }),
      producto({
        id: 'prod-2', nombre: 'B', principioActivo: 'B',
        interacciones: '',
      }),
      producto({
        id: 'prod-3', nombre: 'C', principioActivo: 'C',
        interacciones: 'Interactúa con A.',
      }),
    ])

    const resultado = await verificarInteracciones(['prod-1', 'prod-2', 'prod-3'])
    const interacciones = resultado.alertas.filter(a => a.tipo === 'INTERACCION_MEDICAMENTOSA')
    // A→B, C→A = 2 interacciones detectadas
    expect(interacciones.length).toBeGreaterThanOrEqual(1)
  })
})

// ═══════════════════════════════════════════════════════════
//  verificarAlergenos
// ═══════════════════════════════════════════════════════════
describe('verificarAlergenos()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna sin alertas si el cliente no tiene alérgenos registrados', async () => {
    const resultado = await verificarAlergenos('prod-1', [])
    expect(resultado).toEqual({ tieneAlertas: false, alertas: [] })
    expect(mockProductoFindUnique).not.toHaveBeenCalled()
  })

  it('retorna sin alertas si el producto no tiene campo alergenos', async () => {
    mockProductoFindUnique.mockResolvedValue(
      producto({ id: 'prod-1', nombre: 'Ibuprofeno', alergenos: null })
    )

    const resultado = await verificarAlergenos('prod-1', ['penicilina'])
    expect(resultado.tieneAlertas).toBe(false)
  })

  it('detecta alergeno coincidente con severidad ALTA', async () => {
    mockProductoFindUnique.mockResolvedValue(
      producto({
        id: 'prod-1', nombre: 'Amoxicilina',
        alergenos: 'Penicilina. Puede contener trazas de lactosa.',
      })
    )

    const resultado = await verificarAlergenos('prod-1', ['penicilina'])
    expect(resultado.tieneAlertas).toBe(true)
    expect(resultado.alertas).toHaveLength(1)
    expect(resultado.alertas[0].tipo).toBe('ALERGENO')
    expect(resultado.alertas[0].severidad).toBe('ALTA')
    expect(resultado.alertas[0].productoA).toBe('Amoxicilina')
    expect(resultado.alertas[0].descripcion).toContain('penicilina')
  })

  it('es case-insensitive al comparar alergenos', async () => {
    mockProductoFindUnique.mockResolvedValue(
      producto({
        id: 'prod-1', nombre: 'Amoxicilina',
        alergenos: 'PENICILINA. LACTOSA.',
      })
    )

    const resultado = await verificarAlergenos('prod-1', ['Penicilina'])
    expect(resultado.tieneAlertas).toBe(true)
    expect(resultado.alertas).toHaveLength(1)
  })

  it('detecta múltiples alérgenos coincidentes', async () => {
    mockProductoFindUnique.mockResolvedValue(
      producto({
        id: 'prod-1', nombre: 'Suspensión Pediátrica',
        alergenos: 'Lactosa. Aspartame. Colorante amarillo.',
      })
    )

    const resultado = await verificarAlergenos('prod-1', ['lactosa', 'aspartame'])
    expect(resultado.tieneAlertas).toBe(true)
    // Ambos alergenos deben detectarse
    expect(resultado.alertas).toHaveLength(2)
    expect(resultado.alertas[0].severidad).toBe('ALTA')
  })

  it('no detecta alergenos que no coinciden', async () => {
    mockProductoFindUnique.mockResolvedValue(
      producto({
        id: 'prod-1', nombre: 'Ibuprofeno',
        alergenos: 'Lactosa.',
      })
    )

    const resultado = await verificarAlergenos('prod-1', ['penicilina', 'sulfa'])
    expect(resultado.tieneAlertas).toBe(false)
  })

  it('retorna sin alertas si el producto no existe', async () => {
    mockProductoFindUnique.mockResolvedValue(null)

    const resultado = await verificarAlergenos('prod-inexistente', ['penicilina'])
    expect(resultado.tieneAlertas).toBe(false)
  })

  it('no se cae si findUnique lanza error', async () => {
    mockProductoFindUnique.mockRejectedValue(new Error('DB error'))

    const resultado = await verificarAlergenos('prod-1', ['penicilina'])
    expect(resultado.tieneAlertas).toBe(false)
    expect(resultado.alertas).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════
//  recomendarSimilares
// ═══════════════════════════════════════════════════════════
describe('recomendarSimilares()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna productos con el mismo ATC', async () => {
    mockProductoFindUnique.mockResolvedValue({
      id: 'prod-1', atc: 'A02BC', principioActivo: 'Omeprazol', categoriaId: 1,
    })
    mockProductoFindMany.mockResolvedValue([
      { id: 'prod-2', nombre: 'Pantoprazol', concentracion: '40mg', laboratorio: 'Tecnoquímicas', precioVenta: 25000 },
      { id: 'prod-3', nombre: 'Esomeprazol', concentracion: '20mg', laboratorio: 'Genfar', precioVenta: 18000 },
    ])

    const resultado = await recomendarSimilares('prod-1', 3)

    expect(resultado).toHaveLength(2)
    expect(resultado[0].id).toBe('prod-2')
    expect(resultado[0].precioVenta).toBe(25000)
    expect(resultado[1].nombre).toBe('Esomeprazol')
    expect(mockProductoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: 'prod-1' },
          OR: expect.arrayContaining([
            expect.objectContaining({ atc: 'A02BC' }),
          ]),
        }),
        take: 3,
      })
    )
  })

  it('busca por principioActivo si no tiene ATC', async () => {
    mockProductoFindUnique.mockResolvedValue({
      id: 'prod-1', atc: null, principioActivo: 'Ibuprofeno', categoriaId: 1,
    })
    mockProductoFindMany.mockResolvedValue([
      { id: 'prod-2', nombre: 'Ibuprofeno MK', concentracion: '400mg', laboratorio: 'MK', precioVenta: 8000 },
    ])

    const resultado = await recomendarSimilares('prod-1')
    expect(resultado).toHaveLength(1)
    expect(resultado[0].nombre).toBe('Ibuprofeno MK')
  })

  it('retorna array vacío si el producto no existe', async () => {
    mockProductoFindUnique.mockResolvedValue(null)

    const resultado = await recomendarSimilares('prod-inexistente')
    expect(resultado).toEqual([])
  })

  it('retorna array vacío si no hay similares', async () => {
    mockProductoFindUnique.mockResolvedValue({
      id: 'prod-1', atc: 'UNIQUE', principioActivo: 'Raro', categoriaId: 1,
    })
    mockProductoFindMany.mockResolvedValue([])

    const resultado = await recomendarSimilares('prod-1')
    expect(resultado).toEqual([])
  })

  it('retorna array vacío si el producto no tiene ni ATC ni principioActivo', async () => {
    mockProductoFindUnique.mockResolvedValue({
      id: 'prod-1', atc: null, principioActivo: null, categoriaId: 1,
    })

    const resultado = await recomendarSimilares('prod-1')
    expect(resultado).toEqual([])
    expect(mockProductoFindMany).not.toHaveBeenCalled()
  })

  it('no se cae si findMany lanza error', async () => {
    mockProductoFindUnique.mockResolvedValue({
      id: 'prod-1', atc: 'A02BC', principioActivo: 'Omeprazol', categoriaId: 1,
    })
    mockProductoFindMany.mockRejectedValue(new Error('DB error'))

    const resultado = await recomendarSimilares('prod-1')
    expect(resultado).toEqual([])
  })

  it('solicita el límite correcto a Prisma (el mock no simula take)', async () => {
    mockProductoFindUnique.mockResolvedValue({
      id: 'prod-1', atc: 'A02BC', principioActivo: 'Omeprazol', categoriaId: 1,
    })
    mockProductoFindMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        id: `prod-${i}`, nombre: `Similar ${i}`, concentracion: '10mg',
        laboratorio: 'Genfar', precioVenta: 10000,
      }))
    )

    const resultado = await recomendarSimilares('prod-1', 3)
    // El mock devuelve 10, pero la consulta a Prisma lleva take: 3
    expect(mockProductoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 })
    )
    expect(resultado.length).toBeGreaterThanOrEqual(1)
  })
})

// ═══════════════════════════════════════════════════════════
//  obtenerPrincipiosActivos
// ═══════════════════════════════════════════════════════════
describe('obtenerPrincipiosActivos()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna principios activos de productos dados', async () => {
    mockProductoFindMany.mockResolvedValue([
      { id: 'prod-1', nombre: 'Ibuprofeno', principioActivo: 'Ibuprofeno', atc: 'M01AE01' },
      { id: 'prod-2', nombre: 'Acetaminofén', principioActivo: 'Acetaminofén', atc: 'N02BE01' },
    ])

    const resultado = await obtenerPrincipiosActivos(['prod-1', 'prod-2'])
    expect(resultado).toHaveLength(2)
    expect(resultado[0].principioActivo).toBe('Ibuprofeno')
    expect(resultado[1].atc).toBe('N02BE01')
  })

  it('retorna array vacío si no se pasan IDs', async () => {
    const resultado = await obtenerPrincipiosActivos([])
    expect(resultado).toEqual([])
  })

  it('retorna array vacío si no hay resultados', async () => {
    mockProductoFindMany.mockResolvedValue([])

    const resultado = await obtenerPrincipiosActivos(['inexistente'])
    expect(resultado).toEqual([])
  })

  it('no se cae si findMany lanza error', async () => {
    mockProductoFindMany.mockRejectedValue(new Error('DB error'))

    const resultado = await obtenerPrincipiosActivos(['prod-1'])
    expect(resultado).toEqual([])
  })
})
