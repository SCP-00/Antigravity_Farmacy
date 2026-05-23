import { useQuery } from '@tanstack/react-query'
import { Package, AlertTriangle, PackageX, Calendar, ArrowRight } from 'lucide-react'
import { reportesService } from '@/services'
import { useFormateo } from '@/hooks'
import { Link } from 'react-router-dom'

export default function ReporteInventario() {
  const { fechaCorta } = useFormateo()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['reportes', 'inventario'],
    queryFn: reportesService.inventario,
  })

  if (isLoading) return <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div></div>
  if (isError) return <div className="p-10 text-center text-red-500">Error al cargar el reporte de inventario</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reporte de Inventario</h1>
        <p className="text-sm text-gray-500 mt-1">Visión general del estado actual de tu mercancía y alertas operativas.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface p-5">
          <div className="flex items-center gap-3 text-teal-700 mb-3"><Package size={18}/><span className="text-sm font-semibold">Stock Total</span></div>
          <p className="text-3xl font-bold text-slate-900">{data?.stockTotal ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Unidades en estantes</p>
        </div>
        <div className="surface p-5 bg-amber-50 border-amber-100">
          <div className="flex items-center gap-3 text-amber-700 mb-3"><AlertTriangle size={18}/><span className="text-sm font-semibold">Stock Crítico</span></div>
          <p className="text-3xl font-bold text-amber-600">{data?.stockCritico ?? 0}</p>
          <p className="text-xs text-amber-700/70 mt-1">Productos por debajo del mínimo</p>
        </div>
        <div className="surface p-5 bg-red-50 border-red-100">
          <div className="flex items-center gap-3 text-red-700 mb-3"><PackageX size={18}/><span className="text-sm font-semibold">Agotados</span></div>
          <p className="text-3xl font-bold text-red-600">{data?.agotados ?? 0}</p>
          <p className="text-xs text-red-700/70 mt-1">Requieren orden de compra</p>
        </div>
        <div className="surface p-5 bg-blue-50 border-blue-100">
          <div className="flex items-center gap-3 text-blue-700 mb-3"><Calendar size={18}/><span className="text-sm font-semibold">Lotes en Riesgo</span></div>
          <p className="text-3xl font-bold text-blue-600">{data?.porVencer?.length ?? 0}</p>
          <p className="text-xs text-blue-700/70 mt-1">Próximos a vencer (30 días)</p>
        </div>
      </div>

      {/* Tabla Lotes por Vencer */}
      <div className="surface overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-semibold text-gray-900">Lotes próximos a vencer (Siguientes 30 días)</h2>
          <Link to="/admin/inventario/lotes" className="text-sm text-teal-700 hover:text-teal-900 font-medium flex items-center gap-1">Ver todos los lotes <ArrowRight size={14}/></Link>
        </div>
        
        {data?.porVencer?.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 text-gray-200" />
            <p>Excelente, no tienes lotes próximos a vencer en los siguientes 30 días.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-white text-slate-500 uppercase text-[11px] tracking-[0.18em]">
                <tr>
                  <th className="px-5 py-3 text-left">Lote</th>
                  <th className="px-5 py-3 text-left">Producto</th>
                  <th className="px-5 py-3 text-center">Unidades</th>
                  <th className="px-5 py-3 text-right">Vencimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {(data?.porVencer ?? []).map((lote: any) => {
                  const diasRestantes = Math.ceil((new Date(lote.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <tr key={lote.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-mono font-medium text-gray-700">{lote.codigoLote}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{lote.producto?.nombre}</td>
                      <td className="px-5 py-4 text-center font-medium">{lote.cantidadActual}</td>
                      <td className="px-5 py-4 text-right">
                        <span className={inline-flex px-2.5 py-1 rounded-full text-xs font-bold }>
                          {fechaCorta(lote.fechaVencimiento)} ({diasRestantes <= 0 ? 'Vencido' : n  d})
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
