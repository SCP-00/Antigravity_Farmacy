import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Pencil, Building2, ChevronLeft, ChevronRight,
  X, Check, Phone, Mail, MapPin,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { proveedoresService } from '@/services'
import { useDebounce } from '@/hooks'

interface ProveedorForm {
  nit: string
  nombre: string
  nombreContacto: string
  email: string
  telefono: string
  ciudad: string
}

const formInicial: ProveedorForm = {
  nit: '', nombre: '', nombreContacto: '',
  email: '', telefono: '', ciudad: '',
}

export default function ListaProveedores() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState<ProveedorForm>(formInicial)
  const limite = 15

  const debouncedQ = useDebounce(busqueda, 300)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['proveedores', debouncedQ, pagina],
    queryFn: () => proveedoresService.listar({ q: debouncedQ || undefined, pagina, limite }),
  })

  const proveedores = useMemo(() => data?.data ?? [], [data])
  const meta = useMemo(() => data?.meta ?? { total: 0, totalPaginas: 0, pagina: 1 }, [data])
  const totalPaginas = meta.totalPaginas || 1

  const createMutation = useMutation({
    mutationFn: (data: ProveedorForm) => proveedoresService.crear(data as any),
    onSuccess: () => {
      toast.success('Proveedor creado exitosamente')
      cerrarModal()
      qc.invalidateQueries({ queryKey: ['proveedores'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Error al crear proveedor')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProveedorForm> }) =>
      proveedoresService.actualizar(id, data as any),
    onSuccess: () => {
      toast.success('Proveedor actualizado')
      cerrarModal()
      qc.invalidateQueries({ queryKey: ['proveedores'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Error al actualizar')
    },
  })

  function abrirCrear() {
    setEditandoId(null)
    setForm(formInicial)
    setModalAbierto(true)
  }

  function abrirEditar(p: any) {
    setEditandoId(p.id)
    setForm({
      nit: p.nit ?? '',
      nombre: p.nombre ?? '',
      nombreContacto: p.nombreContacto ?? '',
      email: p.email ?? '',
      telefono: p.telefono ?? '',
      ciudad: p.ciudad ?? '',
    })
    setModalAbierto(true)
  }

  function cerrarModal() {
    setModalAbierto(false)
    setEditandoId(null)
    setForm(formInicial)
  }

  function guardar() {
    if (!form.nit || !form.nombre) {
      toast.error('NIT y Nombre son obligatorios')
      return
    }
    if (editandoId) {
      updateMutation.mutate({ id: editandoId, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-sm text-gray-500 mt-1">
            {meta.total} registro{meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={abrirCrear} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nuevo proveedor
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setPagina(1) }}
          placeholder="Buscar por NIT o nombre..."
          className="input-base pl-10"
        />
      </div>

      {/* Table */}
      <div className="surface overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando proveedores...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Error al cargar proveedores</div>
        ) : proveedores.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Building2 size={40} className="mx-auto mb-3 text-gray-300" />
            <p>{busqueda ? `Sin resultados para "${busqueda}"` : 'No hay proveedores registrados'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-[0.18em]">
                <tr>
                  <th className="px-5 py-3 text-left">NIT</th>
                  <th className="px-5 py-3 text-left">Nombre</th>
                  <th className="px-5 py-3 text-left">Contacto</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Teléfono</th>
                  <th className="px-5 py-3 text-left">Ciudad</th>
                  <th className="px-5 py-3 text-center">Órdenes</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {proveedores.map((p: any) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/admin/proveedores/${p.id}`)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-gray-600">{p.nit}</td>
                    <td className="px-5 py-4 font-medium text-gray-900">{p.nombre}</td>
                    <td className="px-5 py-4 text-gray-600">{p.nombreContacto || '—'}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {p.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail size={12} className="text-gray-400" />{p.email}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {p.telefono ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone size={12} className="text-gray-400" />{p.telefono}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {p.ciudad ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} className="text-gray-400" />{p.ciudad}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="badge bg-gray-100 text-gray-700">
                        {p._count?.ordenesCompra ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={e => { e.stopPropagation(); abrirEditar(p) }}
                        className="p-1.5 text-gray-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
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
            <p className="text-xs text-gray-500">
              Página {pagina} de {totalPaginas}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina <= 1}
                className="btn-ghost text-xs flex items-center gap-1 disabled:opacity-30"
              >
                <ChevronLeft size={14} /> Anterior
              </button>
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina >= totalPaginas}
                className="btn-ghost text-xs flex items-center gap-1 disabled:opacity-30"
              >
                Siguiente <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editandoId ? 'Editar proveedor' : 'Nuevo proveedor'}
              </h2>
              <button onClick={cerrarModal} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">NIT *</label>
                  <input value={form.nit} onChange={e => setForm(f => ({ ...f, nit: e.target.value }))}
                    className="input-base" placeholder="12345678-9" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Nombre *</label>
                  <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className="input-base" placeholder="Laboratorios Genfar S.A." />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Nombre contacto</label>
                  <input value={form.nombreContacto} onChange={e => setForm(f => ({ ...f, nombreContacto: e.target.value }))}
                    className="input-base" placeholder="Juan Pérez" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Teléfono</label>
                  <input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                    className="input-base" placeholder="300 123 4567" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="input-base" placeholder="contacto@laboratorio.com" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Ciudad</label>
                  <input value={form.ciudad} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))}
                    className="input-base" placeholder="Bogotá D.C." />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button onClick={cerrarModal} className="btn-ghost text-sm">Cancelar</button>
              <button onClick={guardar} disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary text-sm flex items-center gap-2">
                <Check size={14} />
                {editandoId ? 'Actualizar' : 'Crear proveedor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
