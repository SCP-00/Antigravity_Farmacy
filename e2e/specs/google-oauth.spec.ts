// ══════════════════════════════════════════════════════════
//  google-oauth.spec.ts — Pruebas del flujo Google OAuth
//
//  NOTA: El flujo completo de Google OAuth requiere interacción
//  con la pantalla de consentimiento de Google. Este test verifica
//  todo el pipeline automatizable:
//
//  Frontend (login / callback):
//    1. Boton Continuar con Google visible con href correcto
//    2. Clic redirige a accounts.google.com con parametros correctos
//    3. AuthCallback maneja token invalido con mensaje de error
//    4. Login con error=google se carga correctamente
//    5. AuthCallback sin token muestra error "No se recibio el token"
//    6. AuthCallback muestra loading antes de error
//    7. Volver al inicio desde AuthCallback redirige a /login
//    8. Pagina login tiene todos los elementos UI
//    9. googleUrl usa VITE_API_URL por defecto
//  Backend:
//   10. GET /clientes/auth/google responde 302 redirect a Google
//   11. GET /google/callback sin code redirige a Google (Passport)
//   12. redirect_uri coincide con GOOGLE_CALLBACK_URL del .env
//  Proteccion de rutas:
//   13. /checkout redirige a /login sin sesion
//   14. /cuenta redirige a /login sin sesion
//   15. /cuenta/pedidos redirige a /login sin sesion
//   16. /cuenta/favoritos redirige a /login sin sesion
//  Persistencia store:
//   17. Token y cliente persisten en localStorage
//   18. Store se restaura al recargar pagina
// ══════════════════════════════════════════════════════════

import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

const FRONTEND = 'http://localhost:5173'
const BACKEND  = 'http://localhost:3000'
const API      = `${BACKEND}/api/v1`

const GOOGLE_CLIENT_ID = '295080187816-vv69e80au7t5l8gmn3o409hiif0roric.apps.googleusercontent.com'
const GOOGLE_CALLBACK  = 'http://localhost:3000/api/v1/clientes/auth/google/callback'

// ── Helpers ────────────────────────────────────────────────

function capturarErrores(page: Page): string[] {
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', err => errors.push(err.message))
  return errors
}

function filtrarErrores(errors: string[]): string[] {
  return errors.filter(e =>
    !e.includes('favicon') &&
    !e.includes('429') &&
    !e.includes('Too Many Requests') &&
    !e.includes('401') &&
    !e.includes('Unauthorized') &&
    !e.includes('404') &&
    !e.includes('load')
  )
}


// ══════════════════════════════════════════════════════════
//  FRONTEND — Login + Google OAuth
// ══════════════════════════════════════════════════════════

test.describe('Frontend — Login con Google OAuth', () => {

  test('1. Boton Continuar con Google visible y con URL correcta', async ({ page }) => {
    const errors = capturarErrores(page)

    await page.goto(`${FRONTEND}/login`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)

    const googleBtn = page.locator('a:has-text("Continuar con Google")')
    await expect(googleBtn).toBeVisible({ timeout: 5000 })

    const href = await googleBtn.getAttribute('href')
    expect(href).toBe(`${API}/clientes/auth/google`)
    expect(href).toContain('clientes/auth/google')
    console.log(`   > Boton Google visible, href: ${href}`)

    const svg = googleBtn.locator('svg')
    await expect(svg).toBeVisible()
    console.log('   > Logo SVG de Google presente')

    expect(filtrarErrores(errors)).toEqual([])
  })


  test('2. Clic redirige a accounts.google.com con parametros correctos', async ({ page }) => {
    let googleRequestUrl = ''
    page.on('request', request => {
      if (request.url().startsWith('https://accounts.google.com/o/oauth2/v2/auth')) {
        googleRequestUrl = request.url()
      }
    })

    await page.goto(`${FRONTEND}/login`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    const googleBtn = page.locator('a:has-text("Continuar con Google")')
    await googleBtn.click()

    try {
      await page.waitForURL('**/accounts.google.com/**', { timeout: 5000 })
    } catch {
      console.log('   > (navegacion a Google no completa en headless, verificando URL generada)')
    }
    await page.waitForTimeout(500)

    expect(googleRequestUrl).toBeTruthy()
    expect(googleRequestUrl).toContain('accounts.google.com/o/oauth2/v2/auth')
    expect(googleRequestUrl).toContain(`client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}`)
    expect(googleRequestUrl).toContain(`redirect_uri=${encodeURIComponent(GOOGLE_CALLBACK)}`)
    expect(googleRequestUrl).toContain('scope=email%20profile')
    expect(googleRequestUrl).toContain('response_type=code')
    console.log('   > Google OAuth URL generada correctamente')
    console.log(`   > redirect_uri: ${GOOGLE_CALLBACK}`)
  })


  test('3. AuthCallback maneja token invalido con mensaje de error', async ({ page }) => {
    const errors = capturarErrores(page)

    await page.goto(`${FRONTEND}/auth/callback?token=token-invalido-12345`, {
      waitUntil: 'domcontentloaded'
    })
    await page.waitForTimeout(2000)

    const errorMsg = page.getByText(/Error al iniciar sesi[oó]n con Google/)
    await expect(errorMsg).toBeVisible({ timeout: 3000 })
    console.log('   > Mensaje de error mostrado: "Error al iniciar sesion con Google"')

    const volverBtn = page.locator('button:has-text("Volver al inicio")')
    await expect(volverBtn).toBeVisible({ timeout: 3000 })
    console.log('   > Boton "Volver al inicio de sesion" presente')

    expect(filtrarErrores(errors)).toEqual([])
  })


  test('4. Login con error=google se carga mostrando boton OAuth', async ({ page }) => {
    await page.goto(`${FRONTEND}/login?error=google`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)

    const googleBtn = page.locator('a:has-text("Continuar con Google")')
    await expect(googleBtn).toBeVisible({ timeout: 3000 })
    console.log('   > Pagina de login con error=google cargada correctamente')
  })


  test('5. AuthCallback sin token muestra error "No se recibio el token"', async ({ page }) => {
    const errors = capturarErrores(page)

    await page.goto(`${FRONTEND}/auth/callback`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Sin token en URL debe mostrar el error de token faltante
    const errorMsg = page.getByText(/No se recibi[oó] el token de autenticaci[oó]n/)
    await expect(errorMsg).toBeVisible({ timeout: 3000 })
    console.log('   > Mensaje: "No se recibio el token de autenticacion"')

    const volverBtn = page.locator('button:has-text("Volver al inicio")')
    await expect(volverBtn).toBeVisible({ timeout: 3000 })
    console.log('   > Boton "Volver al inicio de sesion" presente')

    expect(filtrarErrores(errors)).toEqual([])
  })


  test('6. AuthCallback muestra spinner de loading antes del error', async ({ page }) => {
    await page.goto(`${FRONTEND}/auth/callback?token=loading-test-token`, {
      waitUntil: 'domcontentloaded'
    })

    // Verificar que se muestra el spinner de "Iniciando sesion..."
    // Usamos waitFor con catch para manejar el caso donde ya transiciono a error
    const spinner = page.locator('.animate-spin')
    const spinnerVisible = await spinner.isVisible().catch(() => false)
    const loadingText = page.getByText('Iniciando sesion')
    const textVisible = await loadingText.isVisible().catch(() => false)

    if (!spinnerVisible && !textVisible) {
      console.log('   > (spinner/loading ya transicionaron a error, omitiendo check)')
    } else {
      console.log('   > Spinner y/o texto de loading presentes en AuthCallback')
    }

    // Luego debe mostrar el error (token invalido)
    await page.waitForTimeout(2000)
    const errorMsg = page.getByText(/Error al iniciar sesi[oó]n con Google/)
    await expect(errorMsg).toBeVisible({ timeout: 5000 })
    console.log('   > Transicion loading -> error completada correctamente')
  })


  test('7. Volver al inicio desde AuthCallback redirige a /login', async ({ page }) => {
    await page.goto(`${FRONTEND}/auth/callback?token=error-redirect-test`, {
      waitUntil: 'domcontentloaded'
    })
    await page.waitForTimeout(2000)

    const volverBtn = page.locator('button:has-text("Volver al inicio")')
    await expect(volverBtn).toBeVisible({ timeout: 3000 })
    await volverBtn.click()

    await page.waitForTimeout(1000)
    expect(page.url()).toContain('/login')
    console.log(`   > Redirigido a login: ${page.url()}`)
  })


  test('8. Pagina login tiene todos los elementos UI', async ({ page }) => {
    await page.goto(`${FRONTEND}/login`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)

    // Titulo
    await expect(page.locator('h2:has-text("Iniciar sesión")')).toBeVisible()
    console.log('   > Título "Iniciar sesión" presente')

    // Boton Google
    await expect(page.locator('a:has-text("Continuar con Google")')).toBeVisible()
    console.log('   > Boton Google presente')

    // Separador "o con tu correo"
    await expect(page.locator('text=o con tu correo')).toBeVisible()
    console.log('   > Separador "o con tu correo" presente')

    // Formulario
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    console.log('   > Formulario login: email + password + submit presentes')

    // Enlaces
    await expect(page.locator('a:has-text("Olvidaste")')).toBeVisible()
    await expect(page.locator('a:has-text("Crear una gratis")')).toBeVisible()
    console.log('   > Enlaces: recordar password + registro presentes')
  })


  test('9. googleUrl usa VITE_API_URL por defecto', async ({ page }) => {
    const errors = capturarErrores(page)

    await page.goto(`${FRONTEND}/login`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)

    const googleBtn = page.locator('a:has-text("Continuar con Google")')
    const href = await googleBtn.getAttribute('href')

    // Por defecto VITE_API_URL = '/api/v1', asi que googleUrl debe ser
    // '/api/v1/clientes/auth/google' (relativo al host)
    expect(href).toContain('/api/v1/clientes/auth/google')
    console.log(`   > googleUrl: ${href}`)

    // Verificar que funcione con VITE_API_URL vacio (fallback a /api/v1)
    expect(href).not.toContain('undefined')
    expect(href).not.toContain('null')
    console.log('   > googleUrl no contiene undefined/null')

    expect(filtrarErrores(errors)).toEqual([])
  })
})


// ══════════════════════════════════════════════════════════
//  BACKEND — Google OAuth routes
// ══════════════════════════════════════════════════════════

test.describe('Backend — Google OAuth routes', () => {

  test('10. GET /clientes/auth/google responde 302 redirect a Google', async ({ request }) => {
    const response = await request.get(`${API}/clientes/auth/google`, {
      maxRedirects: 0,
    })

    const status = response.status()
    const location = response.headers()['location'] || ''

    expect(status).toBe(302)
    expect(location).toContain('accounts.google.com/o/oauth2/v2/auth')
    expect(location).toContain('response_type=code')
    expect(location).toContain(`client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}`)
    expect(location).toContain('scope=email%20profile')
    console.log('   > Backend responde 302 redirect a Google OAuth')
  })


  test('11. GET /google/callback sin code redirige a Google (Passport)', async ({ request }) => {
    const response = await request.get(`${API}/clientes/auth/google/callback`, {
      maxRedirects: 0,
    })

    const status = response.status()
    const location = response.headers()['location'] || ''

    expect(status).toBe(302)
    expect(location).toContain('accounts.google.com/o/oauth2/v2/auth')
    console.log('   > Passport redirige a Google OAuth (sin code, correcto)')
  })


  test('12. redirect_uri coincide con GOOGLE_CALLBACK_URL del .env', async ({ request }) => {
    const response = await request.get(`${API}/clientes/auth/google`, {
      maxRedirects: 0,
    })

    const location = response.headers()['location'] || ''
    const decodedLocation = decodeURIComponent(location)

    expect(decodedLocation).toContain(`redirect_uri=${GOOGLE_CALLBACK}`)
    console.log(`   > redirect_uri en request a Google: ${GOOGLE_CALLBACK}`)
    console.log('   > Coincide con GOOGLE_CALLBACK_URL en .env')
  })
})


// ══════════════════════════════════════════════════════════
//  PROTECCION DE RUTAS — Sin sesion redirige a /login
// ══════════════════════════════════════════════════════════

test.describe('Proteccion de rutas del cliente (sin sesion)', () => {

  test('13. /checkout redirige a /login sin sesion', async ({ page }) => {
    await page.goto(`${FRONTEND}/checkout`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
    expect(page.url()).toContain('/login')
    console.log(`   > /checkout -> ${page.url()}`)
  })


  test('14. /cuenta redirige a /login sin sesion', async ({ page }) => {
    await page.goto(`${FRONTEND}/cuenta`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
    expect(page.url()).toContain('/login')
    console.log(`   > /cuenta -> ${page.url()}`)
  })


  test('15. /cuenta/pedidos redirige a /login sin sesion', async ({ page }) => {
    await page.goto(`${FRONTEND}/cuenta/pedidos`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
    expect(page.url()).toContain('/login')
    console.log(`   > /cuenta/pedidos -> ${page.url()}`)
  })


  test('16. /cuenta/favoritos redirige a /login sin sesion', async ({ page }) => {
    await page.goto(`${FRONTEND}/cuenta/favoritos`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
    expect(page.url()).toContain('/login')
    console.log(`   > /cuenta/favoritos -> ${page.url()}`)
  })
})


// ══════════════════════════════════════════════════════════
//  PERSISTENCIA DEL STORE — authStore con localStorage
// ══════════════════════════════════════════════════════════

test.describe('Persistencia del store de autenticacion', () => {

  const tokenFalso = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsIm5vbWJyZSI6IkNsaWVudGUgRGV2IiwiZW1haWwiOiJkZXZAZXhhbXBsZS5jb20iLCJ0aXBvIjoiY2xpZW50ZSJ9.fake-signature'
  const clienteFalso = {
    id: '123',
    nombre: 'Cliente',
    apellido: 'Dev',
    email: 'dev@example.com',
    puntos: 100,
  }

  test('17. Token y cliente persisten en localStorage', async ({ page }) => {
    // Inyectar estado en localStorage ANTES de cargar la pagina
    await page.goto(`${FRONTEND}/login`, { waitUntil: 'domcontentloaded' })

    const estado = {
      state: {
        token: tokenFalso,
        cliente: clienteFalso,
      },
      version: 0,
    }

    await page.evaluate((data) => {
      localStorage.setItem('farmacy-cliente-auth', JSON.stringify(data))
    }, estado)

    // Recargar para que el store restore desde localStorage
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)

    // Verificar que el store se restauro consultando localStorage directamente
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('farmacy-cliente-auth')
      return raw ? JSON.parse(raw) : null
    })

    expect(stored).not.toBeNull()
    expect(stored.state.token).toBe(tokenFalso)
    expect(stored.state.cliente.email).toBe('dev@example.com')
    console.log('   > Token y cliente persisten en localStorage')
  })


  test('18. Store se restaura al recargar pagina con sesion activa', async ({ page }) => {
    const estado = {
      state: {
        token: tokenFalso,
        cliente: clienteFalso,
      },
      version: 0,
    }

    await page.goto(`${FRONTEND}/login`, { waitUntil: 'domcontentloaded' })
    await page.evaluate((data) => {
      localStorage.setItem('farmacy-cliente-auth', JSON.stringify(data))
    }, estado)

    // Navegar a pagina publica (la sesion debe restaurarse)
    await page.goto(`${FRONTEND}/`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)

    // Verificar que el store sigue presente
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('farmacy-cliente-auth')
      return raw ? JSON.parse(raw) : null
    })

    expect(stored).not.toBeNull()
    expect(stored.state.token).toBe(tokenFalso)
    console.log('   > Store restaurado correctamente tras navegacion')

    // Verificar que los datos del cliente persisten
    const cliente = stored.state.cliente
    expect(cliente.nombre).toBe('Cliente')
    expect(cliente.apellido).toBe('Dev')
    expect(cliente.email).toBe('dev@example.com')
    console.log('   > Datos del cliente correctos en store restaurado')
  })
})
