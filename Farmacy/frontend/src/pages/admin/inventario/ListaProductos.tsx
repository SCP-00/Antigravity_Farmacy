import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Package, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { productosService } from '@/services'
import { useCategorias, useFormateo, useDebounce } from '@/hooks'

const productoSchema = z.object({
  registroInvima: z.string().min(5, 'Registro INVIMA requerido'),
  nombre:         z.string().min(2, 'Nombre requerido'),
  concentracion:  z.string().optional(),
  presentacion:   z.string().optional(),
  laboratorio:    z.string().optional(),
  descripcion:    z.string().optional(),
  categoriaId:    z.coerce.number().int().positive('Selecciona una categoría'),
  requiereRx:     z.boolean().default(false),
  precioVenta:    z.coerce.number().positive('El precio debe ser mayor a 0'),
  stockMinimo:    z.coerce.number().int().min(0).default(10),
})
type ProductoForm = z.infer<typeof productoSchema>

export default function ListaProductos() {
  const { cop }    = useFormateo()
  const qc         = useQueryClient()
  const [busqueda, setBusqueda] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const debouncedQ = useDebounce(busqueda, 400)

  const { data: categorias } = useCategorias()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'productos', debouncedQ],
    queryFn:  () => productosService.listar({ q: debouncedQ }),
  })
  const productos = data?.data ?? []

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductoForm>({
    resolver: zodResolver(productoSchema),
    defaultValues: { requiereRx: false, stockMinimo: 10 },
  })

  const crearMutation = useMutation({
    mutationFn: productosService.crear,
    onSuccess: () => {
      toast.success('Producto creado')
      qc.invalidateQueries({ queryKey: ['admin', 'productos'] })
      setModalOpen(false); reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Error al crear producto'),
  })

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      productosService.actualizar(id, data),
    onSuccess: () => {
      toast.success('Producto actualizado')
      qc.invalidateQueries({ queryKey: ['admin', 'productos'] })
      setModalOpen(false); setEditando(null); reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Error al actualizar'),
  })

  const onSubmit = (data: ProductoForm) => {
    if (editando) {
      actualizarMutation.mutate({ id: editando.id, data })
    } else {
      crearMutation.mutate(data)
    }
  }

  const abrirEditar = (p: any) => {
    setEditando(p)
    reset({
      registroInvima: p.registroInvima,
      nombre:         p.nombre,
      concentracion:  p.concentracion ?? '',
      presentacion:   p.presentacion ?? '',
      laboratorio:    p.laboratorio ?? '',
      categoriaId:    p.categoriaId,
      requiereRx:     p.requiereRx,
      precioVenta:    Number(p.precioVenta),
      stockMinimo:    p.stockMinimo,
    })
    setModalOpen(true)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventario de productos</h1>
          <p className="text-sm text-gray-400 mt-0.5">{data?.meta?.total ?? 0} productos registrados</p>
        </div>
        <button onClick={() => { setEditando(null); reset(); setModalOpen(true) }}
          className="btn-primary">
          <Plus size={16}/> Nuevo producto
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o Registro INVIMA..."
          className="input-base pl-10"/>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F8F6] border-b border-[#D8EBE4]">
              <tr>
                {['Producto','Categoría','Stock','Mínimo','Precio venta','RX','Estado',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold
                                         text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-t border-[#D8EBE4]">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse"/>
                        </td>
                      ))}
                    </tr>
                  ))
                : productos.map((p: any) => {
                    const stockBajo = p.stockTotal <= p.stockMinimo
                    return (
                      <tr key={p.id}
                        className="border-t border-[#D8EBE4] hover:bg-teal-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{p.nombre}</p>
                          <p className="text-xs text-gray-400">
                            {p.concentracion} · {p.presentacion}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{p.categoria?.nombre}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${stockBajo ? 'text-red-600' : 'text-gray-900'}`}>
                            {p.stockTotal ?? 0}
                          </span>
                          {stockBajo && (
                            <AlertTriangle size={12} className="inline ml-1 text-amber-500"/>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{p.stockMinimo}</td>
                        <td className="px-4 py-3 font-semibold text-teal-700">
                          {cop(p.precioVenta)}
                        </td>
                        <td className="px-4 py-3">
                          {p.requiereRx
                            ? <span className="badge-rx">RX</span>
                            : <span className="badge-otc">OTC</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${p.activo ? 'badge-otc' : 'badge-low'}`}>
                            {p.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => abrirEditar(p)}
                            className="text-xs text-teal-700 hover:underline font-medium">
                            Editar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
              {!isLoading && productos.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Package size={40} className="mx-auto text-gray-200 mb-3"/>
                    <p className="text-gray-400">Sin productos registrados</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear/editar */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#D8EBE4]">
              <h2 className="font-semibold text-lg">
                {editando ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button onClick={() => { setModalOpen(false); setEditando(null) }}
                className="w-8 h-8 rounded-full flex items-center justify-center
                           hover:bg-gray-100 text-gray-400">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Registro INVIMA *
                  </label>
                  <input {...register('registroInvima')} className="input-base"
                    placeholder="INVIMA2024M-0001"/>
                  {errors.registroInvima && (
                    <p className="text-xs text-red-500 mt-1">{errors.registroInvima.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Nombre *</label>
                  <input {...register('nombre')} className="input-base" placeholder="Ibuprofeno"/>
                  {errors.nombre && (
                    <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Concentración</label>
                  <input {...register('concentracion')} className="input-base" placeholder="400mg"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Presentación</label>
                  <input {...register('presentacion')} className="input-base" placeholder="Tableta x 20"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Laboratorio</label>
                  <input {...register('laboratorio')} className="input-base" placeholder="MK Pharma"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Categoría *</label>
                  <select {...register('categoriaId')} className="input-base">
                    <option value="">Seleccionar...</option>
                    {(categorias ?? []).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                  {errors.categoriaId && (
                    <p className="text-xs text-red-500 mt-1">{errors.categoriaId.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Precio venta *</label>
                  <input {...register('precioVenta')} type="number" className="input-base" placeholder="8500"/>
                  {errors.precioVenta && (
                    <p className="text-xs text-red-500 mt-1">{errors.precioVenta.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Stock mínimo</label>
                  <input {...register('stockMinimo')} type="number" className="input-base" placeholder="10"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Descripción</label>
                <textarea {...register('descripcion')} rows={2} className="input-base resize-none"
                  placeholder="Descripción opcional del producto"/>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input {...register('requiereRx')} type="checkbox"
                  className="w-4 h-4 rounded accent-teal-700"/>
                <span className="text-sm text-gray-700">Requiere fórmula médica (RX)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button"
                  onClick={() => { setModalOpen(false); setEditando(null) }}
                  className="btn-outline flex-1">
                  Cancelar
                </button>
                <button type="submit"
                  disabled={crearMutation.isPending || actualizarMutation.isPending}
                  className="btn-primary flex-1">
                  {crearMutation.isPending || actualizarMutation.isPending
                    ? 'Guardando...'
                    : editando ? 'Actualizar' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}