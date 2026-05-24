import { describe, it, expect, vi } from 'vitest'
import { Response } from 'express'

// ── Helper: mock parcial de Response ───────────────────────
function mockRes() {
  const res = {} as Response
  res.status = vi.fn().mockReturnThis()
  res.json = vi.fn().mockReturnThis()
  return res
}

import { responder, parsePaginacion } from '../utils/respuesta.utils'

describe('responder.ok()', () => {
  it('responde con data y 200 por defecto', () => {
    const res = mockRes()
    responder.ok(res, { id: 1 })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ ok: true, data: { id: 1 } })
  })

  it('incluye mensaje opcional', () => {
    const res = mockRes()
    responder.ok(res, { id: 1 }, 'Operación exitosa')
    expect(res.json).toHaveBeenCalledWith({
      ok: true, mensaje: 'Operación exitosa', data: { id: 1 },
    })
  })

  it('acepta statusCode personalizado', () => {
    const res = mockRes()
    responder.ok(res, [], undefined, 201)
    expect(res.status).toHaveBeenCalledWith(201)
  })
})

describe('responder.creado()', () => {
  it('responde con 201 y mensaje por defecto', () => {
    const res = mockRes()
    responder.creado(res, { id: 1 })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      ok: true, mensaje: 'Creado exitosamente', data: { id: 1 },
    })
  })

  it('acepta mensaje personalizado', () => {
    const res = mockRes()
    responder.creado(res, {}, 'Registro insertado')
    expect(res.json).toHaveBeenCalledWith({
      ok: true, mensaje: 'Registro insertado', data: {},
    })
  })
})

describe('responder.lista()', () => {
  it('responde con data y meta', () => {
    const res = mockRes()
    responder.lista(res, [{ id: 1 }], { pagina: 1, limite: 20, total: 1, totalPaginas: 1 })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      data: [{ id: 1 }],
      meta: { pagina: 1, limite: 20, total: 1, totalPaginas: 1 },
    })
  })
})

describe('responder.error()', () => {
  it('responde con 400 y mensaje por defecto', () => {
    const res = mockRes()
    responder.error(res, 'Algo salió mal')
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'Algo salió mal' })
  })

  it('acepta statusCode personalizado', () => {
    const res = mockRes()
    responder.error(res, 'Conflicto', 409)
    expect(res.status).toHaveBeenCalledWith(409)
  })
})

describe('responder.noAutorizado()', () => {
  it('responde 401 con mensaje por defecto', () => {
    const res = mockRes()
    responder.noAutorizado(res)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'No autorizado' })
  })

  it('responde 401 con mensaje personalizado', () => {
    const res = mockRes()
    responder.noAutorizado(res, 'Token expirado')
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'Token expirado' })
  })
})

describe('responder.prohibido()', () => {
  it('responde 403 con mensaje por defecto', () => {
    const res = mockRes()
    responder.prohibido(res)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      ok: false, error: 'No tienes permisos para esta acción',
    })
  })
})

describe('responder.noEncontrado()', () => {
  it('responde 404 con mensaje genérico', () => {
    const res = mockRes()
    responder.noEncontrado(res)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'Recurso no encontrado' })
  })

  it('responde 404 con recurso personalizado', () => {
    const res = mockRes()
    responder.noEncontrado(res, 'Producto')
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'Producto no encontrado' })
  })
})

describe('responder.serverError()', () => {
  it('responde 500', () => {
    const res = mockRes()
    responder.serverError(res)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'Error interno del servidor' })
  })
})

describe('parsePaginacion()', () => {
  it('usa valores por defecto', () => {
    const result = parsePaginacion({})
    expect(result).toEqual({ pagina: 1, limite: 20, skip: 0 })
  })

  it('parsea valores válidos', () => {
    const result = parsePaginacion({ pagina: '3', limite: '10' })
    expect(result).toEqual({ pagina: 3, limite: 10, skip: 20 })
  })

  it('fuerza mínimo de pagina=1', () => {
    const result = parsePaginacion({ pagina: '0' })
    expect(result.pagina).toBe(1)
    expect(result.skip).toBe(0)
  })

  it('fuerza máximo de limite=100', () => {
    const result = parsePaginacion({ limite: '999' })
    expect(result.limite).toBe(100)
  })

  it('fuerza mínimo de limite=1', () => {
    const result = parsePaginacion({ limite: '-5' })
    expect(result.limite).toBe(1)
  })
})
