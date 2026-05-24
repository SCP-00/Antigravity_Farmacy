import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Package, AlertTriangle, FileText, Activity } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { productosService } from '@/services'
import { useCategorias, useFormateo, useDebounce } from '@/hooks'

const productoSchema = z.object({
  registroInvima:    z.string().min(5, 'Registro INVIMA requerido'),
  cum:               z.string().min(3, 'CUM requerido'),
  nombre:            z.string().min(2, 'Nombre comercial requerido'),
  principioActivo:   z.string().min(2, 'Principio activo requerido'),
  atc:               z.string().optional().nullable().or(z.literal('')),
  titular:           z.string().optional().nullable().or(z.literal('')),
  formaFarmaceutica: z.string().optional().nullable().or(z.literal('')),
  viaAdministracion: z.string().optional().nullable().or(z.literal('')),
  concentracion:     z.string().optional().nullable().or(z.literal('')),
  presentacion:      z.string().optional().nullable().or(z.literal('')),
  laboratorio:       z.string().optional().nullable().or(z.literal('')),
  descripcion:       z.string().optional().nullable().or(z.literal('')),
  categoriaId:       z.coerce.number().int().positive('Selecciona una categoría'),
  requiereRx:        z.boolean().default(false),
  precioVenta:       z.coerce.number().positive('El precio debe ser mayor a 0'),
  stockMinimo:       z.coerce.number().int().min(0).default(10),
  alergenos:         z.string().optional().nullable().or(z.literal('')),
  advertencias:      z.string().optional().nullable().or(z.literal('')),
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
      toast.success('Medicamento registrado en inventario')
      qc.invalidateQueries({ queryKey: ['admin', 'productos'] })
      setModalOpen(false); reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Error al registrar producto'),
  })

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      productosService.actualizar(id, data),
    onSuccess: () => {
      toast.success('Ficha del producto actualizada')
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
      registroInvima:    p.registroInvima,
      cum:               p.cum,
      nombre:            p.nombre,
      principioActivo:   p.principioActivo,
      atc:               p.atc ?? '',
      titular:           p.titular ?? '',
      formaFarmaceutica: p.formaFarmaceutica ?? '',
      viaAdministracion: p.viaAdministracion ?? '',
      concentracion:     p.concentracion ?? '',
      presentacion:      p.presentacion ?? '',
      laboratorio:       p.laboratorio ?? '',
      categoriaId:       p.categoriaId,
      requiereRx:        p.requiereRx,
      precioVenta:       Number(p.precioVenta),
      stockMinimo:       p.stockMinimo,
      alergenos:         p.alergenos ?? '',
      advertencias:      p.advertencias ?? '',
      descripcion:       p.descripcion ?? '',
    })
    setModalOpen(true)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventario de Medicamentos</h1>
          <p className="text-sm text-gray-400 mt-0.5">{data?.meta?.total ?? 0} presentaciones comerciales (CUM) registradas</p>
        </div>
        <button onClick={() => { setEditando(null); reset(); setModalOpen(true) }}
          className="btn-primary">
          <Plus size={16}/> Registrar Medicamento
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por CUM, principio activo o nombre..."
          className="input-base pl-10"/>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F8F6] border-b border-[#D8EBE4]">
              <tr>
                {['CUM / Medicamento', 'Principio Activo', 'Stock', 'Mínimo', 'Precio Venta', 'Reglamento', 'Muestra', ''].map(h => (
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
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded">
                              {p.cum}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900 mt-1">{p.nombre}</p>
                          <p className="text-xs text-gray-400">
                            {p.concentracion} · {p.laboratorio}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-700 max-w-[150px] truncate">{p.principioActivo}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{p.atc || 'ATC N/A'}</p>
                        </td>
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
                            ? <span className="badge-rx">RX (Receta)</span>
                            : <span className="badge-otc">OTC (Libre)</span>}
                        </td>
                        <td className="px-4 py-3">
                          {p.esMuestraMedica
                            ? <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-md border border-red-200">Muestra (Bloqueada)</span>
                            : <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium rounded-md border border-slate-200">Comercial</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => abrirEditar(p)}
                            className="text-xs text-teal-700 hover:underline font-semibold">
                            Editar ficha
                          </button>
                        </td>
                      </tr>
                    )
                  })}
              {!isLoading && productos.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Package size={40} className="mx-auto text-gray-200 mb-3"/>
                    <p className="text-gray-400">Sin productos registrados en esta sede</p>
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
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#D8EBE4] bg-slate-50 rounded-t-3xl">
              <div>
                <h2 className="font-bold text-lg text-slate-950">
                  {editando ? 'Modificar Ficha Regulatoria' : 'Nuevo Medicamento (Estándar INVIMA)'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Control sanitario y comercial bajo Decreto 2200 de 2005</p>
              </div>
              <button onClick={() => { setModalOpen(false); setEditando(null) }}
                className="w-8 h-8 rounded-full flex items-center justify-center
                           hover:bg-gray-200 text-gray-400 transition-colors">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              
              {/* Bloque 1: Identificación INVIMA */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><FileText size={14}/> Datos de Registro Sanitario</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">CUM (Código de Barras/Presentación) *</label>
                    <input {...register('cum')} className="input-base" placeholder="Ej: 3521-3"/>
                    {errors.cum && <p className="text-xs text-red-500 mt-1">{errors.cum.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Registro Sanitario INVIMA *</label>
                    <input {...register('registroInvima')} className="input-base" placeholder="Ej: INVIMA 2021M-002103-R3"/>
                    {errors.registroInvima && <p className="text-xs text-red-500 mt-1">{errors.registroInvima.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Principio Activo *</label>
                    <input {...register('principioActivo')} className="input-base" placeholder="Ej: CETIRIZINA DICLORHIDRATO"/>
                    {errors.principioActivo && <p className="text-xs text-red-500 mt-1">{errors.principioActivo.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Código ATC</label>
                    <input {...register('atc')} className="input-base" placeholder="Ej: R06AE07"/>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Atributos Comerciales */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Activity size={14}/> Datos Comerciales</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Comercial *</label>
                    <input {...register('nombre')} className="input-base" placeholder="Ej: ALERCET JARABE"/>
                    {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Categoría *</label>
                    <select {...register('categoriaId')} className="input-base bg-white">
                      <option value="">Seleccionar...</option>
                      {(categorias ?? []).map((c: any) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                    {errors.categoriaId && <p className="text-xs text-red-500 mt-1">{errors.categoriaId.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Fabricante / Laboratorio</label>
                    <input {...register('laboratorio')} className="input-base" placeholder="Ej: PROCAPS S.A."/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Titular de Registro</label>
                    <input {...register('titular')} className="input-base" placeholder="Ej: PROCAPS S.A."/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Precio de Venta *</label>
                    <input {...register('precioVenta')} type="number" step="any" className="input-base" placeholder="18500"/>
                    {errors.precioVenta && <p className="text-xs text-red-500 mt-1">{errors.precioVenta.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Stock de Control Mínimo</label>
                    <input {...register('stockMinimo')} type="number" className="input-base" placeholder="10"/>
                  </div>
                </div>
              </div>

              {/* Bloque 3: Dosificación y Farmacovigilancia */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><AlertTriangle size={14}/> Dosificación y Seguridad</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Forma Farmacéutica</label>
                    <input {...register('formaFarmaceutica')} className="input-base" placeholder="Ej: JARABE, TABLETA"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Vía de Administración</label>
                    <input {...register('viaAdministracion')} className="input-base" placeholder="Ej: ORAL"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Concentración</label>
                    <input {...register('concentracion')} className="input-base" placeholder="Ej: 5mg / 5ml"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción Comercial de Presentación</label>
                    <input {...register('presentacion')} className="input-base" placeholder="Ej: Frasco de vidrio por 60 ML"/>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Alérgenos / Excipientes Críticos</label>
                    <input {...register('alergenos')} className="input-base" placeholder="Ej: Sorbitol, Tartrazina, Lactosa"/>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Advertencias y Contraindicaciones</label>
                    <textarea {...register('advertencias')} rows={2} className="input-base resize-none" placeholder="Ej: Puede producir somnolencia. No consumir con alcohol..."/>
                  </div>
                </div>
              </div>

              {/* Checkboxes de Regulaciones Especiales */}
              <div className="flex flex-wrap gap-6 pt-3 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input {...register('requiereRx')} type="checkbox"
                    className="w-4 h-4 rounded accent-teal-700"/>
                  <div className="text-xs">
                    <p className="font-semibold text-gray-800">Requiere Fórmula Médica (Rx)</p>
                    <p className="text-gray-400">Se le exigirá receta al cliente en caja y web.</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button"
                  onClick={() => { setModalOpen(false); setEditando(null) }}
                  className="btn-secondary flex-1 justify-center">
                  Cancelar
                </button>
                <button type="submit"
                  disabled={crearMutation.isPending || actualizarMutation.isPending}
                  className="btn-primary flex-1 justify-center">
                  {crearMutation.isPending || actualizarMutation.isPending
                    ? 'Procesando...'
                    : editando ? 'Actualizar Medicamento' : 'Registrar en Inventario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}