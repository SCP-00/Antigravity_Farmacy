import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, CreditCard, Lock, Tag, Coins } from 'lucide-react'
import { useCarritoStore } from '@/store/carritoStore'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { ventasService } from '@/services'
import { useAuthCliente } from '@/hooks'
import toast from 'react-hot-toast'

export function Checkout() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { items, subtotal, limpiar } = useCarritoStore()
  const { cliente } = useAuthCliente()
  
  const [paso, setPaso] = useState<'datos' | 'pago' | 'confirmacion'>('datos')
  const [pedidoInfo, setPedidoInfo] = useState<{ numero: number, total: number, puntosGanados: number } | null>(null)

  const [datos, setDatos] = useState({ 
    nombre: cliente?.nombre || '', email: cliente?.email || '', telefono: '', direccion: '' 
  })
  const [pago, setPago] = useState({ nombre: '', numero: '', mes: '', año: '', cvv: '' })

  // Sistema de Descuentos y Puntos
  const [codigoIngresado, setCodigoIngresado] = useState('')
  const [descuentoCodigo, setDescuentoCodigo] = useState(0)
  const [usarPuntos, setUsarPuntos] = useState(false)

  const subtotalNeto = subtotal()
  const saldoPuntos = cliente?.puntos || 0
  const valorPuntos = usarPuntos ? Math.min(saldoPuntos, subtotalNeto - descuentoCodigo) : 0
  const totalPagar = Math.max(0, subtotalNeto - descuentoCodigo - valorPuntos)
  
  // $100 COP = 1 Punto
  const puntosGanados = Math.floor(totalPagar / 100)

  const esDatos = paso === 'datos'
  const esPago = paso === 'pago'
  const esConfirmacion = paso === 'confirmacion'

  const aplicarCodigo = () => {
    if (codigoIngresado.toUpperCase() === 'FARMACY10') {
      const descuento = subtotalNeto * 0.10
      setDescuentoCodigo(descuento)
      toast.success('¡Código aplicado! 10% de descuento')
    } else {
      toast.error('Código inválido o expirado')
      setDescuentoCodigo(0)
    }
  }

  const ventaMutation = useMutation({
    mutationFn: () => ventasService.registrar({
      sucursalId: 1,
      clienteId: cliente?.id,
      metodoPago: 'STRIPE',
      descuento: descuentoCodigo,
      puntosUsados: valorPuntos,
      items: items.map(i => ({
        productoId: i.productoId, cantidad: i.cantidad, precioUnitario: i.precioUnitario, descuento: 0
      }))
    }),
    onSuccess: (data) => {
      setPedidoInfo({ numero: data.ventaNum, total: data.total, puntosGanados })
      limpiar()
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['cliente'] })
      setPaso('confirmacion')
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Error procesando tu pedido')
  })

  if (items.length === 0 && paso !== 'confirmacion') {
    return (
      <div className="section-shell py-12 flex justify-center">
        <div className="surface p-12 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Tu carrito está vacío</h1>
          <button onClick={() => navigate('/productos')} className="btn-primary mt-4">Volver al catálogo</button>
        </div>
      </div>
    )
  }

  if (paso === 'confirmacion') {
    return (
      <div className="section-shell py-12 flex justify-center">
        <div className="surface p-10 text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">¡Pedido confirmado!</h1>
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 my-6">
            <p className="text-sm text-slate-500 mb-1">Número de pedido</p>
            <p className="text-3xl font-bold text-teal-700">F-{String(pedidoInfo?.numero ?? 0).padStart(5, '0')}</p>
            <p className="text-sm text-slate-500 mt-2">Total pagado: ${pedidoInfo?.total.toLocaleString()}</p>
          </div>
          {cliente && (
            <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm font-medium mb-6 flex items-center gap-2 justify-center border border-amber-200">
              <Coins size={18} /> ¡Ganaste {pedidoInfo?.puntosGanados.toLocaleString()} puntos con esta compra!
            </div>
          )}
          <button onClick={() => navigate('/cuenta/pedidos')} className="btn-primary w-full justify-center">Ver mis pedidos</button>
        </div>
      </div>
    )
  }

  return (
    <div className="section-shell py-8 md:py-10 px-4 md:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Finalizar compra</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lado Izquierdo: Formularios */}
        <div className="lg:col-span-2 space-y-6">
          <div className="surface p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${esDatos ? 'bg-teal-700 text-white' : 'bg-green-600 text-white'}`}>1</span>
              <span className="font-semibold text-gray-800">Envío</span>
              <div className="h-px w-8 bg-gray-200 mx-2"></div>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${esPago ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
              <span className={`font-semibold ${esPago ? 'text-gray-800' : 'text-gray-400'}`}>Pago</span>
            </div>

            {esDatos ? (
              <div className="animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="label">Nombre</label><input value={datos.nombre} onChange={e=>setDatos({...datos, nombre: e.target.value})} className="input-base" /></div>
                  <div><label className="label">Correo</label><input value={datos.email} onChange={e=>setDatos({...datos, email: e.target.value})} className="input-base" /></div>
                  <div><label className="label">Teléfono</label><input value={datos.telefono} onChange={e=>setDatos({...datos, telefono: e.target.value})} className="input-base" /></div>
                  <div><label className="label">Dirección completa</label><input value={datos.direccion} onChange={e=>setDatos({...datos, direccion: e.target.value})} className="input-base" /></div>
                </div>
                <button onClick={() => {
                  if(!datos.nombre || !datos.direccion || !datos.telefono) toast.error('Completa los campos de envío');
                  else setPaso('pago')
                }} className="mt-6 w-full btn-primary justify-center">Continuar al pago</button>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="mb-4 p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center gap-3 text-sm text-teal-900">
                  <Lock className="w-5 h-5 flex-shrink-0" />
                  Conexión segura SSL. Tus datos están protegidos.
                </div>
                <div className="space-y-4">
                  <input value={pago.nombre} onChange={e=>setPago({...pago, nombre: e.target.value})} placeholder="Titular de la tarjeta" className="input-base" />
                  <input value={pago.numero} onChange={e=>setPago({...pago, numero: e.target.value})} placeholder="0000 0000 0000 0000" className="input-base font-mono" maxLength={16} />
                  <div className="grid grid-cols-3 gap-4">
                    <input value={pago.mes} onChange={e=>setPago({...pago, mes: e.target.value})} placeholder="MM" className="input-base text-center" maxLength={2} />
                    <input value={pago.año} onChange={e=>setPago({...pago, año: e.target.value})} placeholder="AA" className="input-base text-center" maxLength={2} />
                    <input value={pago.cvv} onChange={e=>setPago({...pago, cvv: e.target.value})} placeholder="CVV" className="input-base text-center" maxLength={4} type="password" />
                  </div>
                </div>
                <div className="mt-6 flex gap-4">
                  <button onClick={() => setPaso('datos')} disabled={ventaMutation.isPending} className="flex-1 btn-secondary justify-center"><ArrowLeft size={16}/> Volver</button>
                  <button onClick={() => ventaMutation.mutate()} disabled={ventaMutation.isPending} className="flex-1 btn-primary justify-center bg-green-600 hover:bg-green-700 border-none">
                    {ventaMutation.isPending ? 'Procesando...' : `Pagar $${totalPagar.toLocaleString()}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lado Derecho: Resumen y Descuentos */}
        <aside className="lg:col-span-1 space-y-4">
          
          {/* Panel de Descuentos (Mejorado) */}
          <div className="surface p-5 space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Tag size={16}/> Código de descuento</h3>
            <div className="flex gap-2">
              <input value={codigoIngresado} onChange={e => setCodigoIngresado(e.target.value)} placeholder="Ej: FARMACY10" className="input-base flex-1 uppercase text-sm" />
              <button onClick={aplicarCodigo} className="px-4 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition">Aplicar</button>
            </div>

            {cliente && saldoPuntos > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Coins size={16} className="text-amber-500"/> Mis Puntos</h3>
                  <span className="text-xs font-bold text-amber-600 border border-amber-200 bg-amber-50 px-2 py-1 rounded-lg">{saldoPuntos.toLocaleString()} pts</span>
                </div>
                <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                  <input type="checkbox" checked={usarPuntos} onChange={e => setUsarPuntos(e.target.checked)} className="w-5 h-5 accent-teal-600" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-800">Usar puntos como cashback</p>
                    <p className="text-xs text-gray-500">Ahorras ${saldoPuntos.toLocaleString()} COP</p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Resumen Monetario */}
          <div className="surface p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Resumen del pedido</h3>
            <div className="space-y-2 text-sm border-b border-slate-100 pb-4 mb-4">
              {items.map((item) => (
                <div key={item.productoId} className="flex justify-between gap-3 text-slate-600">
                  <span className="truncate">{item.cantidad}x {item.nombre}</span>
                  <span className="font-medium">${(item.precioUnitario * item.cantidad).toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">${subtotalNeto.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Envío</span><span className="text-green-600 font-semibold">Gratis</span></div>
              {descuentoCodigo > 0 && <div className="flex justify-between text-teal-600 font-medium"><span>Código promocional</span><span>-${descuentoCodigo.toLocaleString()}</span></div>}
              {valorPuntos > 0 && <div className="flex justify-between text-amber-600 font-medium"><span>Puntos redimidos</span><span>-${valorPuntos.toLocaleString()}</span></div>}
            </div>
            
            <div className="flex justify-between items-end pt-4 mt-4 border-t border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block">Total a pagar</span>
                {cliente && <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">+ {puntosGanados} pts nuevos</span>}
              </div>
              <span className="text-2xl font-bold text-teal-700">${totalPagar.toLocaleString()}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Checkout
