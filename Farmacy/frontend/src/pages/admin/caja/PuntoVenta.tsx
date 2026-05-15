import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Scan, Plus, Minus, Trash2, Receipt, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { productosService, ventasService, cajaService, pagosService } from '@/services'
import { useFormateo, useDebounce, useScanner } from '@/hooks'
import { CATEGORIAS_ICONOS, METODO_PAGO_LABEL } from '@/config/constants'
import { useAuthStore } from '@/store/authStore'
import { fuzzyFilterProductos } from '@/utils/fuzzySearch'

interface ItemPOS {
  productoId:    string
  nombre:        string
  concentracion: string
  precioUnitario:number
  cantidad:      number
}

export default function PuntoVenta() {
  const { cop, fechaCorta } = useFormateo()
  const { empleado }        = useAuthStore()
  const qc                  = useQueryClient()

  const [busqueda,  setBusqueda]  = useState('')
  const [carrito,   setCarrito]   = useState<ItemPOS[]>([])
  const [metodo,    setMetodo]    = useState<string>('EFECTIVO')
  const [clienteId, setClienteId] = useState('')
  const [descuento, setDescuento] = useState(0)
  const [cajaId,    setCajaId]    = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const debouncedQ = useDebounce(busqueda, 300)

  // Estado caja actual
  const { data: cajaActual } = useQuery({
    queryKey: ['caja', 'actual'],
    queryFn:  cajaService.estadoActual,
  })
  useEffect(() => { if (cajaActual?.id) setCajaId(cajaActual.id) }, [cajaActual])

  // Lector de códigos de barras (Escáner USB/Bluetooth)
  useScanner((barcode) => {
    toast('Código escaneado: ' + barcode, { icon: '📟' })
    productosService.buscar({ q: barcode, limite: 1 }).then(res => {
      if (res.data && res.data.length > 0) {
        // En un caso real, validar que res.data[0].codigoBarras === barcode
        agregar(res.data[0])
      } else {
        toast.error(`Producto no encontrado (${barcode})`)
      }
    })
  })

  // Búsqueda de productos (API + fuzzy matching local)
  const { data: resultados, isFetching } = useQuery({
    queryKey: ['pos', 'buscar', debouncedQ],
    queryFn:  () => productosService.buscar({ q: debouncedQ, limite: 50 }),
    enabled:  debouncedQ.length > 1, // Solo buscar con 2+ caracteres
  })

  // Aplicar fuzzy search a los resultados para mejor ordenamiento
  const productos = useMemo(() => {
    const items = resultados?.data ?? []
    if (!debouncedQ) return items
    
    const fuzzyResults = fuzzyFilterProductos(items, debouncedQ, 0.3)
    return fuzzyResults.map(r => r.producto)
  }, [resultados, debouncedQ])

  // Calcular totales
  const subtotal = carrito.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0)
  const total    = Math.max(0, subtotal - descuento)

  // Agregar al carrito
  const agregar = (p: any) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.productoId === p.id)
      if (existe) return prev.map(i => i.productoId === p.id
        ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, {
        productoId: p.id, nombre: p.nombre,
        concentracion: p.concentracion ?? '',
        precioUnitario: Number(p.precioVenta), cantidad: 1,
      }]
    })
    setBusqueda('')
    searchRef.current?.focus()
  }

  const cambiarCantidad = (id: string, delta: number) => {
    setCarrito(prev => prev
      .map(i => i.productoId === id ? { ...i, cantidad: i.cantidad + delta } : i)
      .filter(i => i.cantidad > 0)
    )
  }

  // Registrar venta
  const ventaMutation = useMutation({
    mutationFn: () => ventasService.registrar({
      sucursalId: empleado?.sucursalId ?? 1,
      cajaId:     cajaId ?? undefined,
      clienteId:  clienteId || undefined,
      metodoPago: metodo,
      descuento,
      items: carrito.map(i => ({
        productoId:     i.productoId,
        cantidad:       i.cantidad,
        precioUnitario: i.precioUnitario,
        descuento:      0,
      })),
    }),
    onSuccess: (data) => {
      toast.success(`✅ Factura #F-${String(data.ventaNum).padStart(4,'0')} — ${cop(data.total)}`)
      setCarrito([]); setDescuento(0); setClienteId('')
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Error al registrar venta')
    },
  })

  // Abrir caja si no hay una
  const abrirCajaMutation = useMutation({
    mutationFn: () => cajaService.abrirCaja({
      sucursalId: empleado?.sucursalId ?? 1,
      montoApertura: 100000,
    }),
    onSuccess: (data) => {
      setCajaId(data.id)
      toast.success('Caja abierta')
      qc.invalidateQueries({ queryKey: ['caja'] })
    },
  })

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 -m-6 p-0 overflow-hidden">

      {/* ── Panel izquierdo: productos ── */}
      <div className="flex-1 flex flex-col bg-[#F5F8F6] p-4 overflow-hidden">

        {/* Alerta caja cerrada */}
        {!cajaActual && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl
                          flex items-center justify-between">
            <span className="text-sm text-amber-700 font-medium">⚠️ No hay caja abierta</span>
            <button onClick={() => abrirCajaMutation.mutate()}
              disabled={abrirCajaMutation.isPending}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium
                         hover:bg-amber-700 transition-colors">
              Abrir caja
            </button>
          </div>
        )}

        {/* Búsqueda */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            ref={searchRef}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o código de barras..."
            className="input-base pl-10 pr-10"
            autoFocus
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                             hover:text-teal-700 transition-colors" title="Escanear (demo)">
            <Scan size={16}/>
          </button>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto">
          {busqueda.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {isFetching
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="card animate-pulse h-28"/>
                  ))
                : productos.length === 0
                  ? <p className="col-span-full text-center py-12 text-gray-400 text-sm">
                      Sin resultados para "{busqueda}"
                    </p>
                  : productos.map((p: any) => (
                      <button key={p.id} onClick={() => agregar(p)}
                        disabled={p.stockTotal === 0}
                        className="card text-left hover:border-teal-300 hover:bg-teal-50
                                   active:scale-95 transition-all disabled:opacity-40
                                   disabled:cursor-not-allowed p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">
                            {CATEGORIAS_ICONOS[p.categoria?.nombre] ?? '💊'}
                          </span>
                          {p.requiereRx && <span className="badge-rx text-[10px]">RX</span>}
                        </div>
                        <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight mb-1">
                          {p.nombre} {p.concentracion}
                        </p>
                        <p className="text-xs text-gray-400 mb-1">{p.presentacion}</p>
                        <p className="text-sm font-bold text-teal-700">{cop(p.precioVenta)}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {p.stockTotal > 0 ? `${p.stockTotal} disponibles` : 'Agotado'}
                        </p>
                      </button>
                    ))
              }
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="text-6xl mb-4">🔍</span>
              <p className="text-gray-500 font-medium">Busca un producto</p>
              <p className="text-sm text-gray-400 mt-1">Escribe el nombre o escanea el código de barras</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Panel derecho: carrito y cobro ── */}
      <div className="w-80 flex-shrink-0 bg-white border-l border-[#D8EBE4] flex flex-col">

        {/* Encabezado carrito */}
        <div className="px-4 py-3 border-b border-[#D8EBE4] flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm text-gray-900">Venta actual</p>
            <p className="text-xs text-gray-400">
              {cajaActual
                ? `Caja abierta · ${fechaCorta(cajaActual.abiertaEn)}`
                : 'Sin caja abierta'}
            </p>
          </div>
          {carrito.length > 0 && (
            <button onClick={() => setCarrito([])}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
              <X size={12}/> Limpiar
            </button>
          )}
        </div>

        {/* Items del carrito */}
        <div className="flex-1 overflow-y-auto">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <span className="text-4xl mb-3">🛒</span>
              <p className="text-sm text-gray-500">Agrega productos buscando en el panel izquierdo</p>
            </div>
          ) : (
            <div className="divide-y divide-[#D8EBE4]">
              {carrito.map(item => (
                <div key={item.productoId} className="px-4 py-3 flex gap-3 items-center">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{item.nombre}</p>
                    <p className="text-[10px] text-gray-400">{item.concentracion}</p>
                    <p className="text-xs text-teal-700 font-semibold mt-0.5">
                      {cop(item.precioUnitario * item.cantidad)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => cambiarCantidad(item.productoId, -1)}
                      className="w-6 h-6 rounded-full border border-[#D8EBE4] flex items-center
                                 justify-center hover:border-teal-400 transition-colors">
                      {item.cantidad === 1 ? <Trash2 size={10} className="text-red-400"/> : <Minus size={10}/>}
                    </button>
                    <span className="text-sm font-bold w-5 text-center">{item.cantidad}</span>
                    <button onClick={() => cambiarCantidad(item.productoId, 1)}
                      className="w-6 h-6 rounded-full border border-[#D8EBE4] flex items-center
                                 justify-center hover:border-teal-400 transition-colors">
                      <Plus size={10}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totales y cobro */}
        <div className="border-t border-[#D8EBE4] p-4 space-y-3">
          {/* Descuento */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">Descuento $</label>
            <input
              type="number" min="0" max={subtotal} value={descuento}
              onChange={e => setDescuento(Math.min(subtotal, Number(e.target.value)))}
              className="flex-1 text-sm px-2 py-1.5 border border-[#D8EBE4] rounded-lg
                         outline-none focus:border-teal-400 text-right"
            />
          </div>

          {/* Totales */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span><span>{cop(subtotal)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-teal-600">
                <span>Descuento</span><span>- {cop(descuento)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-400 text-xs">
              <span>IVA medicamentos</span><span>$0</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-[#D8EBE4]">
              <span>Total</span>
              <span className="text-teal-700">{cop(total)}</span>
            </div>
          </div>

          {/* Método de pago */}
          <select
            value={metodo}
            onChange={e => setMetodo(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-[#D8EBE4] rounded-xl
                       outline-none focus:border-teal-400 bg-[#F5F8F6]"
          >
            {Object.entries(METODO_PAGO_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* Botón cobrar */}
          <button
            onClick={() => ventaMutation.mutate()}
            disabled={carrito.length === 0 || !cajaActual || ventaMutation.isPending}
            className="w-full py-3.5 bg-teal-700 text-white rounded-xl font-bold text-sm
                       hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all flex items-center justify-center gap-2"
          >
            <Receipt size={16}/>
            {ventaMutation.isPending ? 'Procesando...' : `Cobrar ${cop(total)}`}
          </button>
        </div>
      </div>
    </div>
  )
}