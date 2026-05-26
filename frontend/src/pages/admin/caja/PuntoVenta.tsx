import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Scan, Plus, Minus, Trash2, Receipt, X, Keyboard } from 'lucide-react'
import toast from 'react-hot-toast'
import { productosService, ventasService, cajaService, chatbotService } from '@/services'
import { useFormateo, useDebounce, useScanner } from '@/hooks'
import { CATEGORIAS_ICONOS, METODO_PAGO_LABEL } from '@/config/constants'
import { useAuthStore } from '@/store/authStore'
import { fuzzyFilterProductos } from '@/utils/fuzzySearch'
import InvoicePreview from './InvoicePreview'
import InteractionAlertModal from '@/components/shared/InteractionAlertModal'

interface ItemPOS {
  productoId: string
  nombre: string
  concentracion: string
  precioUnitario: number
  cantidad: number
}

export default function PuntoVenta() {
  const { cop, fechaCorta } = useFormateo()
  const { empleado } = useAuthStore()
  const qc = useQueryClient()

  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState<ItemPOS[]>([])
  const [metodo, setMetodo] = useState<string>('EFECTIVO')
  const [clienteId, setClienteId] = useState('')
  const [descuento, setDescuento] = useState(0)
  const [cajaId, setCajaId] = useState<string | null>(null)
  
  // Estado para la factura (tirilla)
  const [facturaVisible, setFacturaVisible] = useState<any>(null)

  // ── Interacción clínica ─────────────────────────────────
  const [alertasInteraccion, setAlertasInteraccion] = useState<any[] | null>(null)
  const [verificandoInteraccion, setVerificandoInteraccion] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const cobrarRef = useRef<HTMLButtonElement>(null)
  const debouncedQ = useDebounce(busqueda, 300)

  const { data: cajaActual } = useQuery({
    queryKey: ['caja', 'actual'],
    queryFn: cajaService.estadoActual,
  })
  useEffect(() => { if (cajaActual?.id) setCajaId(cajaActual.id) }, [cajaActual])

  useScanner((barcode) => {
    productosService.buscar({ q: barcode, limite: 1 }).then(res => {
      if (res.data && res.data.length > 0) {
        agregar(res.data[0])
        toast.success(`Producto agregado: ${res.data[0].nombre}`)
      } else {
        toast.error(`Producto no encontrado (${barcode})`)
      }
    })
  })

  const { data: resultados, isFetching } = useQuery({
    queryKey: ['pos', 'buscar', debouncedQ],
    queryFn: () => productosService.buscar({ q: debouncedQ, limite: 50 }),
    enabled: debouncedQ.length > 1,
  })

  const productos = useMemo(() => {
    const items = resultados?.data ?? []
    if (!debouncedQ) return items
    return fuzzyFilterProductos(items, debouncedQ, 0.3).map(r => r.producto)
  }, [resultados, debouncedQ])

  const subtotal = carrito.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0)
  const total = Math.max(0, subtotal - descuento)

  const agregar = (p: any) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.productoId === p.id)
      if (existe) return prev.map(i => i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, {
        productoId: p.id, nombre: p.nombre, concentracion: p.concentracion ?? '',
        precioUnitario: Number(p.precioVenta), cantidad: 1,
      }]
    })
    setBusqueda(''); searchRef.current?.focus()
  }

  const cambiarCantidad = (id: string, delta: number) => {
    setCarrito(prev => prev.map(i => i.productoId === id ? { ...i, cantidad: i.cantidad + delta } : i).filter(i => i.cantidad > 0))
  }

  // ── Verificar interacciones antes de cobrar ────────────
  const handleCobrarClick = async () => {
    if (carrito.length < 2) {
      // Sin interacciones posibles, cobrar directamente
      ventaMutation.mutate()
      return
    }

    setVerificandoInteraccion(true)
    try {
      const res = await chatbotService.verificarInteracciones(carrito.map(i => i.productoId))
      if (res?.tieneAlertas && res?.alertas?.length > 0) {
        setAlertasInteraccion(res.alertas)
      } else {
        ventaMutation.mutate()
      }
    } catch {
      // Si falla la verificación, permitir continuar
      ventaMutation.mutate()
    } finally {
      setVerificandoInteraccion(false)
    }
  }

  const handleConfirmarConInteraccion = () => {
    setAlertasInteraccion(null)
    ventaMutation.mutate()
  }

  const handleCancelarInteraccion = () => {
    setAlertasInteraccion(null)
  }

  const ventaMutation = useMutation({
    mutationFn: () => ventasService.registrar({
      sucursalId: empleado?.sucursalId ?? 1,
      cajaId: cajaId ?? undefined,
      clienteId: clienteId || undefined,
      metodoPago: metodo,
      descuento,
      items: carrito.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, precioUnitario: i.precioUnitario, descuento: 0 })),
    }),
    onSuccess: (data) => {
      toast.success('Venta registrada exitosamente')
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      
      // Mostrar tirilla
      setFacturaVisible({
        numero: data.ventaNum,
        fecha: new Date(),
        cajero: empleado?.nombre,
        items: [...carrito],
        subtotal,
        descuento,
        total: data.total,
        metodoPago: metodo
      })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Error al registrar venta')
    },
  })

  const abrirCajaMutation = useMutation({
    mutationFn: () => cajaService.abrirCaja({ sucursalId: empleado?.sucursalId ?? 1, montoApertura: 100000 }),
    onSuccess: (data) => {
      setCajaId(data.id)
      toast.success('Caja abierta exitosamente')
      qc.invalidateQueries({ queryKey: ['caja'] })
    },
  })

  // ── Keyboard Shortcuts ──────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignorar si hay un modal activo
    if (facturaVisible) return

    switch (e.key) {
      case 'F2':
        e.preventDefault()
        // Cobrar — usa click() para respetar disabled del botón
        if (!ventaMutation.isPending && carrito.length > 0 && cajaActual) {
          handleCobrarClick()
        }
        break
      case 'F4':
        e.preventDefault()
        // Reset carrito
        if (carrito.length > 0) {
          setCarrito([])
          setDescuento(0)
          setClienteId('')
          toast.success('Carrito limpiado')
        }
        break
      case 'F5':
        e.preventDefault()
        // Abrir caja
        if (!cajaActual && !abrirCajaMutation.isPending) {
          abrirCajaMutation.mutate()
        }
        break
      case 'F8':
        e.preventDefault()
        // Focus búsqueda
        searchRef.current?.focus()
        searchRef.current?.select()
        break
    }
  }, [carrito.length, cajaActual, facturaVisible, ventaMutation.isPending])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleCerrarTirilla = () => {
    setFacturaVisible(null)
    setCarrito([])
    setDescuento(0)
    setClienteId('')
  }

  return (
    <>
      {facturaVisible && (
        <InvoicePreview venta={facturaVisible} onClose={handleCerrarTirilla} />
      )}

      {alertasInteraccion && (
        <InteractionAlertModal
          alertas={alertasInteraccion}
          onConfirm={handleConfirmarConInteraccion}
          onCancel={handleCancelarInteraccion}
          loading={ventaMutation.isPending}
        />
      )}

      {/* Shortcuts hint (solo desktop) */}
      <div className="hidden md:flex items-center gap-2 mb-2 text-[10px] text-gray-400 dark:text-dark-text/40 px-1">
        <Keyboard size={10} />
        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-dark-surface rounded text-[9px] font-mono border border-gray-200 dark:border-dark-border">F2</kbd> Cobrar
        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-dark-surface rounded text-[9px] font-mono border border-gray-200 dark:border-dark-border">F4</kbd> Limpiar
        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-dark-surface rounded text-[9px] font-mono border border-gray-200 dark:border-dark-border">F5</kbd> Abrir caja
        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-dark-surface rounded text-[9px] font-mono border border-gray-200 dark:border-dark-border">F8</kbd> Buscar
      </div>

      <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-10rem)] gap-4 -m-6 p-0 overflow-hidden">
        {/* Panel izquierdo: productos */}
        <div className="flex-1 flex flex-col bg-[#F5F8F6] dark:bg-dark-surface/50 p-4 overflow-hidden min-h-[50vh] lg:min-h-0">
          {!cajaActual && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <span className="text-sm text-amber-700 font-medium">⚠️ Tu caja se encuentra cerrada</span>
              <button onClick={() => abrirCajaMutation.mutate()} disabled={abrirCajaMutation.isPending} className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors">
                Abrir caja base $100k
              </button>
            </div>
          )}

          <div className="relative mb-3">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input ref={searchRef} value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre o código de barras (Enter)..." aria-keyshortcuts="F8" className="input-base pl-10 pr-10" autoFocus />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-700 transition-colors" title="Escáner listo"><Scan size={16}/></button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain" role="listbox">
            {busqueda.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {isFetching
                  ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="card animate-pulse h-28"/>)
                  : productos.length === 0
                    ? <p className="col-span-full text-center py-12 text-gray-400 text-sm">Sin resultados para "{busqueda}"</p>
                    : productos.map((p: any) => (
                        <button key={p.id} onClick={() => agregar(p)} disabled={p.stockTotal === 0} className="card text-left hover:border-teal-300 hover:bg-teal-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{CATEGORIAS_ICONOS[p.categoria?.nombre] ?? '💊'}</span>
                            {p.requiereRx && <span className="badge-rx text-[10px]">RX</span>}
                          </div>
                          <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight mb-1">{p.nombre} {p.concentracion}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{p.stockTotal > 0 ? `${p.stockTotal} disponibles` : 'Agotado'}</p>
                          <p className="text-sm font-bold text-teal-700 mt-1">{cop(p.precioVenta)}</p>
                        </button>
                      ))
                }
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <span className="text-6xl mb-4">🛒</span>
                <p className="text-gray-500 font-medium">POS Farmacy</p>
                <p className="text-sm text-gray-400 mt-1">Busca un producto o usa el lector de código de barras</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho: carrito y cobro */}
        <div className="w-full lg:w-80 flex-shrink-0 bg-white dark:bg-dark-surface border-l border-[#D8EBE4] dark:border-dark-border flex flex-col">
          <div className="px-4 py-3 border-b border-[#D8EBE4] flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-gray-900">Venta actual</p>
              <p className="text-xs text-gray-400">{cajaActual ? `Caja abierta · ${fechaCorta(cajaActual.abiertaEn)}` : 'Sin caja abierta'}</p>
            </div>
            {carrito.length > 0 && (
              <button onClick={() => setCarrito([])} aria-keyshortcuts="F4" className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><X size={12}/> Limpiar</button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {carrito.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <p className="text-sm text-gray-400">Sin productos agregados</p>
              </div>
            ) : (
              <div className="divide-y divide-[#D8EBE4]">
                {carrito.map(item => (
                  <div key={item.productoId} className="px-4 py-3 flex gap-3 items-center hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{item.nombre}</p>
                      <p className="text-[10px] text-gray-400">{item.concentracion}</p>
                      <p className="text-xs text-teal-700 font-semibold mt-0.5">{cop(item.precioUnitario * item.cantidad)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-[#D8EBE4] rounded-full px-1 py-0.5">
                      <button onClick={() => cambiarCantidad(item.productoId, -1)} className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                        {item.cantidad === 1 ? <Trash2 size={10} className="text-red-400"/> : <Minus size={10}/>}
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item.productoId, 1)} className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"><Plus size={10}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#D8EBE4] p-4 space-y-3 bg-gray-50">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Descuento $</label>
              <input type="number" min="0" max={subtotal} value={descuento} onChange={e => setDescuento(Math.min(subtotal, Number(e.target.value)))} className="flex-1 text-sm px-2 py-1.5 border border-[#D8EBE4] rounded-lg outline-none focus:border-teal-400 text-right bg-white" />
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{cop(subtotal)}</span></div>
              {descuento > 0 && <div className="flex justify-between text-teal-600"><span>Descuento</span><span>- {cop(descuento)}</span></div>}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-[#D8EBE4]"><span>Total</span><span className="text-teal-700">{cop(total)}</span></div>
            </div>

            <select value={metodo} onChange={e => setMetodo(e.target.value)} className="w-full text-sm px-3 py-2 border border-[#D8EBE4] rounded-xl outline-none focus:border-teal-400 bg-white">
              {Object.entries(METODO_PAGO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>

            <button ref={cobrarRef} onClick={handleCobrarClick} disabled={carrito.length === 0 || !cajaActual || ventaMutation.isPending || verificandoInteraccion} aria-keyshortcuts="F2" className="w-full py-3 bg-teal-700 text-white rounded-xl font-bold text-sm hover:bg-teal-600 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-md">
              {verificandoInteraccion ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verificando...</>
              ) : (
                <><Receipt size={16}/> {ventaMutation.isPending ? 'Procesando...' : `Cobrar ${cop(total)}`}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
