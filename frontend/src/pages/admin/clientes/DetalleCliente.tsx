import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Calendar, Coins, ShoppingBag, CreditCard } from 'lucide-react'
import { clientesService } from '@/services'
import { useFormateo } from '@/hooks'

export default function DetalleCliente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cop, fechaCorta } = useFormateo()

  const { data: cliente, isLoading, isError } = useQuery({
    queryKey: ['admin-cliente-detalle', id],
    queryFn: () => clientesService.obtener(id!),
    enabled: !!id,
  })

  if (isLoading) return <div className="p-10 text-center text-gray-500">Cargando perfil...</div>
  if (isError || !cliente) return <div className="p-10 text-center text-red-500">Error al cargar cliente</div>

  const ventas = cliente.ventas ?? []

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      <button onClick={() => navigate('/admin/clientes')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-700 transition-colors">
        <ArrowLeft size={14} /> Volver a clientes
      </button>

      <div className="grid md:grid-cols-[1fr_2fr] gap-6">
        
        {/* Panel Izquierdo: Info */}
        <div className="space-y-6">
          <div className="surface overflow-hidden">
            <div className="bg-teal-900 p-6 flex flex-col items-center text-center text-white">
              <div className="w-20 h-20 bg-teal-700 rounded-full flex items-center justify-center mb-3 text-3xl font-bold shadow-inner">
                {cliente.nombre[0]}{cliente.apellido?.[0] ?? ''}
              </div>
              <h2 className="text-xl font-bold">{cliente.nombre} {cliente.apellido}</h2>
              <p className="text-teal-200 text-sm">{cliente.email}</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <User size={16} className="text-gray-400"/>
                <span>Documento: <strong>{cliente.documento || 'No registrado'}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Calendar size={16} className="text-gray-400"/>
                <span>Registrado el: <strong>{fechaCorta(cliente.creadoEn)}</strong></span>
              </div>
            </div>
          </div>

          <div className="surface p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
            <div className="flex items-center gap-2 mb-2 text-amber-800">
              <Coins size={20} />
              <h3 className="font-bold">Puntos Cashback</h3>
            </div>
            <p className="text-4xl font-black text-amber-600 mb-1">{cliente.puntosAcumulados}</p>
            <p className="text-xs text-amber-700/70">Equivalentes a ${cliente.puntosAcumulados} COP</p>
          </div>
        </div>

        {/* Panel Derecho: Ventas recientes */}
        <div className="surface p-6">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2"><ShoppingBag size={20} className="text-teal-600"/> Últimas Compras</h3>
            <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded-md">{ventas.length} registros</span>
          </div>

          {ventas.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              Este cliente aún no tiene historial de compras.
            </div>
          ) : (
            <div className="space-y-4">
              {ventas.map((v: any) => (
                <div key={v.numero} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-teal-200 transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-teal-700">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">Factura #F-{String(v.numero).padStart(5, '0')}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{fechaCorta(v.creadoEn)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-teal-700">{cop(Number(v.total))}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${v.estado === 'PAGADO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{v.estado}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  )
}
