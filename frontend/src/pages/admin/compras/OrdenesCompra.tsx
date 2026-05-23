import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Plus, ChevronLeft, ChevronRight, Truck,
  Clock, CheckCircle, XCircle, Filter,
} from 'lucide-react'
import { comprasService } from '@/services'
import { useFormateo } from '@/hooks'

const estados = [
  { key: '', label: 'Todas', icon: Filter },
  { key: 'PENDIENTE', label: 'Pendientes', icon: Clock },
  { key: 'RECIBIDA', label: 'Recibidas', icon: CheckCircle },
  { key: 'CANCELADA', label: 'Canceladas', icon: XCircle },
]

const estadoColores: Record<string, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700 border-amber-200',
  RECIBIDA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELADA: 'bg-red-50 text-red-700 border-red-200',
}

export default function OrdenesCompra() {
  const { cop, fechaCorta } = useFormateo()
  const navigate = useNavigate()
  const [pagina, setPagina] = useState(1)
  const [filtroEstado, setFiltroEstado] = useState('')
  const limite = 15

  const { data, isLoading, isError } = useQuery({
    queryKey: ['compras', filtroEstado, pagina],
    queryFn: () => comprasService.listarOrdenes({ estado: filtroEstado || undefined, pagina, limite }),
  })

  const ordenes = useMemo(() => data?.data ?? [], [data])
  const meta = useMemo(() => data?.meta ?? { total: 0, totalPaginas: 0, pagina: 1 }, [data])
  const totalPaginas = meta.totalPaginas || 1

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de compra</h1>
          <p className="text-sm text-gray-500 mt-1">{meta.total} orden(es)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/admin/compras/recepcion')}
            className="btn-ghost flex items-center gap-2">
            <Truck size={16} /> Recibir mercancía
          </button>
          <button onClick={() => navigate('/admin/compras/nueva')}
            className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nueva orden
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {estados.map(est => (
          <button
            key={est.key}
            onClick={() => { setFiltroEstado(est.key); setPagina(1) }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all
              ${filtroEstado === est.key
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300 hover:text-teal-700'
              }`}
          >
            <est.icon size={14} />
            {est.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="surface overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando órdenes...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Error al cargar órdenes</div>
        ) : ordenes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 text-gray-300" />
            <p>No hay órdenes de compra {filtroEstado ? `en estado "${filtroEstado.toLowerCase()}"` : ''}</p>
            <button onClick={() => navigate('/admin/compras/nueva')}
              className="text-teal-700 font-medium text-sm mt-3 inline-flex items-center gap-1 hover:underline">
              <Plus size={14} /> Crear primera orden
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-[0.18em]">
                <tr>
                  <th className="px-5 py-3 text-left">N°</th>
                  <th className="px-5 py-3 text-left">Proveedor</th>
                  <th className="px-5 py-3 text-left">Empleado</th>
                  <th className="px-5 py-3 text-left">Fecha</th>
                  <th className="px-5 py-3 text-left">Total</th>
                  <th className="px-5 py-3 text-left">Estado</th>
                  <th className="px-5 py-3 text-center">Items</th>
                  <th className="px-5 py-3 text-right">Recibida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {ordenes.map((o: any) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-gray-600">
                      OC-{String(o.numero ?? o.id).slice(0, 8)}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900">{o.proveedor?.nombre ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {o.empleado ? `${o.empleado.nombre} ${o.empleado.apellido ?? ''}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{fechaCorta(o.creadoEn)}</td>
                    <td className="px-5 py-4 font-medium text-gray-900">{cop(Number(o.total))}</td>
                    <td className="px-5 py-4">
                      <span className={`badge border ${estadoColores[o.estado] ?? 'bg-gray-50 text-gray-600'}`}>
                        {o.estado}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-gray-600">{o._count?.detalles ?? 0}</td>
                    <td className="px-5 py-4 text-right text-gray-400 text-xs">
                      {o.recibidaEn ? fechaCorta(o.recibidaEn) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-gray-500">Página {pagina} de {totalPaginas}</p>
            <div className="flex gap-2">
              <button onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina <= 1}
                className="btn-ghost text-xs flex items-center gap-1 disabled:opacity-30">
                <ChevronLeft size={14} /> Anterior
              </button>
              <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina >= totalPaginas}
                className="btn-ghost text-xs flex items-center gap-1 disabled:opacity-30">
                Siguiente <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
