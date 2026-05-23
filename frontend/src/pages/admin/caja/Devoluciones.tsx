import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, RotateCcw, AlertTriangle, Receipt, Package, Check } from 'lucide-react'
import { ventasService } from '@/services'
import { useFormateo } from '@/hooks'
import toast from 'react-hot-toast'

export default function Devoluciones() {
  const { cop, fechaHora } = useFormateo()
  const qc = useQueryClient()
  
  const [busqueda, setBusqueda] = useState('')
  const [ventaData, setVentaData] = useState<any>(null)
  const [buscando, setBuscando] = useState(false)
  
  const [motivo, setMotivo] = useState('')
  const [reintegra, setReintegra] = useState(true)

  // Simulación de búsqueda de factura (usando el endpoint listar filtrando por ID o número)
  const buscarFactura = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!busqueda) return
    setBuscando(true)
    setVentaData(null)
    try {
      // Idealmente el backend tendría un endpoint buscar por número exacto, 
      // aquí usamos listar y tomamos la primera coincidencia
      const res = await ventasService.listar({ q: busqueda }) 
      const factura = res.data.find((v: any) => v.id === busqueda || v.numero.toString() === busqueda)
      
      if (factura) setVentaData(factura)
      else toast.error('Factura no encontrada')
    } catch (err) {
      toast.error('Error al buscar la factura')
    } finally {
      setBuscando(false)
    }
  }

  const devolucionMutation = useMutation({
    mutationFn: () => ventasService.devolucion(ventaData.id, { motivo, reintegraStock: reintegra }),
    onSuccess: () => {
      toast.success('Devolución procesada correctamente')
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setVentaData(null)
      setBusqueda('')
      setMotivo('')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error procesando devolución')
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Devoluciones y Garantías</h1>
        <p className="text-sm text-gray-500 mt-1">Busca una factura para reversar el pago e ingresar el stock nuevamente.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Columna de Búsqueda */}
        <div className="md:col-span-1 space-y-4">
          <div className="surface p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Buscar Venta</h2>
            <form onSubmit={buscarFactura} className="space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  value={busqueda} 
                  onChange={e => setBusqueda(e.target.value)} 
                  placeholder="ID o N° de factura..." 
                  className="input-base pl-10"
                />
              </div>
              <button type="submit" disabled={buscando} className="btn-secondary w-full justify-center">
                {buscando ? 'Buscando...' : 'Buscar'}
              </button>
            </form>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex gap-3 text-amber-800 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>Las devoluciones solo pueden realizarse sobre facturas en estado <strong>PAGADO</strong> con un máximo de 15 días de antigüedad.</p>
          </div>
        </div>

        {/* Columna de Resultados y Acción */}
        <div className="md:col-span-2">
          {!ventaData ? (
            <div className="surface p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <RotateCcw className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium">Ingresa un número de factura para comenzar</p>
            </div>
          ) : (
            <div className="surface overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Factura #F-{String(ventaData.numero).padStart(5,'0')}</p>
                  <p className="text-sm text-slate-700 mt-1">{fechaHora(ventaData.creadoEn)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Total pagado</p>
                  <p className="text-2xl font-bold text-teal-700">{cop(Number(ventaData.total))}</p>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Receipt size={16}/> Productos en la venta</h3>
                <div className="space-y-2 mb-6">
                  {/* Aquí mapearíamos los detalles de la venta si el backend los trae en este endpoint */}
                  <div className="flex items-center justify-between text-sm p-3 border border-gray-100 rounded-lg">
                    <span className="flex items-center gap-2 text-gray-700"><Package size={14} className="text-gray-400"/> {ventaData.items || 'Varios'} items procesados</span>
                    <span className="font-medium text-gray-900">{cop(Number(ventaData.total))}</span>
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-100 pt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de la devolución *</label>
                    <textarea 
                      value={motivo} 
                      onChange={e => setMotivo(e.target.value)} 
                      rows={2} 
                      placeholder="Ej: Producto en mal estado, error de digitación..." 
                      className="input-base resize-none"
                    />
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                    <input type="checkbox" checked={reintegra} onChange={e => setReintegra(e.target.checked)} className="w-5 h-5 accent-teal-600" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-800">Reintegrar stock al inventario</p>
                      <p className="text-xs text-gray-500">Desmarca esto si el producto fue devuelto por daño o vencimiento.</p>
                    </div>
                  </label>

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={() => devolucionMutation.mutate()} 
                      disabled={devolucionMutation.isPending || !motivo || ventaData.estado !== 'PAGADO'}
                      className="btn-primary bg-red-600 hover:bg-red-700"
                    >
                      <Check size={16} /> {devolucionMutation.isPending ? 'Procesando...' : 'Confirmar Devolución'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}