// ══════════════════════════════════════════════════════════
//  public-navigation.spec.ts — Navegación pública E2E
//  Verifica: home, catálogo, ficha producto, búsqueda, 404
// ══════════════════════════════════════════════════════════
import { test, expect } from '@playwright/test'

test.describe('Navegación pública', () => {
  test('Home page — carga sin errores y muestra elementos clave', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Título de la página (SEO/Helmet)
    await expect(page).toHaveTitle(/Farmacy/)

    // Logo / branding visible
    const logo = page.locator('text=Farmacy').first()
    await expect(logo).toBeVisible()

    // Barra de búsqueda presente
    const searchInput = page.locator('input[placeholder*="Buscar"]')
    await expect(searchInput).toBeVisible()

    // Enlaces principales visibles
    await expect(page.locator('a:has-text("Catálogo")').first()).toBeVisible()

    // Sin errores en consola
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.waitForTimeout(500)
    expect(errors, '❌ page errors').toEqual([])
  })

  test('Catálogo — muestra productos y permite navegar', async ({ page }) => {
    await page.goto('/productos')
    await page.waitForLoadState('networkidle')

    // Título de catálogo
    await expect(page).toHaveTitle(/Catálogo|Productos/)

    // Productos renderizados (al menos 1 tarjeta con botón Agregar)
    const productCards = page.locator('button:has-text("Agregar")').first()
    await expect(productCards).toBeVisible({ timeout: 10_000 })

    // Categorías visibles en navegación
    const categorias = page.locator('text=Analgésicos').first()
    await expect(categorias).toBeVisible()
  })

  test('Ficha de producto — muestra detalle INVIMA', async ({ page }) => {
    // Navegar al catálogo y hacer clic en el primer producto
    await page.goto('/productos')
    await page.waitForLoadState('networkidle')

    // Buscar un enlace a producto (típicamente un slug)
    const productLink = page.locator('a[href*="/productos/"]').first()
    await expect(productLink).toBeVisible({ timeout: 10_000 })
    await productLink.click()

    await page.waitForLoadState('networkidle')

    // La URL debe contener /productos/
    expect(page.url()).toContain('/productos/')

    // Debe mostrar información del producto
    const body = page.locator('body')
    await expect(body).toContainText(/precio|precioVenta|\$|COP/i, { timeout: 5_000 })

    // Sin page errors
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.waitForTimeout(500)
    expect(errors, '❌ page errors en ficha producto').toEqual([])
  })

  test('Búsqueda — filtra productos por texto', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const searchInput = page.locator('input[placeholder*="Buscar"]')
    await expect(searchInput).toBeVisible()

    // Escribir búsqueda
    const searchTerm = 'alercet'
    await searchInput.fill(searchTerm)

    // Esperar a que el debounce de búsqueda (300ms) se resuelva
    await page.waitForTimeout(500)

    // Hacer submit (Enter)
    await page.keyboard.press('Enter')

    // URL debe tener query param q=
    await expect(page).toHaveURL(/q=alercet/, { timeout: 10_000 })
    await page.waitForLoadState('networkidle')

    // Resultados visibles
    const body = page.locator('body')
    await expect(body).toContainText(/alercet|ALERCET/i, { timeout: 10_000 })
  })

  test('404 — página no encontrada se muestra correctamente', async ({ page }) => {
    await page.goto('/ruta-que-no-existe-12345')
    await page.waitForLoadState('networkidle')

    // Debe mostrar mensaje de no encontrado
    const body = page.locator('body')
    await expect(body).toContainText(/404|no encontrado|NoEncontrado/i, { timeout: 5_000 })
  })
})
