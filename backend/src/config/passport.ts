import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { prisma } from './database'
import { env } from './env'
import { logger } from '../utils/logger'

export function configurePassport(): void {
  // ── Google OAuth2 ─────────────────────────────────────────
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackURL: env.GOOGLE_CALLBACK_URL!,
          scope: ['email', 'profile'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value
            if (!email) return done(new Error('No se obtuvo email de Google'))

            // Buscar o crear el cliente
            let cliente = await prisma.cliente.findUnique({ where: { email } })

            if (!cliente) {
              cliente = await prisma.cliente.create({
                data: {
                  nombre: profile.name?.givenName ?? 'Usuario',
                  apellido: profile.name?.familyName ?? 'Google',
                  email,
                  emailVerificado: true,
                  proveedorAuth: 'GOOGLE',
                  proveedorAuthId: profile.id,
                  autorizacionDatos: true,
                },
              })
              logger.info(`[Passport] Nuevo cliente via Google: ${email}`)
            }

            return done(null, cliente)
          } catch (err) {
            return done(err as Error)
          }
        }
      )
    )
    logger.info('[Passport] Estrategia Google configurada')
  } else {
    logger.warn('[Passport] Google OAuth no configurado — omitido')
  }

}