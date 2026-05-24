import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, CreditCard, Lock, Tag, Coins, Building2, Banknote, Loader2, Wallet } from 'lucide-react'
import { useCarritoStore } from '@/store/carritoStore'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { ventasService } from '@/services'
import { useAuthCliente } from '@/hooks'
import toast from 'react-hot-toast'
import { METODO_PAGO_LABEL } from '@/config/constants'

type MetodoPago = 'EFECTIVO' | 'WOMPI' | 'STRIPE' | 'MERCADOPAGO'

interface MetodoInfo {
  id: MetodoPago
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
  description: string
  features: string[]
}

const METODOS: MetodoInfo[] = [
  { id: 'WOMPI', label: 'Wompi', icon: <Building2 className="w-6 h-6" />, color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200 hover:border-purple-400', description: 'PSE, Nequi, tarjetas debito/credito', features: ['Pago con PSE', 'Nequi', 'Tarjetas debito y credito', 'Sin costo adicional'] },
  { id: 'STRIPE', label: 'Stripe', icon: <CreditCard className="w-6 h-6" />, color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400', description: 'Tarjetas internacionales', features: ['Visa, Mastercard, Amex', 'Pago internacional', '3D Secure', 'Moneda local COP'] },
  { id: 'MERCADOPAGO', label: 'Mercado Pago', icon: <Wallet className="w-6 h-6" />, color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200 hover:border-blue-400', description: 'Cuenta Mercado Pago', features: ['Saldo Mercado Pago', 'Tarjetas vinculadas', 'Pago en cuotas', 'QR interoperable'] },
  { id: 'EFECTIVO', label: 'Efectivo', icon: <Banknote className="w-6 h-6" />, color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400', description: 'Pago contra entrega', features: ['Paga al recibir', 'Sin necesidad de tarjeta', 'Efectivo o transferencia', 'Valido en Bogota'] },
]

function StepIndicator({ paso }: { paso: number }) {
  const steps = [
    { n: 1, l: 'Envio' },
    { n: 2, l: 'Pago' },
    { n: 3, l: 'Confirmacion' },
  ]
  return (
    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
      {steps.map((s, i, arr) => (
        <span key={s.n} className="flex items-center gap-2">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${paso >= s.n ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-500'}`}>
            {paso > s.n ? <CheckCircle className="w-4 h-4" /> : s.n}
          </span>
          <span className={`font-semibold text-sm ${paso >= s.n ? 'text-gray-800' : 'text-gray-400'}`}>{s.l}</span>
          {i < arr.length - 1 && <div className="h-px w-6 bg-gray-200 mx-1" />}
        </span>
      ))}
    </div>
  )
}

function MetodoCard({ m, sel, onClick, disabled }: { m: MetodoInfo; sel: boolean; onClick: () => void; disabled: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${sel ? 'border-teal-500 bg-teal-50 shadow-md shadow-teal-100' : m.bgColor + ' border-transparent'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01]'}`}>
      {sel && <div className="absolute top-3 right-3 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center"><CheckCircle className="w-4 h-4 text-white" /></div>}
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${sel ? 'bg-teal-100 text-teal-700' : 'bg-white shadow-sm ' + m.color}`}>{m.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-lg ${m.color}`}>{m.label}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{m.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {m.features.map((f, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">{f}</span>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}

function SimulacionPasarela({ metodo, onComplete }: { metodo: MetodoPago; onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const steps: Record<MetodoPago, string[]> = {
    WOMPI: ['Conectando con Wompi...', 'Generando transaccion segura...', 'Redirigiendo a PSE / Nequi...'],
    STRIPE: ['Inicializando Stripe Elements...', 'Validando tarjeta 3D Secure...', 'Procesando pago...'],
    MERCADOPAGO: ['Conectando con Mercado Pago...', 'Generando preferencia de pago...', 'Redirigiendo a checkout...'],
    EFECTIVO: ['Verificando disponibilidad...', 'Preparando orden contra entrega...', 'Confirmando datos de envio...'],
  }
  const icons: Record<MetodoPago, React.ReactNode> = {
    WOMPI: <Building2 className="w-12 h-12 text-purple-600" />,
    STRIPE: <CreditCard className="w-12 h-12 text-indigo-600" />,
    MERCADOPAGO: <Wallet className="w-12 h-12 text-blue-600" />,
    EFECTIVO: <Banknote className="w-12 h-12 text-emerald-600" />,
  }
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 600)
    const t2 = setTimeout(() => setStep(2), 1400)
    const t3 = setTimeout(() => onComplete(), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [metodo, onComplete])
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 animate-fade-in">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-100/50 to-transparent animate-pulse rounded-full blur-xl" />
        <div className="relative">{icons[metodo]}</div>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
        <p className="text-lg font-semibold text-gray-800">{steps[metodo][step]}</p>
      </div>
      <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-500" style={{ width: `${((step + 1) / 3) * 100}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-3">Modo sandbox - simulacion educativa</p>
    </div>
  )
}

export function Checkout() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { items, subtotal, limpiar } = useCarritoStore()
  const { cliente } = useAuthCliente()
  const [paso, setPaso] = useState<'datos' | 'pago' | 'simulando' | 'confirmacion'>('datos')
  const [metodoPago, setMetodoPago] = useState<MetodoPago | null>(null)
  const [pedidoInfo, setPedidoInfo] = useState<{ numero: number; total: number; puntosGanados: number; metodoPago: MetodoPago } | null>(null)
  const [datos, setDatos] = useState({ nombre: cliente?.nombre || '', email: cliente?.email || '', telefono: '', direccion: '' })
  const [codigo, setCodigo] = useState('')
  const [descuento, setDescuento] = useState(0)
  const [usarPuntos, setUsarPuntos] = useState(false)

  const sub = subtotal()
  const saldoPts = (cliente as unknown as { puntos?: number })?.puntos ?? 0
  const valPts = usarPuntos ? Math.min(saldoPts, sub - descuento) : 0
  const total = Math.max(0, sub - descuento - valPts)
  const ptsGanados = Math.floor(total / 100)

  const aplicarCodigo = () => {
    if (codigo.toUpperCase() === 'FARMACY10') { setDescuento(sub * 0.10); toast.success('Codigo aplicado! 10% de descuento') }
    else { toast.error('Codigo invalido o expirado'); setDescuento(0) }
  }

  const ventaMut = useMutation({
    mutationFn: () => ventasService.registrar({
      sucursalId: 1, clienteId: cliente?.id, metodoPago: metodoPago ?? 'EFECTIVO',
      descuento, puntosUsados: valPts,
      items: items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, precioUnitario: i.precioUnitario, descuento: 0 })),
    }),
    onSuccess: (data: any) => {
      setPedidoInfo({ numero: data?.ventaNum ?? data?.numero ?? 0, total: data?.total ?? total, puntosGanados: ptsGanados, metodoPago: metodoPago ?? 'EFECTIVO' })
      limpiar(); qc.invalidateQueries({ queryKey: ['productos'] }); qc.invalidateQueries({ queryKey: ['cliente'] }); setPaso('confirmacion')
    },
    onError: (err: any) => { toast.error(err?.response?.data?.error ?? 'Error procesando tu pedido'); setPaso('pago') },
  })

  const continuar = () => {
    if (!metodoPago) { toast.error('Selecciona un metodo de pago'); return }
    if (metodoPago === 'EFECTIVO') { ventaMut.mutate(); return }
    setPaso('simulando')
  }

  if (items.length === 0 && paso !== 'confirmacion') {
    return (
      <div className="section-shell py-12 flex justify-center">
        <div className="surface p-12 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Tu carrito esta vacio</h1>
          <button onClick={() => navigate('/productos')} className="btn-primary mt-4">Volver al catalogo</button>
        </div>
      </div>
    )
  }

  if (paso === 'confirmacion' && pedidoInfo) {
    return (
      <div className="section-shell py-12 flex justify-center">
        <div className="surface p-10 text-center max-w-md w-full animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Pedido confirmado!</h1>
          <p className="text-gray-500 mb-6">Pago con <span className="font-semibold text-gray-700">{METODO_PAGO_LABEL[pedidoInfo.metodoPago] ?? pedidoInfo.metodoPago}</span></p>
          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-3xl p-6 my-6 shadow-sm">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Numero de pedido</p>
            <p className="text-4xl font-bold text-teal-700">F-{String(pedidoInfo.numero).padStart(5, '0')}</p>
            <div className="h-px bg-slate-200 my-4" />
            <p className="text-sm text-slate-500">Total pagado: <span className="font-bold text-slate-800">${pedidoInfo.total.toLocaleString()}</span></p>
          </div>
          {cliente && (
            <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm font-medium mb-6 flex items-center gap-2 justify-center border border-amber-200">
              <Coins className="w-5 h-5" /> Ganaste {pedidoInfo.puntosGanados.toLocaleString()} puntos con esta compra!
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => navigate('/cuenta/pedidos')} className="flex-1 btn-primary justify-center">Ver mis pedidos</button>
            <button onClick={() => navigate('/')} className="flex-1 btn-secondary justify-center">Seguir comprando</button>
          </div>
        </div>
      </div>
    )
  }

  if (paso === 'simulando' && metodoPago) {
    return (
      <div className="section-shell py-12 flex justify-center">
        <div className="surface p-10 max-w-lg w-full">
          <StepIndicator paso={2} />
          <SimulacionPasarela metodo={metodoPago} onComplete={() => ventaMut.mutate()} />
        </div>
      </div>
    )
  }

  return (
    <div className="section-shell py-8 md:py-10 px-4 md:px-0">
      <div className="mb-6"><h1 className="text-3xl font-bold text-slate-900">Finalizar compra</h1></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="surface p-6 md:p-8">
            <StepIndicator paso={paso === 'datos' ? 1 : 2} />
            {paso === 'datos' && (
              <div className="animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="label">Nombre completo</label><input value={datos.nombre} onChange={e => setDatos({ ...datos, nombre: e.target.value })} className="input-base" placeholder="Tu nombre" /></div>
                  <div><label className="label">Correo electronico</label><input value={datos.email} onChange={e => setDatos({ ...datos, email: e.target.value })} className="input-base" placeholder="correo@ejemplo.com" /></div>
                  <div><label className="label">Telefono</label><input value={datos.telefono} onChange={e => setDatos({ ...datos, telefono: e.target.value })} className="input-base" placeholder="300 123 4567" /></div>
                  <div><label className="label">Direccion de envio</label><input value={datos.direccion} onChange={e => setDatos({ ...datos, direccion: e.target.value })} className="input-base" placeholder="Cra 1 # 2-3, Bogota" /></div>
                </div>
                <button onClick={() => { if (!datos.nombre || !datos.direccion || !datos.telefono) { toast.error('Completa los campos obligatorios'); return }; setPaso('pago') }} className="mt-6 w-full btn-primary justify-center">Continuar al pago</button>
              </div>
            )}
            {paso === 'pago' && (
              <div className="animate-fade-in">
                <div className="mb-4 p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-start gap-3 text-sm text-teal-900">
                  <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div><p className="font-semibold">Conexion segura</p><p className="text-teal-700/80 mt-0.5">Tus datos estan protegidos con cifrado SSL. Modo sandbox - demo educativa.</p></div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-4">Selecciona tu metodo de pago preferido:</p>
                <div className="grid gap-3">
                  {METODOS.map(m => <MetodoCard key={m.id} m={m} sel={metodoPago === m.id} onClick={() => setMetodoPago(m.id)} disabled={ventaMut.isPending} />)}
                </div>
                <div className="mt-6 flex gap-4">
                  <button onClick={() => setPaso('datos')} disabled={ventaMut.isPending} className="flex-1 btn-secondary justify-center"><ArrowLeft size={16} /> Volver</button>
                  <button onClick={continuar} disabled={ventaMut.isPending || !metodoPago} className="flex-1 btn-primary justify-center bg-green-600 hover:bg-green-700 border-none disabled:opacity-50">
                    {ventaMut.isPending ? 'Procesando...' : `Pagar $${total.toLocaleString()}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <aside className="lg:col-span-1 space-y-4">
          <div className="surface p-5 space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Tag size={16} /> Codigo de descuento</h3>
            <div className="flex gap-2">
              <input value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Ej: FARMACY10" className="input-base flex-1 uppercase text-sm" />
              <button onClick={aplicarCodigo} className="px-4 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition">Aplicar</button>
            </div>
            {cliente && saldoPts > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Coins size={16} className="text-amber-500" /> Mis Puntos</h3>
                  <span className="text-xs font-bold text-amber-600 border border-amber-200 bg-amber-50 px-2 py-1 rounded-lg">{saldoPts.toLocaleString()} pts</span>
                </div>
                <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                  <input type="checkbox" checked={usarPuntos} onChange={e => setUsarPuntos(e.target.checked)} className="w-5 h-5 accent-teal-600" />
                  <div className="text-sm"><p className="font-medium text-gray-800">Usar puntos como cashback</p><p className="text-xs text-gray-500">Ahorras ${saldoPts.toLocaleString()} COP</p></div>
                </label>
              </div>
            )}
          </div>
          <div className="surface p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Resumen del pedido</h3>
            <div className="space-y-2 text-sm border-b border-slate-100 pb-4 mb-4 max-h-48 overflow-y-auto">
              {items.map(i => (
                <div key={i.productoId} className="flex justify-between gap-3 text-slate-600">
                  <span className="truncate">{i.cantidad}x {i.nombre}</span>
                  <span className="font-medium whitespace-nowrap">${(i.precioUnitario * i.cantidad).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">${sub.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Envio</span><span className="text-green-600 font-semibold">Gratis</span></div>
              {descuento > 0 && <div className="flex justify-between text-teal-600 font-medium"><span>Codigo promocional</span><span>-${descuento.toLocaleString()}</span></div>}
              {valPts > 0 && <div className="flex justify-between text-amber-600 font-medium"><span>Puntos redimidos</span><span>-${valPts.toLocaleString()}</span></div>}
            </div>
            <div className="flex justify-between items-end pt-4 mt-4 border-t border-slate-200">
              <div><span className="font-bold text-slate-900 block">Total a pagar</span>{cliente && <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">+ {ptsGanados} pts nuevos</span>}</div>
              <span className="text-2xl font-bold text-teal-700">${total.toLocaleString()}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Checkout
