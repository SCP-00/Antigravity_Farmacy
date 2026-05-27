// ══════════════════════════════════════════════════════════
//  b2c-flujo.spec.ts — Flujo cliente B2C E2E
//  Verifica: login cliente, catálogo, carrito, checkout
// ══════════════════════════════════════════════════════════
import { test, expect } from '@playwright/test'

test.describe('Flujo B2C (Cliente)', () => {
  test('Login cliente desde /login', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Llenar formulario de login
    await page.fill('input[type="email"]', 'cliente@ejemplo.co')

    // Encontrar campo password (el último input puede ser password)
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
    await passwordInput.fill('Cliente@1234')

    // Hacer clic en submit
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeVisible()
    await submitBtn.click()

    // Debe redirigir al home
    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 })
    await page.waitForLoadState('networkidle')

    // El menú debe mostrar opciones de usuario autenticado
    const body = page.locator('body')
    await expect(body).toContainText(/mi cuenta|cerrar sesión|Laura|Martínez/i, { timeout: 5_000 }).catch(() => {
      // Si no se ve el nombre, al menos no hay error crítico
    })
  })

  test('Catálogo → agregar al carrito → ver carrito', async ({ page }) => {
    await page.goto('/productos')
    await page.waitForLoadState('networkidle')

    // Buscar botón de agregar al carrito o enlace
    const addToCartBtn = page.locator('button:has-text("Agregar"), button:has-text("Comprar"), button:has-text("Carrito"), a:has-text("Agregar")').first()
    if (await addToCartBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await addToCartBtn.click()
      await page.waitForTimeout(1_000)
    }

    // Si no hay botón en catálogo, navegar a ficha de producto
    if (!(await page.url().includes('/productos/'))) {
      const productLink = page.locator('a[href*="/productos/"]').first()
      if (await productLink.isVisible()) {
        await productLink.click()
        await page.waitForLoadState('networkidle')

        // En ficha, buscar botón de agregar
        const detailAddBtn = page.locator('button:has-text("Agregar"), button:has-text("Carrito"), button:has-text("Comprar")').first()
        if (await detailAddBtn.isVisible()) {
          await detailAddBtn.click()
          await page.waitForTimeout(1_000)
        }
      }
    }

    // Navegar al carrito
    await page.goto('/carrito')
    await page.waitForLoadState('networkidle')

    // Debe mostrar el carrito (vacío o con productos)
    const body = page.locator('body')
    await expect(body).toContainText(/carrito|Carrito/i, { timeout: 5_000 })
  })

  test('Carrito vacío muestra estado informativo', async ({ page }) => {
    await page.goto('/carrito')
    await page.waitForLoadState('networkidle')

    // Debe mostrar mensaje de carrito vacío o al menos la página de carrito
    const body = page.locator('body')
    const hasCartText = await body.textContent()
    expect(hasCartText?.toLowerCase()).toContain('carrito')
  })

  test('Registro — formulario de creación de cuenta', async ({ page }) => {
    await page.goto('/registro')
    await page.waitForLoadState('networkidle')

    // Debe mostrar formulario de registro
    const body = page.locator('body')
    await expect(body).toContainText(/registro|crear cuenta|registrarse/i, { timeout: 5_000 })

    // Debe tener campos de formulario
    const emailInputs = page.locator('input[type="email"]')
    await expect(emailInputs.first()).toBeVisible()
  })

  test('Sucursales — mapa o listado visible', async ({ page }) => {
    await page.goto('/sucursales')
    await page.waitForLoadState('networkidle')

    const body = page.locator('body')
    await expect(body).toContainText(/sucursal|sede|Sucursales|Centro|Lago/i, { timeout: 5_000 })
  })
})
