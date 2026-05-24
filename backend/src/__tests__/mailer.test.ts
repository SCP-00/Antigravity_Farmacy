import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock nodemailer ──────────────────────────────────────
const mockSendMail = vi.hoisted(() => vi.fn())

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({ sendMail: mockSendMail }),
  },
  createTransport: vi.fn().mockReturnValue({ sendMail: mockSendMail }),
}))

vi.mock('../utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('emailTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('verificarEmail genera HTML con botón de verificación', async () => {
    const { emailTemplates } = await import('../config/mailer')
    const html = emailTemplates.verificarEmail('Juan', 'https://test.com/verify?token=abc')
    expect(html).toContain('Juan')
    expect(html).toContain('https://test.com/verify?token=abc')
    expect(html).toContain('Verificar mi correo')
    expect(html).toContain('Farmacy')
    expect(html).toContain('</html>')
  })

  it('resetPassword genera HTML con enlace', async () => {
    const { emailTemplates } = await import('../config/mailer')
    const html = emailTemplates.resetPassword('María', 'https://test.com/reset?token=xyz')
    expect(html).toContain('María')
    expect(html).toContain('https://test.com/reset?token=xyz')
    expect(html).toContain('Restablecer contraseña')
  })

  it('confirmacionCompra genera HTML con número de pedido y total', async () => {
    const { emailTemplates } = await import('../config/mailer')
    const html = emailTemplates.confirmacionCompra('Carlos', 123, 50000)
    expect(html).toContain('Carlos')
    expect(html).toContain('#PED-000123')
    expect(html).toContain('50.000')
    expect(html).toContain('Ver mis pedidos')
  })

  it('alertaStockMinimo genera HTML con alerta de stock', async () => {
    const { emailTemplates } = await import('../config/mailer')
    const html = emailTemplates.alertaStockMinimo('Amoxicilina', 5, 'Sede Central')
    expect(html).toContain('Amoxicilina')
    expect(html).toContain('Sede Central')
    expect(html).toContain('5 unidades')
    expect(html).toContain('Crear orden de compra')
  })
})

describe('sendEmail()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('envía correo exitosamente', async () => {
    mockSendMail.mockResolvedValue({ accepted: ['test@test.com'] })

    const { sendEmail, emailTemplates } = await import('../config/mailer')
    const html = emailTemplates.verificarEmail('Test', 'https://test.com/v')
    await sendEmail({ to: 'test@test.com', subject: 'Test', html })

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.any(String),
        to: 'test@test.com',
        subject: 'Test',
        html,
      })
    )
  })

  it('maneja error al enviar', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP error'))

    const { sendEmail, emailTemplates } = await import('../config/mailer')
    const html = emailTemplates.verificarEmail('Test', 'https://test.com/v')
    await sendEmail({ to: 'test@test.com', subject: 'Test', html })

    // No debe lanzar error, solo loggearlo
    const { logger } = await import('../utils/logger')
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('SMTP error')
    )
  })
})
