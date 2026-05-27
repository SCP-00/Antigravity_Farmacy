// ══════════════════════════════════════════════════════════
//  fixtures/auth.ts — Helpers de autenticación para E2E
//  Proporciona login programático vía API + storageState
// ══════════════════════════════════════════════════════════
import { request, type Page, type BrowserContext } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'

export interface Credentials {
  email: string
  password: string
}

export const CREDENTIALS = {
  admin:      { email: 'admin@farmacy.co',       password: 'Admin@1234' },
  farmaceuta: { email: 'farmaceuta@farmacy.co',  password: 'Farm@1234' },
  auxiliar:   { email: 'auxiliar@farmacy.co',    password: 'Aux@1234' },
  cliente:    { email: 'cliente@ejemplo.co',     password: 'Cliente@1234' },
} as const

/**
 * Realiza login de empleado vía API y guarda el storageState
 * en la context para persistir la sesión.
 */
export async function loginAdmin(
  context: BrowserContext,
  creds: Credentials = CREDENTIALS.admin,
): Promise<string> {
  const api = await request.newContext({ baseURL: BASE_URL.replace(':5173', ':3000') })
  const res = await api.post('/api/v1/auth/login', {
    data: { email: creds.email, password: creds.password },
  })

  if (!res.ok()) {
    const body = await res.text()
    throw new Error(`Login fallido (${res.status()}): ${body}`)
  }

  const json = await res.json()
  const token: string = json.data?.token ?? json.token

  // Establecer token en localStorage para que el frontend lo reconozca
  await context.addInitScript((t: string) => {
    localStorage.setItem('auth_token', t)
    localStorage.setItem('auth_login_ts', String(Date.now()))
  }, token)

  return token
}

/**
 * Realiza login de cliente vía API.
 */
export async function loginCliente(
  context: BrowserContext,
  creds: Credentials = CREDENTIALS.cliente,
): Promise<string> {
  const api = await request.newContext({ baseURL: BASE_URL.replace(':5173', ':3000') })
  const res = await api.post('/api/v1/auth-cliente/login', {
    data: { email: creds.email, password: creds.password },
  })

  if (!res.ok()) {
    const body = await res.text()
    throw new Error(`Login cliente fallido (${res.status()}): ${body}`)
  }

  const json = await res.json()
  const token: string = json.data?.token ?? json.token

  await context.addInitScript((t: string) => {
    localStorage.setItem('auth_cliente_token', t)
  }, token)

  return token
}

/**
 * Navega al dashboard admin esperando que cargue completamente.
 */
export async function gotoDashboard(page: Page) {
  await page.goto('/admin')
  await page.waitForURL('**/admin')
  // Esperar a que la app React hidrate
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
}

/**
 * Navega a la página de login admin y completa el formulario.
 */
export async function loginAdminForm(page: Page, creds: Credentials = CREDENTIALS.admin) {
  await page.goto('/admin/login')
  await page.waitForURL('**/admin/login')
  await page.waitForLoadState('networkidle')

  await page.fill('input[type="email"]', creds.email)
  await page.fill('input[type="password"]', creds.password)
  await page.click('button[type="submit"]')

  // Esperar redirección al dashboard
  await page.waitForURL('**/admin', { timeout: 15_000 })
  await page.waitForLoadState('networkidle')
}
