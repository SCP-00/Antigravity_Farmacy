import winston from 'winston'
import { env } from '../config/env'

const { combine, timestamp, colorize, printf, json } = winston.format

const devFormat = printf(({ level, message, timestamp }) =>
  `${timestamp} [${level}] ${message}`)

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        env.NODE_ENV === 'production' ? json() : devFormat
      ),
    }),
  ],
})