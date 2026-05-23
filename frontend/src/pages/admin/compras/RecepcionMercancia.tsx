import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Truck, Package, ChevronRight,
  Calendar, Hash, DollarSign, ClipboardList, Save,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { comprasService, productosService } from '@/services'
import { useFormateo } from '@/hooks'
import { useAuthStore } from '@/store/authStore'

interface LoteRecibir {
  productoId: string
  nombre: string
  presentacion: string
  cantidadPedida: number
  codigoLote: string
  cantidad: number
  fechaVencimiento: string
  precioCompra: number
}

interface ItemOrden {
  productoId: string
  nombre: string
  presentacion: string
  cantidadPedida: number
  precioUnitario: number
}

interface ProductoResult {
  id: string
  nombre: string
  presentacion?: string
  precioPromedio?: number
  precioVenta?: number
  stockTotal?: number
}

export default function RecepcionMercancia() {
  const { cop, fechaCorta } = useFormateo()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const empleado = useAuthStore((s) => s.empleado)

  const [ordenId, setOrdenId] = useState('')
  const [sucursalId] = useState(empleado?.sucursalId ?? 1)
  const [lotes, setLotes] = useState<LoteRecibir[]>([])
  const [step, setStep] = useState<'select' | 'receive'>('select')

  // Órdenes PENDIENTES
  const { data: ordenesData } = useQuery({
    queryKey: ['compras', 'pendientes'],
    queryFn: () => comprasService.listarOrdenes({ estado: 'PENDIENTE', limite: 100 }),
  })

  const ordenesPendientes = useMemo(() => ordenesData?.data ?? [], [ordenesData])

  // Detalle de la orden seleccionada (via service layer)
  const { data: ordenDetalle, isLoading: detalleLoading } = useQuery({
    queryKey: ['compras', 'detalle', ordenId],
    queryFn: () => comprasService.obtenerOrden(ordenId),
    enabled: !!ordenId,
  })

  const itemsOrden: ItemOrden[] = useMemo(() => {
    if (!ordenDetalle?.detalles) return []
    return ordenDetalle.detalles.map((d: any) => ({
      productoId: d.productoId,
      nombre: d.producto?.nombre ?? 'Producto',
      presentacion: d.producto?.presentacion ?? '',
      cantidadPedida: d.cantidadPedida,
      precioUnitario: Number(d.precioUnitario),
    }))
  }, [ordenDetalle])

  // Pre-fill lotes when order details load
  useEffect(() => {
    if (step === 'receive' && itemsOrden.length > 0 && lotes.length === 0) {
      setLotes(itemsOrden.map((item) => ({
        productoId: item.productoId,
        nombre: item.nombre,
        presentacion: item.presentacion,
        cantidadPedida: item.cantidadPedida,
        codigoLote: '',
        cantidad: item.cantidadPedida,
        fechaVencimiento: '',
        precioCompra: item.precioUnitario,
      })))
    }
  }, [step, itemsOrden, lotes.length])

  function seleccionarOrden(id: string) {
    setOrdenId(id)
    setStep('receive')
    setLotes([])
  }

  function volver() {
    setOrdenId('')
    setStep('select')
    setLotes([])
  }

  function actualizarLote(index: number, campo: keyof LoteRecibir, valor: string | number) {
    setLotes(prev => prev.map((l, i) => i === index ? { ...l, [campo]: valor } : l))
  }

  const receiveMutation = useMutation({
    mutationFn: () => comprasService.recibirMercancia(ordenId, {
      sucursalId,
      lotes: lotes.map(l => ({
        productoId: l.productoId,
        codigoLote: l.codigoLote,
        cantidad: l.cantidad,
        fechaVencimiento: l.fechaVencimiento,
        precioCompra: l.precioCompra,
      })),
    }),
    onSuccess: () => {
      toast.success('Mercancía recibida y lotes creados exitosamente')
      qc.invalidateQueries({ queryKey: ['compras'] })
      qc.invalidateQueries({ queryKey: ['lotes'] })
      navigate('/admin/compras/ordenes')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Error al recibir mercancía')
    },
  })

  const lotesValidos = lotes.length > 0 &&
    lotes.every(l => l.codigoLote && l.fechaVencimiento && l.cantidad > 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => step === 'select' ? navigate('/admin/compras/ordenes') : volver()}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recepción de mercancía</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 'select'
              ? 'Selecciona una orden de compra pendiente para recibir'
              : 'Registra los lotes recibidos para cada producto'}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 text-sm">
        <div className={`flex items-center gap-2 ${step === 'select' ? 'text-teal-700 font-semibold' : 'text-gray-400'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
            ${step === 'select' ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
          Seleccionar orden
        </div>
        <div className="w-8 h-px bg-gray-200" />
        <div className={`flex items-center gap-2 ${step === 'receive' ? 'text-teal-700 font-semibold' : 'text-gray-400'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
            ${step === 'receive' ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
          Registrar lotes
        </div>
      </div>

      {/* Step 1: Select order */}
      {step === 'select' && (
        <div className="surface overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Órdenes pendientes</h2>
          </div>

          {ordenesPendientes.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <ClipboardList size={40} className="mx-auto mb-3 text-gray-300" />
              <p>No hay órdenes pendientes por recibir</p>
              <button onClick={() => navigate('/admin/compras/nueva')}
                className="text-teal-700 font-medium text-sm mt-3 inline-flex items-center gap-1 hover:underline">
                Crear nueva orden
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ordenesPendientes.map((o: any) => (
                <button
                  key={o.id}
                  onClick={() => seleccionarOrden(o.id)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                      <Truck size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {o.proveedor?.nombre ?? 'Proveedor'}
                      </p>
                      <p className="text-xs text-gray-400">
                        OC-{String(o.numero ?? o.id).slice(0, 8)} · {fechaCorta(o.creadoEn)} · {o._count?.detalles ?? 0} producto(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-800">{cop(Number(o.total))}</span>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Register lots */}
      {step === 'receive' && (
        <>
          {/* Order summary */}
          {ordenDetalle && (
            <div className="surface p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{ordenDetalle.proveedor?.nombre}</h2>
                  <p className="text-sm text-gray-500">
                    OC-{String(ordenDetalle.numero ?? ordenDetalle.id).slice(0, 8)} · {fechaCorta(ordenDetalle.creadoEn)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{cop(Number(ordenDetalle.total))}</p>
                  <p className="text-xs text-gray-400">{lotes.length} producto(s)</p>
                </div>
              </div>
            </div>
          )}

          {/* Lots form */}
          <div className="surface overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Registrar lotes</h2>
              {lotes.length > 0 && (
                <span className="text-xs text-gray-500">
                  {lotes.filter(l => l.codigoLote && l.fechaVencimiento).length} de {lotes.length} completados
                </span>
              )}
            </div>

            <div className="p-5">
              {detalleLoading ? (
                <div className="p-8 text-center text-gray-400">
                  <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Cargando detalles de la orden...
                </div>
              ) : lotes.length === 0 ? (
                <div className="text-center py-8">
                  <Package size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">No se encontraron productos en esta orden</p>
                  <div className="mt-4">
                    <AddProductToReceive
                      onAdd={(producto) => {
                        setLotes(prev => [...prev, {
                          productoId: producto.id,
                          nombre: producto.nombre,
                          presentacion: producto.presentacion ?? '',
                          cantidadPedida: 1,
                          codigoLote: '',
                          cantidad: 1,
                          fechaVencimiento: '',
                          precioCompra: Number(producto.precioPromedio) > 0 ? Number(producto.precioPromedio) : Number(producto.precioVenta),
                        } as LoteRecibir])
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {lotes.map((lote, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Package size={16} className="text-teal-600" />
                        <span className="text-sm font-semibold text-gray-800">{lote.nombre}</span>
                        <span className="text-xs text-gray-400">{lote.presentacion}</span>
                        <span className="text-xs text-gray-400 ml-auto">
                          Pedido: {lote.cantidadPedida} uds
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="label">Código lote *</label>
                          <div className="relative">
                            <Hash size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              value={lote.codigoLote}
                              onChange={e => actualizarLote(idx, 'codigoLote', e.target.value)}
                              className="input-base pl-8"
                              placeholder="LOT-001"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="label">Cantidad *</label>
                          <input
                            type="number" min="1" max={lote.cantidadPedida * 2}
                            value={lote.cantidad}
                            onChange={e => actualizarLote(idx, 'cantidad', Math.max(1, Number(e.target.value)))}
                            className="input-base"
                          />
                        </div>
                        <div>
                          <label className="label">Vence *</label>
                          <div className="relative">
                            <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="date"
                              value={lote.fechaVencimiento}
                              onChange={e => actualizarLote(idx, 'fechaVencimiento', e.target.value)}
                              className="input-base pl-8"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="label">Precio compra</label>
                          <div className="relative">
                            <DollarSign size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="number" min="0"
                              value={lote.precioCompra}
                              onChange={e => actualizarLote(idx, 'precioCompra', Math.max(0, Number(e.target.value)))}
                              className="input-base pl-8"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add more products */}
                  <div className="pt-4 border-t border-gray-100">
                    <AddProductToReceive
                      onAdd={(producto) => {
                        setLotes(prev => [...prev, {
                          productoId: producto.id,
                          nombre: producto.nombre,
                          presentacion: producto.presentacion ?? '',
                          cantidadPedida: 1,
                          codigoLote: '',
                          cantidad: 1,
                          fechaVencimiento: '',
                          precioCompra: Number(producto.precioPromedio) > 0 ? Number(producto.precioPromedio) : Number(producto.precioVenta),
                        } as LoteRecibir])
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <button onClick={volver} className="btn-ghost">Volver</button>
            <button
              onClick={() => receiveMutation.mutate()}
              disabled={!lotesValidos || receiveMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={16} />
              {receiveMutation.isPending ? 'Procesando...' : `Recibir ${lotes.length} lote(s)`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function AddProductToReceive({ onAdd }: { onAdd: (producto: ProductoResult) => void }) {
  const [q, setQ] = useState('')
  const { data, isFetching } = useQuery({
    queryKey: ['productos', 'buscar-recibir', q],
    queryFn: () => productosService.listar({ q: q || undefined, limite: 10 }),
    enabled: q.length > 1,
  })
  const results: ProductoResult[] = Array.isArray(data?.data) ? data.data : []

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
        Agregar producto manualmente
      </p>
      <div className="relative">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar producto..."
          className="input-base w-full"
        />
      </div>
      {q.length > 1 && (
        <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
          {isFetching ? (
            <div className="p-3 text-sm text-gray-400">Buscando...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-gray-400">Sin resultados</div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                onClick={() => { onAdd(p); setQ('') }}
                className="w-full text-left px-4 py-2.5 hover:bg-teal-50 border-b last:border-b-0
                           flex items-center justify-between text-sm transition-colors"
              >
                <span className="font-medium text-gray-800">{p.nombre}</span>
                <span className="text-xs text-gray-400">Stock: {p.stockTotal ?? 0}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
