import { describe, it, expect } from 'vitest'
import { jwtEmpleado, jwtCliente, jwtTemp } from '../utils/jwt.utils'
import type { EmpleadoPayload, ClientePayload } from '../utils/jwt.utils'

// Las variables de entorno JWT_SECRET/JWT_REFRESH_SECRET/JWT_CLIENTE_SECRET
// ya están definidas en vitest.config.ts globalSetup o process.env
// Para este test, verificamos que se hayan cargado correctamente desde env.ts

const empleadoPayload: EmpleadoPayload = {
  id: 'emp-001',
  nombre: 'Admin Test',
  email: 'admin@test.com',
  rol: 'ADMIN',
  sucursalId: 1,
}

const clientePayload: ClientePayload = {
  id: 'cli-001',
  nombre: 'Cliente Test',
  email: 'cliente@test.com',
  tipo: 'cliente',
}

describe('jwtEmpleado', () => {
  it('firma y verifica un token de empleado', () => {
    const token = jwtEmpleado.firmar(empleadoPayload)
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3) // header.payload.signature

    const decoded = jwtEmpleado.verificar(token)
    expect(decoded.id).toBe('emp-001')
    expect(decoded.nombre).toBe('Admin Test')
    expect(decoded.email).toBe('admin@test.com')
    expect(decoded.rol).toBe('ADMIN')
    expect(decoded.sucursalId).toBe(1)
  })

  it('firma y verifica un refresh token', () => {
    const token = jwtEmpleado.firmarRefresh({ id: 'emp-001' })
    expect(typeof token).toBe('string')

    const decoded = jwtEmpleado.verificarRefresh(token)
    expect(decoded.id).toBe('emp-001')
  })

  it('lanza error al verificar token inválido', () => {
    expect(() => jwtEmpleado.verificar('token-invalido')).toThrow()
  })

  it('lanza error al verificar token con firma alterada', () => {
    const token = jwtEmpleado.firmar(empleadoPayload)
    const alterado = token.slice(0, -5) + 'XXXXX'
    expect(() => jwtEmpleado.verificar(alterado)).toThrow()
  })

  it('lanza error al verificar refresh token inválido', () => {
    expect(() => jwtEmpleado.verificarRefresh('bad-token')).toThrow()
  })
})

describe('jwtCliente', () => {
  it('firma y verifica un token de cliente', () => {
    const token = jwtCliente.firmar(clientePayload)
    expect(typeof token).toBe('string')

    const decoded = jwtCliente.verificar(token)
    expect(decoded.id).toBe('cli-001')
    expect(decoded.nombre).toBe('Cliente Test')
    expect(decoded.email).toBe('cliente@test.com')
    expect(decoded.tipo).toBe('cliente')
  })

  it('lanza error al verificar token inválido', () => {
    expect(() => jwtCliente.verificar('token-invalido')).toThrow()
  })
})

describe('jwtTemp', () => {
  it('firma y verifica un token temporal con expiracion default', () => {
    const token = jwtTemp.firmar({ userId: 'usr-001', action: 'verify-email' })
    expect(typeof token).toBe('string')

    const decoded = jwtTemp.verificar(token)
    expect(decoded.userId).toBe('usr-001')
    expect(decoded.action).toBe('verify-email')
  })

  it('firma con expiracion personalizada', () => {
    const token = jwtTemp.firmar({ userId: 'usr-002' }, '1h')
    expect(typeof token).toBe('string')

    const decoded = jwtTemp.verificar(token)
    expect(decoded.userId).toBe('usr-002')
  })

  it('lanza error al verificar token inválido', () => {
    expect(() => jwtTemp.verificar('token-malo')).toThrow()
  })
})
