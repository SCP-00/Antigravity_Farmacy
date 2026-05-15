import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, CreditCard, Lock } from 'lucide-react'
import { useCarritoStore } from '@/store/carritoStore'
import toast from 'react-hot-toast'

export function Checkout() {
  const navigate = useNavigate()
  const { items, subtotal, total, limpiar } = useCarritoStore()
  const [paso, setPaso] = useState<'datos' | 'pago' | 'confirmacion'>('datos')
  const [procesando, setProcesando] = useState(false)
  const [pedido, setPedido] = useState('')
  const esDatos = paso === 'datos'
  const esPago = paso === 'pago'
  const esConfirmacion = paso === 'confirmacion'

  const [datos, setDatos] = useState({ nombre: '', email: '', telefono: '', direccion: '' })
  const [pago, setPago] = useState({ nombre: '', numero: '', mes: '', año: '', cvv: '' })

  if (items.length === 0) {
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

  const confirmar = async () => {
    if (!pago.nombre || !pago.numero || !pago.mes || !pago.año || !pago.cvv) {
      toast.error('Completa los datos del pago')
      return
    }
    setProcesando(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setPedido(`FMC-${Date.now().toString().slice(-8)}`)
    limpiar()
    setProcesando(false)
    setPaso('confirmacion')
  }

  if (paso === 'confirmacion') {
    return (
      <div className="section-shell py-12">
        <div className="surface min-h-[70vh] flex items-center justify-center px-6 text-center">
          <div className="max-w-md w-full">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Pedido confirmado</h1>
            <p className="text-slate-600 mb-6">Tu orden fue creada con éxito.</p>
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 mb-6">
              <p className="text-sm text-slate-500 mb-1">Número de pedido</p>
              <p className="text-2xl font-bold text-teal-700">{pedido}</p>
            </div>
            <button onClick={() => navigate('/productos')} className="btn-primary w-full justify-center">Seguir comprando</button>
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
        <p className="text-slate-600 mt-2">Flujo de prueba para validar la experiencia de pago.</p>
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
                  <input value={datos.email} onChange={(e) => setDatos({ ...datos, email: e.target.value })} placeholder="Correo electrónico" className="input-base" />
                  <input value={datos.telefono} onChange={(e) => setDatos({ ...datos, telefono: e.target.value })} placeholder="Teléfono" className="input-base" />
                  <input value={datos.direccion} onChange={(e) => setDatos({ ...datos, direccion: e.target.value })} placeholder="Dirección" className="input-base" />
                </div>
                <button onClick={continuar} className="mt-6 w-full btn-primary justify-center">Continuar al pago</button>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Pago visual</h2>
                <div className="mb-4 p-4 rounded-3xl bg-teal-50 border border-teal-200 flex items-center gap-3 text-sm text-teal-900">
                  <Lock className="w-4 h-4" />
                  Esta versión es solo de pruebas locales. No procesa pagos reales.
                </div>
                <div className="space-y-4">
                  <input value={pago.nombre} onChange={(e) => setPago({ ...pago, nombre: e.target.value })} placeholder="Nombre en la tarjeta" className="input-base" />
                  <input value={pago.numero} onChange={(e) => setPago({ ...pago, numero: e.target.value })} placeholder="Número de tarjeta" className="input-base" />
                  <div className="grid grid-cols-3 gap-4">
                    <input value={pago.mes} onChange={(e) => setPago({ ...pago, mes: e.target.value })} placeholder="MM" className="input-base" />
                    <input value={pago.año} onChange={(e) => setPago({ ...pago, año: e.target.value })} placeholder="AA" className="input-base" />
                    <input value={pago.cvv} onChange={(e) => setPago({ ...pago, cvv: e.target.value })} placeholder="CVV" className="input-base" />
                  </div>
                </div>
                <div className="mt-6 flex gap-4">
                  <button onClick={() => setPaso('datos')} className="flex-1 btn-secondary justify-center">
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </button>
                  <button onClick={confirmar} disabled={procesando} className="flex-1 btn-primary justify-center disabled:opacity-60">
                    <CreditCard className="w-4 h-4" />
                    {procesando ? 'Procesando...' : 'Confirmar pago'}
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
              <div className="flex justify-between text-slate-600"><span>IVA (19%)</span><span>${Math.round(subtotal() * 0.19).toLocaleString()}</span></div>
              <div className="flex justify-between text-slate-600"><span>Envío</span><span className="text-green-600 font-semibold">Gratis</span></div>
            </div>
            <div className="flex justify-between items-end pt-4 mt-4 border-t border-slate-200">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-2xl font-bold text-teal-700">${Math.round(total() * 1.19).toLocaleString()}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Checkout
