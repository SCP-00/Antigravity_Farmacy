import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { inventarioService } from '@/services'
import { Link } from 'react-router-dom'

export default function AlertasInventario() {
  const [mostrarTodas, setMostrarTodas] = useState(false)
  const { data: alertas = [], isLoading } = useQuery({ 
    queryKey: ['inventario','alertas', { leidas: mostrarTodas }], 
    queryFn: () => inventarioService.alertas(mostrarTodas ? '?leidas=true' : '')
  })

  const alertasNoLeidas = (alertas ?? []).filter((a: any) => !a.leida)
  const mostradas = mostrarTodas ? alertas : alertasNoLeidas

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Alertas de Inventario</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMostrarTodas(!mostrarTodas)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              mostrarTodas 
                ? 'bg-teal-100 text-teal-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {mostrarTodas ? '✓ Ver todas' : 'Ver todas'}
          </button>
          <Link to="/admin/inventario/lotes" className="text-sm text-teal-700 font-medium">Ver lotes</Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Cargando alertas...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {mostradas && mostradas.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-600">
              {alertasNoLeidas.length > 0 && (
                <span>{alertasNoLeidas.length} sin leer</span>
              )}
            </div>
          )}
          <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
            {(mostradas ?? []).map((a: any) => (
              <div key={a.id} className={`flex items-start gap-3 p-4 hover:bg-gray-50/50 transition-colors ${!a.leida ? 'bg-blue-50/30' : ''}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  a.tipo === 'STOCK_MINIMO' ? 'bg-red-400' : a.tipo === 'PROXIMO_VENCER' ? 'bg-amber-400' : 'bg-blue-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-gray-800">
                        {a.tipo === 'STOCK_MINIMO' ? 'Stock Crítico' : a.tipo === 'PROXIMO_VENCER' ? 'Por Vencer' : 'Alerta'}
                      </p>
                      {!a.leida && <span className="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full">Nuevo</span>}
                    </div>
                    <small className="text-xs text-gray-400">{new Date(a.creadoEn).toLocaleString()}</small>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{a.mensaje}</p>
                  <div className="mt-2 text-xs">
                    {a.loteId ? (
                      <Link to={`/admin/inventario/lotes?loteId=${a.loteId}`} className="text-teal-700 font-medium">Ver lote</Link>
                    ) : (
                      <Link to="/admin/inventario/productos" className="text-teal-700 font-medium">Ver productos</Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!mostradas?.length && (
              <div className="p-8 text-center text-gray-400">
                <span className="text-2xl mb-2 block">✅</span>
                <p className="text-sm">{mostrarTodas ? 'No hay alertas en el sistema' : 'Todas las alertas han sido revisadas'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}