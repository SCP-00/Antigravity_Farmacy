import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { X, Save, Scan } from 'lucide-react'
import { inventarioService, productosService, sucursalesService, proveedoresService } from '@/services'
import { useScanner } from '@/hooks'
import toast from 'react-hot-toast'

const loteSchema = z.object({
  codigoLote: z.string().min(2, 'Obligatorio'),
  productoId: z.string().uuid('Obligatorio'),
  sucursalId: z.coerce.number().min(1, 'Obligatorio'),
  proveedorId: z.string().optional(),
  fechaVencimiento: z.string().min(1, 'Obligatorio'),
  cantidadInicial: z.coerce.number().min(1, 'Mínimo 1'),
  precioCompra: z.coerce.number().min(0, 'No puede ser negativo'),
})

type LoteFormData = z.infer<typeof loteSchema>

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function FormularioLote({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [productos, setProductos] = useState<any[]>([])
  const [sucursales, setSucursales] = useState<any[]>([])
  const [proveedores, setProveedores] = useState<any[]>([])

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoteFormData>({
    resolver: zodResolver(loteSchema),
    defaultValues: { cantidadInicial: 1, precioCompra: 0 }
  })

  useEffect(() => {
    Promise.all([
      productosService.listar({ limite: 100 }), // En producción usar autocompletado
      sucursalesService.listar(),
      proveedoresService.listar({ limite: 100 })
    ]).then(([prodRes, sucRes, provRes]) => {
      setProductos(prodRes.data || prodRes)
      setSucursales(sucRes || [])
      setProveedores(provRes.data || provRes)
    })
  }, [])

  // Integración de escáner para autoseleccionar el producto si se escanea
  useScanner((barcode) => {
    toast.success(`Código escaneado: ${barcode}`, { icon: '📟' })
    productosService.buscar({ q: barcode, limite: 1 }).then(res => {
      if (res.data && res.data.length > 0) {
        setValue('productoId', res.data[0].id)
        toast.success(`Producto seleccionado: ${res.data[0].nombre}`)
      } else {
        toast.error('Producto no encontrado')
      }
    })
  })

  const onSubmit = async (data: LoteFormData) => {
    setLoading(true)
    try {
      await inventarioService.crearLote(data)
      toast.success('Lote registrado correctamente')
      onSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar el lote')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-semibold text-gray-800">Registrar Nuevo Lote</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <form id="lote-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                Producto <span title="Escanea para seleccionar aut."><Scan size={14} className="text-gray-400" /></span>
              </label>
              <select {...register('productoId')} className="w-full input-base">
                <option value="">Seleccione o escanee el código...</option>
                {productos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} {p.concentracion}</option>
                ))}
              </select>
              {errors.productoId && <p className="text-red-500 text-xs mt-1">{errors.productoId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de Lote</label>
                <input {...register('codigoLote')} className="w-full input-base" placeholder="Ej. L-1234" />
                {errors.codigoLote && <p className="text-red-500 text-xs mt-1">{errors.codigoLote.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">F. Vencimiento</label>
                <input type="date" {...register('fechaVencimiento')} className="w-full input-base" />
                {errors.fechaVencimiento && <p className="text-red-500 text-xs mt-1">{errors.fechaVencimiento.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Ingresada</label>
                <input type="number" {...register('cantidadInicial')} className="w-full input-base" />
                {errors.cantidadInicial && <p className="text-red-500 text-xs mt-1">{errors.cantidadInicial.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo de Compra (Total)</label>
                <input type="number" {...register('precioCompra')} className="w-full input-base" />
                {errors.precioCompra && <p className="text-red-500 text-xs mt-1">{errors.precioCompra.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal de Destino</label>
                <select {...register('sucursalId')} className="w-full input-base">
                  <option value="">Seleccione...</option>
                  {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                {errors.sucursalId && <p className="text-red-500 text-xs mt-1">{errors.sucursalId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor (Opcional)</label>
                <select {...register('proveedorId')} className="w-full input-base">
                  <option value="">Ninguno</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            </div>

          </form>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg">
            Cancelar
          </button>
          <button type="submit" form="lote-form" disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            Registrar Lote
          </button>
        </div>

      </div>
    </div>
  )
}
