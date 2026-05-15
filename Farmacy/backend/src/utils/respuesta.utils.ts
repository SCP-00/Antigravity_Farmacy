import { Response } from 'express'

// ── Tipos ─────────────────────────────────────────────────
interface ApiResponse<T = unknown> {
  ok: boolean
  mensaje?: string
  data?: T
  error?: string
  meta?: {
    pagina?: number
    limite?: number
    total?: number
    totalPaginas?: number
  }
}

// ── Helpers ───────────────────────────────────────────────
export const responder = {
  ok<T>(res: Response, data: T, mensaje?: string, statusCode = 200) {
    return res.status(statusCode).json({
      ok: true,
      mensaje,
      data,
    } as ApiResponse<T>)
  },

  creado<T>(res: Response, data: T, mensaje = 'Creado exitosamente') {
    return res.status(201).json({ ok: true, mensaje, data } as ApiResponse<T>)
  },

  lista<T>(res: Response, data: T[], meta: ApiResponse['meta']) {
    return res.status(200).json({ ok: true, data, meta } as ApiResponse<T[]>)
  },

  error(res: Response, mensaje: string, statusCode = 400) {
    return res.status(statusCode).json({ ok: false, error: mensaje } as ApiResponse)
  },

  noAutorizado(res: Response, mensaje = 'No autorizado') {
    return res.status(401).json({ ok: false, error: mensaje } as ApiResponse)
  },

  prohibido(res: Response, mensaje = 'No tienes permisos para esta acción') {
    return res.status(403).json({ ok: false, error: mensaje } as ApiResponse)
  },

  noEncontrado(res: Response, recurso = 'Recurso') {
    return res.status(404).json({ ok: false, error: `${recurso} no encontrado` } as ApiResponse)
  },

  serverError(res: Response, err?: unknown) {
    console.error('[ServerError]', err)
    return res.status(500).json({ ok: false, error: 'Error interno del servidor' } as ApiResponse)
  },
}

// ── Paginación ────────────────────────────────────────────
export function parsePaginacion(query: Record<string, unknown>) {
  const pagina  = Math.max(1, parseInt(String(query.pagina ?? 1)))
  const limite  = Math.min(100, Math.max(1, parseInt(String(query.limite ?? 20))))
  const skip    = (pagina - 1) * limite
  return { pagina, limite, skip }
}