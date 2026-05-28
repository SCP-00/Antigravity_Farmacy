import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'
import { env } from '../config/env'

const { combine, timestamp, colorize, printf, json } = winston.format

const devFormat = printf(({ level, message, timestamp }) =>
  `${timestamp} [${level}] ${message}`)

// Directorio de logs (desde la raíz del backend)
const LOG_DIR = path.resolve(__dirname, '../../logs')

// Console transport (siempre activo)
const consoleTransport = new winston.transports.Console({
  format: combine(
    colorize(),
    timestamp({ format: 'HH:mm:ss' }),
    env.NODE_ENV === 'production' ? json() : devFormat
  ),
})

// File transport con rotación diaria (solo en producción o si LOG_FILE=true)
const fileTransport = env.NODE_ENV === 'production' || process.env.LOG_FILE === 'true'
  ? new DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'farmacy-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',       // Rotar cuando llegue a 20MB
      maxFiles: '30d',       // Conservar 30 días
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        json()
      ),
    })
  : null

const transports: winston.transport[] = [consoleTransport]
if (fileTransport) transports.push(fileTransport)

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  transports,
})