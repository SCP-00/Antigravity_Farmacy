import jwt from 'jsonwebtoken'
import { env } from '../config/env'

// ── Payload tipos ─────────────────────────────────────────
export interface EmpleadoPayload {
  id: string
  nombre: string
  email: string
  rol: string
  sucursalId?: number | null
}

export interface ClientePayload {
  id: string
  nombre: string
  email: string
  tipo: 'cliente'
}

// ── Empleados ─────────────────────────────────────────────
export const jwtEmpleado = {
  firmar(payload: EmpleadoPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any })
  },

  firmarRefresh(payload: Pick<EmpleadoPayload, 'id'>): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any })
  },

  verificar(token: string): EmpleadoPayload {
    return jwt.verify(token, env.JWT_SECRET) as EmpleadoPayload
  },

  verificarRefresh(token: string): Pick<EmpleadoPayload, 'id'> {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as Pick<EmpleadoPayload, 'id'>
  },
}

// ── Clientes ──────────────────────────────────────────────
export const jwtCliente = {
  firmar(payload: ClientePayload): string {
    return jwt.sign(payload, env.JWT_CLIENTE_SECRET, { expiresIn: env.JWT_CLIENTE_EXPIRES_IN as any })
  },

  verificar(token: string): ClientePayload {
    return jwt.verify(token, env.JWT_CLIENTE_SECRET) as ClientePayload
  },
}

// ── Tokens de verificación (email, reset pass) ────────────
export const jwtTemp = {
  firmar(payload: Record<string, unknown>, expiresIn = '24h'): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresIn as any })
  },

  verificar(token: string): Record<string, unknown> {
    return jwt.verify(token, env.JWT_SECRET) as Record<string, unknown>
  },
}