import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, Search, Package, Save,
  Building2, Calendar,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { comprasService, proveedoresService, productosService } from '@/services'
import { useFormateo, useDebounce } from '@/hooks'

interface ItemOC {
  productoId: string
  nombre: string
  presentacion: string
  cantidadPedida: number
  precioUnitario: number
  subtotal: number
}

export default function NuevaOrden() {
  const { cop } = useFormateo()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [proveedorId, setProveedorId] = useState('')
  const [busqProd, setBusqProd] = useState('')
  const [items, setItems] = useState<ItemOC[]>([])
  const [notas, setNotas] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')

  const debouncedBusqProv = useDebounce(busqProd, 300)

  // Proveedores
  const { data: provData } = useQuery({
    queryKey: ['proveedores', 'list'],
    queryFn: () => proveedoresService.listar({ limite: 100 }),
  })
  const proveedores = useMemo(() => provData?.data ?? [], [provData])

  // Búsqueda de productos para agregar
  const { data: prodData, isFetching: prodFetching } = useQuery({
    queryKey: ['productos', 'buscar-oc', debouncedBusqProv],
    queryFn: () => productosService.listar({ q: debouncedBusqProv || undefined, limite: 15 }),
    enabled: debouncedBusqProv.length > 1,
  })
  const resultadosProductos = useMemo(() => {
    const r = prodData?.data ?? prodData ?? []
    return Array.isArray(r) ? r : []
  }, [prodData])

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.cantidadPedida * i.precioUnitario, 0),
    [items]
  )
  const total = subtotal

  function agregarProducto(p: any) {
    setItems(prev => {
      const existe = prev.find(i => i.productoId === p.id)
      if (existe) {
        return prev.map(i => i.productoId === p.id
          ? { ...i, cantidadPedida: i.cantidadPedida + 1, subtotal: (i.cantidadPedida + 1) * i.precioUnitario }
          : i
        )
      }
      return [...prev, {
        productoId: p.id,
        nombre: p.nombre,
        presentacion: p.presentacion ?? '',
        cantidadPedida: 1,
        precioUnitario: Number(p.precioPromedio) > 0 ? Number(p.precioPromedio) : Number(p.precioVenta),
        subtotal: 0,
      }]
    })
    setBusqProd('')
  }

  function actualizarItem(id: string, campo: 'cantidadPedida' | 'precioUnitario', valor: number) {
    setItems(prev => prev.map(i =>
      i.productoId === id
        ? { ...i, [campo]: valor, subtotal: (campo === 'cantidadPedida' ? valor : i.cantidadPedida) * (campo === 'precioUnitario' ? valor : i.precioUnitario) }
        : i
    ))
  }

  function eliminarItem(id: string) {
    setItems(prev => prev.filter(i => i.productoId !== id))
  }

  const createMutation = useMutation({
    mutationFn: () => comprasService.crearOrden({
      proveedorId,
      notas: notas || undefined,
      fechaEntregaEst: fechaEntrega || undefined,
      detalles: items.map(i => ({
        productoId: i.productoId,
        cantidadPedida: i.cantidadPedida,
        precioUnitario: i.precioUnitario,
      })),
    }),
    onSuccess: () => {
      toast.success('Orden de compra creada exitosamente')
      qc.invalidateQueries({ queryKey: ['compras'] })
      navigate('/admin/compras/ordenes')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Error al crear la orden')
    },
  })

  const puedeGuardar = proveedorId && items.length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/compras/ordenes')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva orden de compra</h1>
          <p className="text-sm text-gray-500 mt-1">Crea un pedido para abastecer tu inventario</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form principal */}
        <div className="lg:col-span-2 space-y-6">

          {/* Seleccionar proveedor */}
          <div className="surface p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Building2 size={16} className="text-teal-600" /> Proveedor
            </h2>
            <select
              value={proveedorId}
              onChange={e => setProveedorId(e.target.value)}
              className="input-base w-full"
            >
              <option value="">Seleccionar proveedor...</option>
              {proveedores.map((p: any) => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.nit})</option>
              ))}
            </select>
          </div>

          {/* Agregar productos */}
          <div className="surface p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Package size={16} className="text-teal-600" /> Productos
            </h2>

            <div className="relative mb-4">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={busqProd}
                onChange={e => setBusqProd(e.target.value)}
                placeholder="Buscar producto por nombre..."
                className="input-base pl-10"
              />
            </div>

            {busqProd.length > 1 && (
              <div className="mb-4 max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
                {prodFetching ? (
                  <div className="p-4 text-center text-gray-400 text-sm">Buscando...</div>
                ) : resultadosProductos.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">Sin resultados</div>
                ) : (
                  resultadosProductos.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => agregarProducto(p)}
                      className="w-full text-left px-4 py-3 hover:bg-teal-50 border-b last:border-b-0
                                 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.nombre}</p>
                        <p className="text-xs text-gray-400">{p.presentacion} · Stock: {p.stockTotal ?? 0}</p>
                      </div>
                      <Plus size={16} className="text-teal-600 flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Items agregados */}
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Package size={32} className="mx-auto mb-2 text-gray-300" />
                Busca y agrega productos a la orden
              </div>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.productoId}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.nombre}</p>
                      <p className="text-xs text-gray-400">{item.presentacion}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <label className="text-[10px] text-gray-400 block">Cant.</label>
                        <input
                          type="number" min="1" value={item.cantidadPedida}
                          onChange={e => actualizarItem(item.productoId, 'cantidadPedida', Math.max(1, Number(e.target.value)))}
                          className="w-16 text-sm px-2 py-1.5 border border-gray-200 rounded-lg text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block">Precio</label>
                        <input
                          type="number" min="0" value={item.precioUnitario}
                          onChange={e => actualizarItem(item.productoId, 'precioUnitario', Math.max(0, Number(e.target.value)))}
                          className="w-20 text-sm px-2 py-1.5 border border-gray-200 rounded-lg text-right"
                        />
                      </div>
                      <div className="text-right min-w-[80px]">
                        <label className="text-[10px] text-gray-400 block">Subtotal</label>
                        <p className="text-sm font-semibold text-gray-800">{cop(item.cantidadPedida * item.precioUnitario)}</p>
                      </div>
                      <button onClick={() => eliminarItem(item.productoId)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notas */}
          <div className="surface p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Notas</h2>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Instrucciones especiales para el proveedor..."
              className="input-base w-full min-h-[80px] resize-none"
            />
          </div>
        </div>

        {/* Sidebar — resumen */}
        <div className="space-y-6">
          <div className="surface p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Resumen</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Productos</span>
                <span className="font-medium text-gray-800">{items.length}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Unidades</span>
                <span className="font-medium text-gray-800">
                  {items.reduce((s, i) => s + i.cantidadPedida, 0)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total estimado</span>
                <span className="text-teal-700">{cop(total)}</span>
              </div>
            </div>
          </div>

          {/* Fecha entrega */}
          <div className="surface p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-teal-600" /> Fecha entrega est.
            </h2>
            <input
              type="date"
              value={fechaEntrega}
              onChange={e => setFechaEntrega(e.target.value)}
              className="input-base w-full"
            />
          </div>

          {/* Guardar */}
          <button
            onClick={() => createMutation.mutate()}
            disabled={!puedeGuardar || createMutation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            <Save size={16} />
            {createMutation.isPending ? 'Creando...' : 'Crear orden'}
          </button>
        </div>
      </div>
    </div>
  )
}
