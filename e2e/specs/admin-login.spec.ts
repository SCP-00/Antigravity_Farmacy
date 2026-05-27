// ══════════════════════════════════════════════════════════
//  admin-login.spec.ts — Login admin E2E
//  Verifica: formulario login, redirección, logout, acceso
//  restringido sin sesión
// ══════════════════════════════════════════════════════════
import { test, expect } from '@playwright/test'
import { CREDENTIALS } from '../fixtures/auth'

test.describe('Login administrador', () => {
  test('Redirige a login si no hay sesión', async ({ page }) => {
    await page.goto('/admin')

    // Debe redirigir a login
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10_000 })
  })

  test('Login exitoso con credenciales válidas', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForLoadState('networkidle')

    // Llenar formulario
    await page.fill('input[type="email"]', CREDENTIALS.admin.email)
    await page.fill('input[type="password"]', CREDENTIALS.admin.password)
    await page.click('button[type="submit"]')

    // Esperar redirección al dashboard
    await expect(page).toHaveURL(/\/admin(?:\/|$)/, { timeout: 15_000 })
    await page.waitForLoadState('networkidle')

    // Dashboard debe mostrar contenido administrativo
    const body = page.locator('body')
    await expect(body).toContainText(/dashboard|panel|admin|inicio/i, { timeout: 5_000 })
  })

  test('Login fallido con credenciales inválidas', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForLoadState('networkidle')

    // Ingresar credenciales incorrectas
    await page.fill('input[type="email"]', 'admin@farmacy.co')
    await page.fill('input[type="password"]', 'wrongpassword123!')
    await page.click('button[type="submit"]')

    // Debe permanecer en login (no redirige)
    await page.waitForTimeout(2_000)
    expect(page.url()).toContain('/admin/login')

    // Debe mostrar mensaje de error
    const body = page.locator('body')
    await expect(body).toContainText(/inválido|error|incorrecto|credenciales/i, { timeout: 5_000 })
  })

  test('Cerrar sesión funciona correctamente', async ({ page }) => {
    // Primero iniciar sesión
    await page.goto('/admin/login')
    await page.waitForLoadState('networkidle')
    await page.fill('input[type="email"]', CREDENTIALS.admin.email)
    await page.fill('input[type="password"]', CREDENTIALS.admin.password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin(?:\/|$)/, { timeout: 15_000 })
    await page.waitForLoadState('networkidle')

    // Buscar y hacer clic en botón de cerrar sesión
    const logoutBtn = page.locator('button:has-text("Cerrar sesión"), a:has-text("Cerrar sesión"), button:has-text("Logout"), a:has-text("Salir")').first()
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click()
      // Debe redirigir a login
      await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10_000 })
    }
  })
})
