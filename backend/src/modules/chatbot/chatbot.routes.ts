// ══════════════════════════════════════════════════════════
//  MÓDULO CHATBOT
//  POST /api/v1/chatbot          (público)
//  GET  /api/v1/chatbot/horario  (¿está el asesor disponible?)
// ══════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express'
import { prisma } from '../../config/database'
import { responder } from '../../utils/respuesta.utils'
import { env } from '../../config/env'
import { logger } from '../../utils/logger'

export const chatbotRouter: Router = Router()

// ── FAQ estáticas ─────────────────────────────────────────
const FAQ: Array<{ patrones: string[]; respuesta: string }> = [
  {
    patrones: ['hola', 'buenas', 'buenos días', 'buenas tardes', 'buenas noches', 'hey', 'hi'],
    respuesta: '¡Hola! 👋 Bienvenido a **Farmacy**. Puedo ayudarte a:\n• Consultar disponibilidad de medicamentos\n• Ver horarios y sedes\n• Información sobre domicilios\n\n¿En qué te puedo ayudar?',
  },
  {
    patrones: ['horario', 'hora', 'abren', 'cierran', 'atienden', 'abierto', 'cerrado'],
    respuesta: '🕐 **Horarios de atención:**\n• Lunes a Sábado: 7:00 AM – 9:00 PM\n• Domingos y festivos: 8:00 AM – 6:00 PM\n\n¿Necesitas saber la ubicación de nuestras sedes?',
  },
  {
    patrones: ['sede', 'sucursal', 'dirección', 'ubicación', 'dónde', 'donde', 'local'],
    respuesta: '📍 **Nuestras sedes:**\n\n🏥 **Sede Centro**\nCarrera 8 #22-45, Pereira\n📞 (606) 335-0001\n\n🏥 **Sede El Lago**\nCalle 15 #11-20, Pereira\n📞 (606) 335-0002\n\n¿Te ayudo con algo más?',
  },
  {
    patrones: ['domicilio', 'envío', 'delivery', 'despacho', 'llevar a casa', 'entregar'],
    respuesta: '🛵 **Servicio de domicilios:**\n• Disponible dentro de Pereira\n• Pedido mínimo: $20,000\n• Tiempo estimado: 30–45 minutos\n• Horario: igual al de atención en sede\n\nPara pedir a domicilio, usa nuestra tienda en línea o llámanos.',
  },
  {
    patrones: ['fórmula', 'receta', 'médica', 'formulado', 'rx', 'prescripción'],
    respuesta: '📋 **Medicamentos con fórmula médica:**\n\nPara medicamentos RX necesitas presentar tu fórmula médica vigente en cualquiera de nuestras sedes. **No realizamos despacho de medicamentos con fórmula sin receta**.\n\n> ⚕️ *Nuestro chatbot no puede orientarte sobre medicamentos específicos, diagnósticos ni tratamientos. Consulta siempre con un profesional de la salud.*',
  },
  {
    patrones: ['precio', 'costo', 'vale', 'cuánto', 'cuanto', 'valor'],
    respuesta: 'Para consultar el precio de un medicamento específico, dime su nombre y te digo si está disponible y cuánto cuesta. 💊',
  },
  {
    patrones: ['gracias', 'muchas gracias', 'thank', 'ok gracias', 'listo', 'perfecto'],
    respuesta: '😊 ¡Con gusto! Estoy aquí si necesitas algo más. ¡Que tengas un excelente día!',
  },
  {
    patrones: ['asesor', 'humano', 'persona', 'hablar con alguien', 'empleado', 'farmacéuta'],
    respuesta: '__ESCALAR__', // Señal especial para el código
  },
]

// ── Verificar horario laboral ─────────────────────────────
function estaEnHorarioLaboral(): boolean {
  const tz = env.HORARIO_TIMEZONE
  const diasConf = env.HORARIO_DIAS.split(',').map(Number)  // [1,2,3,4,5]
  const [hIni, mIni] = env.HORARIO_INICIO.split(':').map(Number)
  const [hFin, mFin] = env.HORARIO_FIN.split(':').map(Number)

  const ahora = new Date()
  const enBogota = new Date(ahora.toLocaleString('en-US', { timeZone: tz }))
  const diaSemana = enBogota.getDay() === 0 ? 7 : enBogota.getDay() // 1=Lun...7=Dom
  const minutosDia = enBogota.getHours() * 60 + enBogota.getMinutes()
  const minInicio = hIni * 60 + mIni
  const minFin = hFin * 60 + mFin

  return diasConf.includes(diaSemana) && minutosDia >= minInicio && minutosDia < minFin
}

// ── GET /horario ──────────────────────────────────────────
chatbotRouter.get('/horario', (_req: Request, res: Response) => {
  const disponible = estaEnHorarioLaboral()
  return responder.ok(res, {
    disponible,
    mensaje: disponible
      ? 'Un asesor está disponible ahora'
      : `Atención humana disponible Lun–Vie de ${env.HORARIO_INICIO} a ${env.HORARIO_FIN}`,
  })
})

// ── POST / — Procesar mensaje ─────────────────────────────
chatbotRouter.post('/', async (req: Request, res: Response) => {
  const { mensaje = '', sessionToken } = req.body
  const msg = mensaje.trim().toLowerCase()

  if (!msg) return responder.error(res, 'Mensaje vacío')

  // ── 1. Revisar FAQ ─────────────────────────────────────
  for (const faq of FAQ) {
    const coincide = faq.patrones.some(p => msg.includes(p))
    if (coincide) {
      // Manejo especial: escalar a humano
      if (faq.respuesta === '__ESCALAR__') {
        const disponible = estaEnHorarioLaboral()
        const respuesta = disponible
          ? '🧑‍⚕️ Te voy a conectar con un asesor. Un momento por favor...\n\n*(En una app real, aquí se abriría un chat en vivo o WhatsApp)*'
          : `⏰ La atención humana está disponible de **Lunes a Viernes de ${env.HORARIO_INICIO} a ${env.HORARIO_FIN}**.\n\nFuera de este horario puedo seguir ayudándote con consultas básicas. ¿Qué necesitas?`

        await guardarMensaje(sessionToken, mensaje, respuesta, disponible)
        return responder.ok(res, { respuesta, escaloHumano: disponible, productos: [] })
      }

      await guardarMensaje(sessionToken, mensaje, faq.respuesta)
      return responder.ok(res, { respuesta: faq.respuesta, productos: [] })
    }
  }

  // ── 2. Buscar en la BD de productos ────────────────────
  try {
    const palabras = msg
      .split(/\s+/)
      .filter((p: string) => p.length >= 3)
      .slice(0, 3)

    if (palabras.length === 0) {
      const respuesta = `No entendí bien tu consulta. Puedes preguntarme por:\n• El nombre de un medicamento\n• Horarios de atención\n• Ubicación de nuestras sedes\n• Servicio de domicilios`
      return responder.ok(res, { respuesta, productos: [] })
    }

    // Búsqueda full-text en PostgreSQL via Prisma
    const productos = await prisma.producto.findMany({
      where: {
        activo: true,
        OR: palabras.flatMap((p: string) => [
          { nombre: { contains: p, mode: 'insensitive' as any } },
          { concentracion: { contains: p, mode: 'insensitive' as any } },
          { laboratorio: { contains: p, mode: 'insensitive' as any } },
        ]),
        lotes: {
          some: {
            cantidadActual: { gt: 0 },
            fechaVencimiento: { gt: new Date() },
          },
        },
      },
      take: 5,
      select: {
        id: true,
        nombre: true,
        concentracion: true,
        presentacion: true,
        laboratorio: true,
        precioVenta: true,
        requiereRx: true,
        lotes: {
          where: { cantidadActual: { gt: 0 }, fechaVencimiento: { gt: new Date() } },
          select: { cantidadActual: true },
        },
      },
    })

    let respuesta: string

    if (productos.length === 0) {
      respuesta =
        `No encontré "${mensaje}" en nuestro inventario disponible. Puede que esté temporalmente agotado.\n\n` +
        `¿Quieres que te conecte con un asesor? Escribe **"hablar con asesor"**.\n📞 También puedes llamarnos al **(606) 335-0000**.`
    } else if (productos.length === 1) {
      const p = productos[0]
      const stock = p.lotes.reduce((s: number, l: { cantidadActual: number }) => s + l.cantidadActual, 0)
      const rxMsg = p.requiereRx ? '⚠️ *Requiere fórmula médica*' : '✅ Venta libre'
      respuesta =
        `💊 **${p.nombre} ${p.concentracion ?? ''}**\n` +
        `• ${p.presentacion ?? ''} · ${p.laboratorio ?? ''}\n` +
        `• Precio: **$${Number(p.precioVenta).toLocaleString('es-CO')}**\n` +
        `• Disponible: ${stock > 0 ? `${stock} unidades` : '❌ Agotado'}\n` +
        `• ${rxMsg}\n\n` +
        `> ⚕️ Consulta siempre con un profesional de la salud antes de tomar cualquier medicamento.`
    } else {
      respuesta =
        `Encontré **${productos.length} productos** relacionados con "${mensaje}":\n\n` +
        productos
          .map((p: any) => {
            const stock = p.lotes.reduce((s: number, l: { cantidadActual: number }) => s + l.cantidadActual, 0)
            return `• **${p.nombre} ${p.concentracion ?? ''}** — $${Number(p.precioVenta).toLocaleString('es-CO')} (${stock > 0 ? `${stock} und.` : 'Agotado'})`
          })
          .join('\n') +
        `\n\n¿Necesitas más información sobre alguno en especial?`
    }

    // Ocultar datos sensibles: precio de compra, proveedores (R_RF6.1)
    const productosSeguros = productos.map((p: any) => ({
      id: p.id, nombre: p.nombre, concentracion: p.concentracion,
      presentacion: p.presentacion, precioVenta: p.precioVenta,
      requiereRx: p.requiereRx,
      stockTotal: p.lotes.reduce((s: number, l: any) => s + l.cantidadActual, 0),
    }))

    await guardarMensaje(sessionToken, mensaje, respuesta)
    return responder.ok(res, { respuesta, productos: productosSeguros })

  } catch (err) {
    logger.error('[Chatbot]', err)
    return responder.ok(res, {
      respuesta: 'Tuve un problema al consultar el inventario. Por favor inténtalo de nuevo.',
      productos: [],
    })
  }
})

// ── Guarda el intercambio en la BD ────────────────────────
async function guardarMensaje(
  sessionToken: string | undefined,
  userMsg: string,
  botReply: string,
  escalaHumano = false
): Promise<void> {
  if (!sessionToken) return
  try {
    const sesion = await prisma.chatbotSesion.findUnique({ where: { sessionToken } })
    const mensajes = (sesion?.mensajes as any[]) ?? []
    mensajes.push(
      { role: 'user', text: userMsg, timestamp: new Date().toISOString() },
      { role: 'bot', text: botReply, timestamp: new Date().toISOString() }
    )

    await prisma.chatbotSesion.upsert({
      where: { sessionToken },
      update: { mensajes, escalaHumano: escalaHumano || (sesion?.escalaHumano ?? false) },
      create: { sessionToken, mensajes, escalaHumano },
    })
  } catch { /* silencioso */ }
}