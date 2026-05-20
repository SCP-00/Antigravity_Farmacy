import { z } from 'zod'
import dotenv from 'dotenv'
import path from 'path'

// Carga el .env desde la raíz del monorepo
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const envSchema = z.object({
  // Servidor
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  API_PREFIX: z.string().default('/api/v1'),

  // Base de datos
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
  DIRECT_URL: z.string().optional(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT Empleados
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // JWT Clientes
  JWT_CLIENTE_SECRET: z.string().min(32),
  JWT_CLIENTE_EXPIRES_IN: z.string().default('30d'),

  // OAuth Google
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  // OAuth Facebook
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  FACEBOOK_CALLBACK_URL: z.string().optional(),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('Farmacy <no-reply@farmacy.co>'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Wompi
  WOMPI_PUBLIC_KEY: z.string().optional(),
  WOMPI_PRIVATE_KEY: z.string().optional(),
  WOMPI_EVENTS_SECRET: z.string().optional(),
  WOMPI_BASE_URL: z.string().default('https://sandbox.wompi.co/v1'),

  // Stripe
  STRIPE_PUBLIC_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // MercadoPago
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADOPAGO_PUBLIC_KEY: z.string().optional(),

  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Rate limit
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX: z.string().default('100'),
  RATE_LIMIT_AUTH_MAX: z.string().default('10'),

  // Logs
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('debug'),

  // Horario chatbot
  HORARIO_INICIO: z.string().default('08:00'),
  HORARIO_FIN: z.string().default('18:00'),
  HORARIO_TIMEZONE: z.string().default('America/Bogota'),
  HORARIO_DIAS: z.string().default('1,2,3,4,5'),

  // Info farmacia
  FARMACIA_NOMBRE: z.string().default('Farmacy'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('\n❌ Error en variables de entorno:')
  parsed.error.issues.forEach(issue => {
    console.error(`   ${issue.path.join('.')}: ${issue.message}`)
  })
  console.error('\n💡 Copia .env.example como .env y rellena los valores\n')
  process.exit(1)
}

export const env = parsed.data
export type Env = typeof env