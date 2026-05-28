// ══════════════════════════════════════════════════════════
//  prerender.service.ts — Crawler detection middleware
//  Sirve HTML pre-renderizado a bots de búsqueda y crawlers
//  para mejorar SEO sin cambiar la arquitectura SPA.
//
//  Uso: app.use(prerenderMiddleware({ distPath: '/path/to/dist' }))
// ══════════════════════════════════════════════════════════
import { Request, Response, NextFunction } from 'express'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { logger } from '../utils/logger'

// ── User-Agents de crawlers conocidos ───────────────────
const CRAWLER_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,         // Yahoo
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebookexternalhit/i,
  /facebookcatalog/i,
  /twitterbot/i,
  /linkedinbot/i,
  /pinterest/i,
  /whatsapp/i,
  /telegrambot/i,
  /slackbot/i,
  /discordbot/i,
  /applebot/i,
  /semrushbot/i,
  /ahrefsbot/i,
  /majestic/i,
  /rogerbot/i,      // Moz
  /exabot/i,
  /dotbot/i,        // GetGoodRank
  /gptbot/i,        // OpenAI
  /claudebot/i,
  /embeds/i,
  /curl/i,          // Para pruebas desde CLI
  /wget/i,
  /python-requests/i,
]

function esCrawler(userAgent: string): boolean {
  return CRAWLER_PATTERNS.some(pattern => pattern.test(userAgent))
}

// ── Rutas públicas que pueden tener pre-renderizado ────
const PUBLIC_ROUTES = [
  '/',               // index.html
  '/productos',      // productos.html
  '/quienes-somos',  // quienes-somos.html
  '/contacto',       // contacto.html
  '/sucursales',     // sucursales.html
  '/privacidad',     // privacidad.html
  '/terminos',       // terminos.html
  // NOTA: '/carrito' no se pre-renderiza porque su contenido depende de localStorage
]

function esRutaPrenderizable(path: string): boolean {
  // Rutas estáticas
  if (PUBLIC_ROUTES.includes(path)) return true

  // Rutas de productos: /productos/<slug>
  if (/^\/productos\/[a-zA-Z0-9-]+$/.test(path)) return true

  return false
}

function getPrenderizedPath(path: string): string {
  if (path === '/') return 'index.html'

  // /productos/<slug> → productos/<slug>.html or productos/<slug>/index.html
  if (/^\/productos\/[a-zA-Z0-9-]+$/.test(path)) {
    return `${path.slice(1)}.html`
  }

  return `${path.slice(1)}.html`
}

interface PrerenderOptions {
  distPath: string
  enabled?: boolean
}

export function prerenderMiddleware(options: PrerenderOptions) {
  const { distPath, enabled = true } = options

  return (req: Request, res: Response, next: NextFunction) => {
    if (!enabled) {
      return next()
    }

    // Solo para GET requests
    if (req.method !== 'GET') {
      return next()
    }

    const userAgent = (req.headers['user-agent'] || '').toLowerCase()

    // Si no es crawler, pasar al siguiente middleware (SPA normal)
    if (!esCrawler(userAgent)) {
      return next()
    }

    // Si la ruta no es prenderizable, pasar al SPA
    if (!esRutaPrenderizable(req.path)) {
      return next()
    }

    const prenderizedFile = getPrenderizedPath(req.path)
    const filePath = join(distPath, prenderizedFile)

    if (!existsSync(filePath)) {
      // Fallback: buscar como directorio/index.html (para productos/slug/index.html)
      const dirIndex = join(distPath, req.path.slice(1), 'index.html')
      if (existsSync(dirIndex)) {
        try {
          const html = readFileSync(dirIndex, 'utf-8')
          logger.info(`[prerender] Sirviendo HTML desde directorio: ${req.path}/index.html`)
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.setHeader('X-Prerendered', 'true')
          res.setHeader('X-Robots-Tag', 'index, follow')
          res.send(html)
          return
        } catch (err) {
          logger.error(`[prerender] Error leyendo ${dirIndex}: ${err}`)
        }
      }

      logger.debug(`[prerender] No pre-renderizado para ${req.path} (${prenderizedFile})`)
      return next()
    }

    try {
      const html = readFileSync(filePath, 'utf-8')
      logger.info(`[prerender] Sirviendo HTML pre-renderizado a crawler: ${req.path} (UA: ${userAgent.slice(0, 40)}...)`)

      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('X-Prerendered', 'true')
      res.setHeader('X-Robots-Tag', 'index, follow')
      res.send(html)
    } catch (err) {
      logger.error(`[prerender] Error leyendo ${filePath}: ${err}`)
      next()
    }
  }
}
