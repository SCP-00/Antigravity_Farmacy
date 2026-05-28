// ══════════════════════════════════════════════════════════
//  MÓDULO IMÁGENES — Cloudinary
//  POST /api/v1/imagenes/subir
// ══════════════════════════════════════════════════════════
import { Router, Request, Response } from 'express'
import multer from 'multer'
import cloudinary from 'cloudinary'
import { responder } from '../../utils/respuesta.utils'
import { autenticar, autorizar } from '../../middlewares/index'
import { env } from '../../config/env'

export const imagenesRouter: Router = Router()

// Configurar Cloudinary si las credenciales están disponibles
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.v2.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key:    env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  })
}

// Multer en memoria (el buffer se sube directo a Cloudinary)
// Límite estricto de tamaño para evitar DoS por subida de archivos gigantes
const UPLOAD_MAX_SIZE = 5 * 1024 * 1024 // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: UPLOAD_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    // Solo aceptar imágenes — evitar subida de scripts maliciosos
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'))
  },
})

// POST /imagenes/subir
imagenesRouter.post(
  '/subir',
  autenticar,
  autorizar('ADMINISTRADOR', 'AUXILIAR'),
  upload.single('imagen'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return responder.error(res, 'No se proporcionó ninguna imagen')
    }

    if (!env.CLOUDINARY_CLOUD_NAME) {
      return responder.error(res, 'Cloudinary no está configurado en este entorno', 503)
    }

    try {
      // Subir buffer a Cloudinary
      const resultado = await new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          { folder: 'farmacy/productos', resource_type: 'image' },
          (error, result) => {
            if (error || !result) return reject(error)
            resolve(result)
          }
        )
        stream.end(req.file!.buffer)
      })

      return responder.ok(res, {
        url:       resultado.secure_url,
        publicId:  resultado.public_id,
        ancho:     resultado.width,
        alto:      resultado.height,
        formato:   resultado.format,
        tamanoKb:  Math.round(resultado.bytes / 1024),
      }, 'Imagen subida correctamente')

    } catch (err) {
      return responder.serverError(res, err)
    }
  }
)

// DELETE /imagenes/:publicId
imagenesRouter.delete(
  '/:publicId',
  autenticar,
  autorizar('ADMINISTRADOR'),
  async (req: Request, res: Response) => {
    try {
      // Validar formato del publicId — solo caracteres seguros
      const publicId = req.params.publicId
        .replace(/[^a-zA-Z0-9_\-\/.]/g, '')  // solo alfanum, _, -, /, .
        .replace(/\.\.+/g, '')                // eliminar .. (path traversal)
        .replace(/\/+/g, '/')                  // normalizar slashes múltiples
        .replace(/^\/+|\/+$/g, '')            // eliminar leading/trailing /
      if (!publicId || publicId.length < 2 || publicId.length > 200) {
        return responder.error(res, 'ID de imagen inválido')
      }
      await cloudinary.v2.uploader.destroy(publicId)
      return responder.ok(res, null, 'Imagen eliminada')
    } catch (err) {
      return responder.serverError(res, err)
    }
  }
)
