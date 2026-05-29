import { useState, useEffect } from 'react'
import { Plus, Search, AlertTriangle, PackageOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { inventarioService } from '@/services'
import { useFormateo } from '@/hooks'
import FormularioLote from './components/FormularioLote'

export default function GestionLotes() {
  const { fechaCorta, cop } = useFormateo()
  const [lotes, setLotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)

  const fetchLotes = async () => {
    setLoading(true)
    try {
      const data = await inventarioService.listarLotes()
      setLotes(data.data || data)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al cargar lotes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLotes()
  }, [])

  const filteredLotes = Array.isArray(lotes) ? lotes.filter(l => 
    l.codigoLote.toLowerCase().includes(search.toLowerCase()) || 
    l.producto?.nombre.toLowerCase().includes(search.toLowerCase())
  ) : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Gestión de Lotes</h1>
          <p className="text-gray-500 text-sm mt-1">
            Ingreso de mercancía por lotes y control de fechas de vencimiento.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar lote o producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nuevo Lote</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-gray-700 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Lote / Producto</th>
                <th className="px-6 py-4">Vencimiento</th>
                <th className="px-6 py-4 text-center">Stock Inicial</th>
                <th className="px-6 py-4 text-center">Stock Actual</th>
                <th className="px-6 py-4 text-right">Costo (U)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      Cargando lotes...
                    </div>
                  </td>
                </tr>
              ) : filteredLotes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No hay lotes registrados.
                  </td>
                </tr>
              ) : (
                filteredLotes.map((lote) => {
                  const vencimiento = new Date(lote.fechaVencimiento)
                  const hoy = new Date()
                  const diasParaVencer = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
                  const esCritico = diasParaVencer < 60

                  return (
                    <tr key={lote.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{lote.codigoLote}</div>
                        <div className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                          <PackageOpen size={12} /> {lote.producto?.nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          esCritico ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {esCritico && <AlertTriangle size={12} />}
                          {fechaCorta(lote.fechaVencimiento)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">{lote.cantidadInicial}</td>
                      <td className="px-6 py-4 text-center font-bold text-gray-900">
                        {lote.cantidadActual}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        {cop(Number(lote.precioCompra))}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <FormularioLote 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={() => { setIsFormOpen(false); fetchLotes() }} 
        />
      )}
    </div>
  )
}
