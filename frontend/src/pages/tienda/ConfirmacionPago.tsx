import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, ArrowRight, Package } from 'lucide-react'

export default function ConfirmacionPago() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const estado = params.get('estado') ?? 'aprobado'
  const pedido = params.get('pedido') ?? ''

  if (estado === 'aprobado') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pago confirmado!</h1>
        <p className="text-gray-500 mb-6">Tu pedido ha sido registrado exitosamente. Recibiras un correo de confirmacion.</p>
        {pedido && (
          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-3xl p-6 mb-6 shadow-sm">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Pedido</p>
            <p className="text-2xl font-bold text-teal-700">#{pedido}</p>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/cuenta/pedidos')} className="btn-primary inline-flex items-center gap-2"><Package size={16} /> Ver mis pedidos</button>
          <button onClick={() => navigate('/')} className="btn-secondary inline-flex items-center gap-2"><ArrowRight size={16} /> Seguir comprando</button>
        </div>
      </div>
    )
  }

  if (estado === 'rechazado' || estado === 'fallido') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-lg shadow-red-200">
          <XCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pago rechazado</h1>
        <p className="text-gray-500 mb-6">El pago no pudo ser procesado. Intenta con otro metodo de pago.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/checkout')} className="btn-primary inline-flex items-center gap-2">Intentar de nuevo</button>
          <button onClick={() => navigate('/carrito')} className="btn-secondary inline-flex items-center gap-2">Volver al carrito</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
        <Clock className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Pago pendiente</h1>
      <p className="text-gray-500 mb-6">Estamos esperando la confirmacion de tu pago. Te notificaremos cuando este listo.</p>
      <button onClick={() => navigate('/cuenta/pedidos')} className="btn-primary inline-flex items-center gap-2"><Package size={16} /> Mis pedidos</button>
    </div>
  )
}
