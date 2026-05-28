// ══════════════════════════════════════════════════════════
//  generar-sitemap.ts — Generador dinámico de sitemap.xml
//  Lee productos activos de la DB y genera todas las URLs
//
//  Uso: npx tsx database/scripts/generar-sitemap.ts
//  Salida: frontend/public/sitemap.xml
// ══════════════════════════════════════════════════════════
import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'

// Cargar .env
config({ path: resolve(__dirname, '../../.env') })

const SITE_URL = process.env.SITE_URL || 'https://farmacy.co'
const OUTPUT = resolve(__dirname, '../../frontend/public/sitemap.xml')

interface SitemapEntry {
  loc: string
  changefreq: string
  priority: number
  lastmod?: string
}

// ── Rutas estáticas ─────────────────────────────────────
const STATIC_ROUTES: SitemapEntry[] = [
  { loc: '/',                 changefreq: 'daily',   priority: 1.0 },
  { loc: '/productos',        changefreq: 'daily',   priority: 0.9 },
  { loc: '/sucursales',       changefreq: 'weekly',  priority: 0.7 },
  { loc: '/quienes-somos',    changefreq: 'monthly', priority: 0.6 },
  { loc: '/contacto',         changefreq: 'monthly', priority: 0.5 },
  { loc: '/carrito',          changefreq: 'weekly',  priority: 0.4 },
  { loc: '/privacidad',       changefreq: 'yearly',  priority: 0.2 },
  { loc: '/terminos',         changefreq: 'yearly',  priority: 0.2 },
]

function url(xml: string) {
  return (s: SitemapEntry) => `  <url>
    <loc>${xml}${s.loc}</loc>
    <changefreq>${s.changefreq}</changefreq>
    <priority>${s.priority.toFixed(1)}</priority>
    ${s.lastmod ? `<lastmod>${s.lastmod}</lastmod>` : ''}
  </url>`
}

async function main() {
  const prisma = new PrismaClient()

  try {
    await prisma.$connect()
    console.log('[sitemap] Conectado a DB')

    // Obtener productos activos con stock
    const productos = await prisma.producto.findMany({
      where: {
        estadoCum: 'Activo',
        esMuestraMedica: false,
      },
      select: {
        id: true,
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 500, // Máximo 500 productos en sitemap
    })

    console.log(`[sitemap] ${productos.length} productos activos encontrados`)

    // Construir sitemap
    const xml = SITE_URL.replace(/\/+$/, '')
    const entries = [
      ...STATIC_ROUTES,
      ...productos.map(p => ({
        loc: `/productos/${p.slug || p.id}`,
        changefreq: 'weekly' as const,
        priority: 0.6,
        lastmod: p.updatedAt?.toISOString().split('T')[0],
      })),
    ]

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(url(xml)).join('\n')}
</urlset>
`

    writeFileSync(OUTPUT, sitemap, 'utf-8')
    console.log(`[sitemap] ✅ ${OUTPUT} — ${entries.length} URLs totales`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(err => {
  console.error('[sitemap] Error:', err)
  process.exit(1)
})
