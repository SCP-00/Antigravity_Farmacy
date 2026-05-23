import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, CreditCard, Lock } from 'lucide-react'
import { useCarritoStore } from '@/store/carritoStore'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { ventasService } from '@/services'
import { useAuthCliente } from '@/hooks'
import toast from 'react-hot-toast'

export function Checkout() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { items, subtotal, total, limpiar } = useCarritoStore()
  const { cliente } = useAuthCliente()
  
  const [paso, setPaso] = useState<'datos' | 'pago' | 'confirmacion'>('datos')
  const [pedidoInfo, setPedidoInfo] = useState<{ numero: number, total: number } | null>(null)

  const [datos, setDatos] = useState({ 
    nombre: cliente?.nombre || '', 
    email: cliente?.email || '', 
    telefono: '', 
    direccion: '' 
  })
  
  const [pago, setPago] = useState({ nombre: '', numero: '', mes: '', año: '', cvv: '' })

  const esDatos = paso === 'datos'
  const esPago = paso === 'pago'
  const esConfirmacion = paso === 'confirmacion'

  const ventaMutation = useMutation({
    mutationFn: () => ventasService.registrar({
      sucursalId: 1, // Por defecto al comprar web se asigna a sede principal
      clienteId: cliente?.id, // ID del cliente si está logueado
      metodoPago: 'STRIPE', // Simulación del método de pago
      descuento: 0,
      items: items.map(i => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
        descuento: 0
      }))
    }),
    onSuccess: (data) => {
      setPedidoInfo({ numero: data.ventaNum, total: data.total })
      limpiar()
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['cliente', 'pedidos'] })
      setPaso('confirmacion')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Error procesando tu pedido')
    }
  })

  if (items.length === 0 && paso !== 'confirmacion') {
    return (
      <div className="section-shell py-12">
        <div className="surface min-h-[60vh] flex items-center justify-center px-6 text-center">
          <div className="max-w-md">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Tu carrito está vacío</h1>
            <p className="text-slate-600 mb-6">Agrega productos antes de continuar al checkout.</p>
            <button onClick={() => navigate('/productos')} className="btn-primary">Volver al catálogo</button>
          </div>
        </div>
      </div>
    )
  }

  const continuar = () => {
    if (!datos.nombre || !datos.email || !datos.telefono || !datos.direccion) {
      toast.error('Completa los datos de envío')
      return
    }
    setPaso('pago')
  }

  const confirmar = () => {
    if (!pago.nombre || !pago.numero || !pago.mes || !pago.año || !pago.cvv) {
      toast.error('Completa los datos de tu tarjeta')
      return
    }
    ventaMutation.mutate()
  }

  if (paso === 'confirmacion') {
    return (
      <div className="section-shell py-12">
        <div className="surface min-h-[70vh] flex items-center justify-center px-6 text-center">
          <div className="max-w-md w-full">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Pedido confirmado</h1>
            <p className="text-slate-600 mb-6">Tu orden fue creada con éxito y el pago ha sido procesado.</p>
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 mb-6">
              <p className="text-sm text-slate-500 mb-1">Número de pedido</p>
              <p className="text-3xl font-bold text-teal-700">
                F-{String(pedidoInfo?.numero ?? 0).padStart(5, '0')}
              </p>
              <p className="text-sm text-slate-500 mt-2">Total cobrado: ${pedidoInfo?.total.toLocaleString()}</p>
            </div>
            <button onClick={() => navigate('/cuenta/pedidos')} className="btn-primary w-full justify-center">Ver mis pedidos</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="section-shell py-8 md:py-10 px-4 md:px-0">
      <div className="mb-8">
        <span className="section-kicker">Checkout</span>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900">Finalizar compra</h1>
        <p className="text-slate-600 mt-2">Completa tus datos para procesar el pedido.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="surface p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${esDatos ? 'bg-teal-700 text-white' : 'bg-green-600 text-white'}`}>1</span>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${esPago ? 'bg-teal-700 text-white' : esConfirmacion ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${esConfirmacion ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
            </div>

            {esDatos ? (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Datos de envío</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} placeholder="Nombre completo" className="input-base" />
                  <input value={datos.email} onChange={(e) => setDatos({ ...datos, email: e.target.value })} placeholder="Correo electrónico" className="input-base" type="email" />
                  <input value={datos.telefono} onChange={(e) => setDatos({ ...datos, telefono: e.target.value })} placeholder="Teléfono" className="input-base" type="tel" />
                  <input value={datos.direccion} onChange={(e) => setDatos({ ...datos, direccion: e.target.value })} placeholder="Dirección completa" className="input-base" />
                </div>
                <button onClick={continuar} className="mt-6 w-full btn-primary justify-center">Continuar al pago</button>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Pago seguro</h2>
                <div className="mb-4 p-4 rounded-3xl bg-teal-50 border border-teal-200 flex items-center gap-3 text-sm text-teal-900">
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  Esta es una integración de pruebas. Puedes usar datos ficticios en la tarjeta.
                </div>
                <div className="space-y-4">
                  <input value={pago.nombre} onChange={(e) => setPago({ ...pago, nombre: e.target.value })} placeholder="Nombre en la tarjeta" className="input-base" />
                  <input value={pago.numero} onChange={(e) => setPago({ ...pago, numero: e.target.value })} placeholder="Número de tarjeta" className="input-base" maxLength={16} />
                  <div className="grid grid-cols-3 gap-4">
                    <input value={pago.mes} onChange={(e) => setPago({ ...pago, mes: e.target.value })} placeholder="MM" className="input-base" maxLength={2} />
                    <input value={pago.año} onChange={(e) => setPago({ ...pago, año: e.target.value })} placeholder="AA" className="input-base" maxLength={2} />
                    <input value={pago.cvv} onChange={(e) => setPago({ ...pago, cvv: e.target.value })} placeholder="CVV" className="input-base" maxLength={4} type="password" />
                  </div>
                </div>
                <div className="mt-6 flex gap-4">
                  <button onClick={() => setPaso('datos')} disabled={ventaMutation.isPending} className="flex-1 btn-secondary justify-center">
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </button>
                  <button onClick={confirmar} disabled={ventaMutation.isPending} className="flex-1 btn-primary justify-center disabled:opacity-60">
                    <CreditCard className="w-4 h-4" />
                    {ventaMutation.isPending ? 'Procesando venta...' : 'Confirmar pago'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="surface p-6 sticky top-24">
            <h3 className="font-bold text-slate-900 mb-4">Resumen</h3>
            <div className="space-y-3 border-b border-slate-200 pb-4 mb-4">
              {items.map((item) => (
                <div key={item.productoId} className="flex justify-between text-sm gap-3">
                  <span className="text-slate-700 truncate">{item.nombre} x{item.cantidad}</span>
                  <span className="font-medium">${(item.precioUnitario * item.cantidad).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>${subtotal().toLocaleString()}</span></div>
              <div className="flex justify-between text-slate-600"><span>IVA (0%)</span><span>$0</span></div>
              <div className="flex justify-between text-slate-600"><span>Envío</span><span className="text-green-600 font-semibold">Gratis</span></div>
            </div>
            <div className="flex justify-between items-end pt-4 mt-4 border-t border-slate-200">
              <span className="font-semibold text-slate-900">Total a pagar</span>
              <span className="text-2xl font-bold text-teal-700">${total().toLocaleString()}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Checkout
