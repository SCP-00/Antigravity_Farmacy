import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Users, ChevronLeft, ChevronRight, Coins, Mail, Calendar } from 'lucide-react'
import { clientesService } from '@/services'
import { useDebounce, useFormateo } from '@/hooks'

export default function ListaClientes() {
  const { fechaCorta } = useFormateo()
  const navigate = useNavigate()
  
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const limite = 15
  const debouncedQ = useDebounce(busqueda, 300)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-clientes', debouncedQ, pagina],
    queryFn: () => clientesService.listar({ q: debouncedQ || undefined, pagina, limite }),
  })

  const clientes = useMemo(() => data?.data ?? [], [data])
  const meta = useMemo(() => data?.meta ?? { total: 0, totalPaginas: 0, pagina: 1 }, [data])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Directorio de Clientes</h1>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted mt-1">{meta.total} clientes registrados</p>
        </div>
        <button onClick={() => navigate('/admin/clientes/fidelidad')} className="btn-secondary flex items-center gap-2">
          <Coins size={16} className="text-amber-500" />
          Programa Fidelidad
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setPagina(1) }}
          placeholder="Buscar por nombre, documento o email..."
          className="input-base pl-10"
        />
      </div>

      <div className="surface overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 dark:text-dark-text-muted">Cargando clientes...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 dark:text-red-400">Error al cargar clientes</div>
        ) : clientes.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-dark-text-muted">
            <Users size={48} className="mx-auto mb-4 text-gray-200 dark:text-dark-border" />
            <p>No se encontraron clientes {busqueda && `para "${busqueda}"`}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-dark-border text-sm">
              <thead className="bg-slate-50 dark:bg-dark-bg text-slate-500 dark:text-dark-text-secondary uppercase text-[11px] tracking-[0.18em]">
                <tr>
                  <th className="px-5 py-3 text-left">Cliente</th>
                  <th className="px-5 py-3 text-left">Contacto</th>
                  <th className="px-5 py-3 text-center">Puntos</th>
                  <th className="px-5 py-3 text-center">Ventas</th>
                  <th className="px-5 py-3 text-right">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border bg-white dark:bg-dark-surface">
                {clientes.map((c: any) => (
                  <tr key={c.id} onClick={() => navigate(`/admin/clientes/${c.id}`)} className="hover:bg-slate-50/70 dark:hover:bg-dark-hover cursor-pointer transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 dark:text-dark-text">{c.nombre} {c.apellido}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-dark-text-secondary">
                      <div className="flex items-center gap-1.5"><Mail size={12}/> {c.email}</div>
                      {c.telefono && <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-dark-text-muted">{c.telefono}</div>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800/50">
                        <Coins size={12}/> {c.puntosAcumulados}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-gray-600 dark:text-dark-text-secondary font-medium">
                      {c._count?.ventas ?? 0}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-500 dark:text-dark-text-muted text-xs flex justify-end items-center gap-1">
                      <Calendar size={12}/> {fechaCorta(c.creadoEn)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.totalPaginas > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface">
            <p className="text-xs text-gray-500 dark:text-dark-text-muted">Página {pagina} de {meta.totalPaginas}</p>
            <div className="flex gap-2">
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina <= 1} className="btn-ghost text-xs flex items-center gap-1 disabled:opacity-30">
                <ChevronLeft size={14} /> Anterior
              </button>
              <button onClick={() => setPagina(p => Math.min(meta.totalPaginas, p + 1))} disabled={pagina >= meta.totalPaginas} className="btn-ghost text-xs flex items-center gap-1 disabled:opacity-30">
                Siguiente <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
