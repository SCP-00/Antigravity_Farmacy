// ══════════════════════════════════════════════════════════
//  prerender.mjs — Build-time SSG con Playwright
//  Pre-renderiza rutas públicas estáticas para SEO
//
//  Uso: node scripts/prerender.mjs [--port 4173] [--base http://localhost:4173]
// ══════════════════════════════════════════════════════════
import { chromium } from 'playwright'
import { createServer } from 'http'
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '..', 'dist')

// ── Rutas públicas estáticas (SEO-friendly) ────────────
const STATIC_ROUTES = [
  { path: '/',               name: 'index' },
  { path: '/productos',      name: 'productos' },
  { path: '/quienes-somos',  name: 'quienes-somos' },
  { path: '/contacto',       name: 'contacto' },
  { path: '/sucursales',     name: 'sucursales' },
  { path: '/privacidad',     name: 'privacidad' },
  { path: '/terminos',       name: 'terminos' },
  // NOTA: /carrito no se pre-renderiza porque muestra estado vacío sin localStorage
]

// ── Ayudante: servidor HTTP simple para servir dist/ ──
function startServer(port) {
  const MIME = {
    '.html': 'text/html',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.json': 'application/json',
    '.svg':  'image/svg+xml',
    '.png':  'image/png',
    '.ico':  'image/x-icon',
    '.woff2':'font/woff2',
  }

  const server = createServer((req, res) => {
    let filePath = join(DIST, req.url === '/' ? 'index.html' : req.url)

    if (!existsSync(filePath)) {
      // SPA fallback: servir index.html para todas las rutas
      filePath = join(DIST, 'index.html')
    }

    try {
      const content = readFileSync(filePath)
      const ext = extname(filePath)
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
      res.end(content)
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
  })

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`[prerender] Servidor estático en http://localhost:${port}`)
      resolve(server)
    })
  })
}

// ── Ayudante: slugify para nombres de archivo ──────────
function slugify(str) {
  return str.replace(/[^a-z0-9-]/gi, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '')
}

// ── Main ───────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2)
  const portIdx = args.indexOf('--port')
  const PORT = portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : 4173

  const baseIdx = args.indexOf('--base')
  const BASE_URL = baseIdx !== -1 ? args[baseIdx + 1] : `http://localhost:${PORT}`

  // 1. Verificar que dist/ existe
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error('[prerender] ERROR: dist/index.html no encontrado. Ejecuta "pnpm run build" primero.')
    process.exit(1)
  }

  // 2. Iniciar servidor estático
  const server = await startServer(PORT)

  // 3. Lanzar Playwright (con soporte para Chromium del sistema en Docker Alpine)
  //    Setear PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH para Chromium del sistema
  //    Ej: PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  })

  let totalPrendered = 0
  const RENDER_TIMEOUT = 15000

  // 4. Pre-renderizar rutas estáticas
  for (const route of STATIC_ROUTES) {
    const url = `${BASE_URL}${route.path}`
    console.log(`[prerender] → ${url}`)

    try {
      const page = await context.newPage()

      // Navegar y esperar a que React + Helmet rendericen
      await page.goto(url, { waitUntil: 'networkidle', timeout: RENDER_TIMEOUT })

      // Esperar a que Helmet inyecte <title> con contenido real
      await page.waitForFunction(
        () => document.title && document.title !== 'Farmacy',
        { timeout: 10000 }
      ).catch(() => console.warn(`  ⚠️  Timeout esperando title personalizado, usando default`))

      // Esperar a que exista meta description
      await page.waitForSelector('meta[name="description"]', { state: 'attached', timeout: 5000 }).catch(() => {})

      // Pequeña pausa para que Helmet termine de procesar todos los tags
      await page.waitForTimeout(300)

      // Obtener el HTML renderizado completo
      const html = await page.content()

      // Guardar como nombre.html y nombre/index.html
      const filename = route.name === 'index' ? 'index.html' : `${route.name}.html`
      const distPath = join(DIST, filename)
      writeFileSync(distPath, html, 'utf-8')
      console.log(`  ✅ ${filename} (${(html.length / 1024).toFixed(1)} KB, title: "${await page.title()}")`)

      // También guardar como directorio/ para compatibilidad con Nginx try_files $uri/
      if (route.name !== 'index') {
        const dirPath = join(DIST, route.name)
        mkdirSync(dirPath, { recursive: true })
        writeFileSync(join(dirPath, 'index.html'), html, 'utf-8')
      }

      totalPrendered++
      await page.close()
    } catch (err) {
      console.error(`  ❌ Error pre-renderizando ${url}:`, err.message)
    }
  }

  // 5. (Opcional) Pre-renderizar productos populares + categorías si hay API disponible
  // NOTA: Durante Docker build (sin backend), este bloque falla gracefulmente via try/catch.
  //       Solo productos estáticos se pre-renderizan en la imagen Docker.
  //       Para deploy manual, generar sitemap + prerender productos ejecutando:
  //       node scripts/prerender.mjs --base https://farmacy.co
  let cantidadProductos = 0
  let cantidadCategorias = 0

  try {
    const apiUrl = `${BASE_URL.replace(/:\d+$/, ':3000')}/api/v1/productos/buscar?limite=30&ordenar=stock`
    console.log(`\n[prerender] Buscando productos populares desde API...`)
    const page = await context.newPage()
    const response = await page.goto(apiUrl, { waitUntil: 'networkidle', timeout: 10000 })

    if (response?.ok()) {
      const body = await response.text()
      const data = JSON.parse(body)
      const productos = data?.data ?? []
      cantidadProductos = productos.length

      console.log(`[prerender] → ${productos.length} productos encontrados`)

      for (const prod of productos.slice(0, 100)) { // Top 100
        const slug = prod.slug || prod.id
        const url = `${BASE_URL}/productos/${slug}`

        try {
          const prodPage = await context.newPage()
          await prodPage.goto(url, { waitUntil: 'networkidle', timeout: RENDER_TIMEOUT })
          await prodPage.waitForSelector('h1', { state: 'attached', timeout: 8000 })
          await prodPage.waitForTimeout(500)

          const html = await prodPage.content()
          const safeSlug = slugify(String(slug))
          const filename = `${safeSlug}.html`

          writeFileSync(join(DIST, filename), html, 'utf-8')

          // También en directorio/ para compatibilidad con Nginx
          const dirPath = join(DIST, 'productos', safeSlug)
          mkdirSync(dirPath, { recursive: true })
          writeFileSync(join(dirPath, 'index.html'), html, 'utf-8')

          console.log(`  ✅ ${slug} (${(html.length / 1024).toFixed(1)} KB)`)
          totalPrendered++
          await prodPage.close()
        } catch (err) {
          console.warn(`  ⚠️  Error en producto ${slug}: ${err.message}`)
        }
      }

      // ── Pre-renderizar páginas de categorías populares ──
      try {
        const catUrl = `${BASE_URL.replace(/:\d+$/, ':3000')}/api/v1/categorias`
        console.log(`[prerender] Buscando categorías...`)
        const catPage = await context.newPage()
        const catResponse = await catPage.goto(catUrl, { waitUntil: 'networkidle', timeout: 10000 })

        if (catResponse?.ok()) {
          const catBody = await catResponse.text()
          const catData = JSON.parse(catBody)
          const categorias = catData?.data ?? []
          cantidadCategorias = categorias.length
          const CATEGORIA_LIMIT = 15

          console.log(`[prerender] → ${categorias.length} categorías encontradas, pre-renderizando top ${CATEGORIA_LIMIT}`)

          for (const cat of categorias.slice(0, CATEGORIA_LIMIT)) {
            const slug = cat.slug || cat.nombre || cat.id
            const url = `${BASE_URL}/productos?categoria=${encodeURIComponent(cat.nombre || cat.id)}`

            try {
              const catProdPage = await context.newPage()
              await catProdPage.goto(url, { waitUntil: 'networkidle', timeout: RENDER_TIMEOUT })
              await catProdPage.waitForTimeout(300)

              const html = await catProdPage.content()
              const safeCatSlug = slugify(String(slug))

              const dirPath = join(DIST, 'categoria', safeCatSlug)
              mkdirSync(dirPath, { recursive: true })
              writeFileSync(join(dirPath, 'index.html'), html, 'utf-8')

              console.log(`  ✅ categoria/${safeCatSlug} (${(html.length / 1024).toFixed(1)} KB)`)
              totalPrendered++
              await catProdPage.close()
            } catch (err) {
              console.warn(`  ⚠️  Error en categoría ${slug}: ${err.message}`)
            }
          }
        } else {
          console.log(`  ⚠️  API de categorías no disponible (${catResponse?.status()}), saltando`)
        }

        await catPage.close()
      } catch (err) {
        console.log(`[prerender] ⚠️  API de categorías no disponible: ${err.message}`)
      }
    } else {
      console.log(`  ⚠️  API no disponible (${response?.status()}), saltando productos`)
    }

    await page.close()
  } catch (err) {
    console.log(`[prerender] ⚠️  API de productos no disponible: ${err.message}`)
  }

  // 6. Cerrar
  await browser.close()
  server.close()

  console.log(`\n[prerender] 🎯 ${totalPrendered} páginas pre-renderizadas → ${DIST}`)
  console.log(`[prerender] 📄 ${STATIC_ROUTES.length} estáticas, ${Math.min(cantidadProductos, 100)} productos, ${Math.min(cantidadCategorias, 15)} categorías`)
}

main().catch(err => {
  console.error('[prerender] Error fatal:', err)
  process.exit(1)
})
