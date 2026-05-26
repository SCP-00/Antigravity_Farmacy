import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, CreditCard, Lock, Tag, Coins, Building2, Banknote, Loader2, Wallet, AlertCircle, RefreshCw, XCircle, Info, ShoppingCart, Heart } from 'lucide-react'
import { useCarritoStore } from '@/store/carritoStore'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { ventasService, pagosService, clientesService, chatbotService } from '@/services'
import { useAuthCliente } from '@/hooks'
import toast from 'react-hot-toast'
import { METODO_PAGO_LABEL } from '@/config/constants'
import InteractionAlertModal from '@/components/shared/InteractionAlertModal'

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

// ── Validación ────────────────────────────────────────────────
type CampoEnvio = 'nombre' | 'email' | 'telefono' | 'direccion'
type ErroresFormulario = Partial<Record<CampoEnvio | 'metodoPago', string>>
type DatosEnvio = Record<CampoEnvio, string>

const CAMPOS_ENVIO: CampoEnvio[] = ['nombre', 'email', 'telefono', 'direccion']

function validarCampo(campo: CampoEnvio | 'metodoPago', valor: string): string {
  switch (campo) {
    case 'nombre':
      if (!valor.trim()) return 'El nombre es obligatorio'
      if (valor.trim().length < 3) return 'Debe tener al menos 3 caracteres'
      if (valor.trim().length > 100) return 'Debe tener maximo 100 caracteres'
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(valor.trim())) return 'Solo se permiten letras y espacios'
      return ''
    case 'email':
      if (!valor.trim()) return 'El correo es obligatorio'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())) return 'Formato de correo invalido (ej: usuario@dominio.com)'
      return ''
    case 'telefono':
      if (!valor.trim()) return 'El telefono es obligatorio'
      const telefonoLimpio = valor.trim().replace(/\s+/g, '')
      if (!/^3\d{9}$/.test(telefonoLimpio) && !/^60[1-9]\d{7}$/.test(telefonoLimpio) && !/^01\d{8,9}$/.test(telefonoLimpio))
        return 'Ingresa un numero valido en Colombia (ej: 3001234567)'
      return ''
    case 'direccion':
      if (!valor.trim()) return 'La direccion es obligatoria'
      if (valor.trim().length < 5) return 'Debe tener al menos 5 caracteres'
      if (valor.trim().length > 200) return 'Debe tener maximo 200 caracteres'
      return ''
    default:
      return ''
  }
}

function validarFormulario(datos: DatosEnvio): ErroresFormulario {
  const errores: ErroresFormulario = {}
  for (const campo of CAMPOS_ENVIO) {
    const error = validarCampo(campo, datos[campo])
    if (error) errores[campo] = error
  }
  return errores
}

// ── Componentes auxiliares ─────────────────────────────────────

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

function MetodoCard({ m, sel, onClick, disabled, error }: { m: MetodoInfo; sel: boolean; onClick: () => void; disabled: boolean; error?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
        error && !sel ? 'border-red-300 bg-red-50/50' :
        sel ? 'border-teal-500 bg-teal-50 shadow-md shadow-teal-100' : m.bgColor + ' border-transparent'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01]'}`}>
      {sel && <div className="absolute top-3 right-3 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center"><CheckCircle className="w-4 h-4 text-white" /></div>}
      {error && !sel && <div className="absolute top-3 right-3"><AlertCircle className="w-5 h-5 text-red-400" /></div>}
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

function InputError({ error }: { error?: string }) {
  if (!error) return null
  return (
    <p className="flex items-center gap-1 text-xs text-red-600 mt-1 animate-fade-in" role="alert">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      <span>{error}</span>
    </p>
  )
}

function SkeletonPago() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
      ))}
    </div>
  )
}

function SimulacionPasarela({ metodo, onComplete, onCancel }: { metodo: MetodoPago; onComplete: () => void; onCancel: () => void }) {
  const [step, setStep] = useState(0)
  const steps: Record<MetodoPago, string[]> = {
    WOMPI: ['Conectando con Wompi...', 'Generando transaccion segura...', 'Redirigiendo a PSE / Nequi...'],
    STRIPE: ['Inicializando Stripe Elements...', 'Validando tarjeta 3D Secure...', 'Procesando pago...'],
    MERCADOPAGO: ['Redirigiendo a Mercado Pago...', 'Abrindo checkout seguro...', 'Completando pago...'],
    EFECTIVO: ['Verificando disponibilidad...', 'Preparando orden contra entrega...', 'Confirmando datos de envio...'],
  }
  const icons: Record<MetodoPago, React.ReactNode> = {
    WOMPI: <Building2 className="w-12 h-12 text-purple-600" />,
    STRIPE: <CreditCard className="w-12 h-12 text-indigo-600" />,
    MERCADOPAGO: <Wallet className="w-12 h-12 text-blue-600" />,
    EFECTIVO: <Banknote className="w-12 h-12 text-emerald-600" />,
  }
  useEffect(() => {
    setStep(0)
    const t1 = setTimeout(() => setStep(1), 600)
    const t2 = setTimeout(() => setStep(2), 1400)
    const t3 = setTimeout(() => onComplete(), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [metodo, onComplete])
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 animate-fade-in">
      <button onClick={onCancel} className="self-start mb-4 text-sm text-gray-400 hover:text-gray-600 transition flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Cancelar y volver
      </button>
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

function ErrorCard({ mensaje, onReintentar, onVolver }: { mensaje: string; onReintentar: () => void; onVolver: () => void }) {
  return (
    <div className="flex flex-col items-center py-12 px-8 animate-fade-in">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center shadow-sm">
        <XCircle className="w-10 h-10 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Error al procesar el pago</h2>
      <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">{mensaje}</p>
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 w-full max-w-sm">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-700">
            <p className="font-semibold mb-1">Posibles causas:</p>
            <ul className="list-disc list-inside space-y-0.5 text-red-600/80">
              <li>Fallo de conexion con la pasarela de pago</li>
              <li>La transaccion fue rechazada por el banco</li>
              <li>Tiempo de espera agotado</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onVolver} className="btn-secondary justify-center">
          <ArrowLeft size={16} /> Volver a seleccionar
        </button>
        <button onClick={onReintentar} className="btn-primary justify-center bg-orange-600 hover:bg-orange-700 border-none">
          <RefreshCw size={16} /> Reintentar
        </button>
      </div>
    </div>
  )
}

// ── Página principal de Checkout ───────────────────────────────

function Checkout() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { items, subtotal, limpiar } = useCarritoStore()
  const { cliente } = useAuthCliente()
  const [paso, setPaso] = useState<'datos' | 'pago' | 'simulando' | 'confirmacion' | 'error'>('datos')
  const [metodoPago, setMetodoPago] = useState<MetodoPago | null>(null)
  const [pedidoInfo, setPedidoInfo] = useState<{ numero: number; total: number; puntosGanados: number; metodoPago: MetodoPago } | null>(null)
  const DATOS_STORAGE_KEY = 'checkout_datos_envio'

  const [datos, setDatos] = useState<DatosEnvio>(() => {
    try {
      const saved = localStorage.getItem(DATOS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return { nombre: '', email: '', telefono: '', direccion: '', ...parsed }
      }
    } catch { /* ignore corrupt data */ }
    return { nombre: cliente?.nombre || '', email: cliente?.email || '', telefono: '', direccion: '' }
  })
  const [errores, setErrores] = useState<ErroresFormulario>({})
  const [tocados, setTocados] = useState<Partial<Record<CampoEnvio | 'metodoPago', boolean>>>({})
  const [errorPago, setErrorPago] = useState<string>('')
  const [codigo, setCodigo] = useState('')
  const [descuento, setDescuento] = useState(0)
  const [usarPuntos, setUsarPuntos] = useState(false)

  const sub = subtotal()
  const saldoPts = (cliente as unknown as { puntos?: number })?.puntos ?? 0
  const valPts = usarPuntos ? Math.min(saldoPts, sub - descuento) : 0
  const total = Math.max(0, sub - descuento - valPts)
  const ptsGanados = Math.floor(total / 100)

  // ── Perfil de salud y alérgenos ───────────────────────
  const [alertasInteraccion, setAlertasInteraccion] = useState<any[] | null>(null)
  const [verificandoSalud, setVerificandoSalud] = useState(false)
  const { data: perfilSalud } = useQuery({
    queryKey: ['cliente', 'salud'],
    queryFn: clientesService.obtenerSalud,
    enabled: !!cliente,
  })
  const tieneAlergenos = perfilSalud?.alergenos?.length > 0

  // Validacion en vivo — solo si el campo ya fue "tocado" (onBlur)
  const erroresVisibles = useMemo(() => {
    const errs: ErroresFormulario = {}
    for (const key of CAMPOS_ENVIO) {
      if (tocados[key]) {
        const error = validarCampo(key, datos[key])
        if (error) errs[key] = error
      }
    }
    return errs
  }, [datos, tocados])

  // Errores de pago: si no seleccionó método
  const errorMetodoPago = paso === 'pago' && metodoPago === null && tocados.metodoPago

  const handleBlur = (campo: CampoEnvio) => {
    setTocados(prev => ({ ...prev, [campo]: true }))
    const error = validarCampo(campo, datos[campo])
    if (error) {
      setErrores(prev => ({ ...prev, [campo]: error }))
    } else {
      setErrores(prev => { const n = { ...prev }; delete n[campo]; return n })
    }
  }

  const handleChange = (campo: CampoEnvio, valor: string) => {
    setDatos(prev => ({ ...prev, [campo]: valor }))
    // Limpiar error en vivo si el campo ya fue tocado
    if (tocados[campo]) {
      const error = validarCampo(campo, valor)
      if (error) {
        setErrores(prev => ({ ...prev, [campo]: error }))
      } else {
        setErrores(prev => { const n = { ...prev }; delete n[campo]; return n })
      }
    }
  }

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
      // Para MERCADOPAGO: no mostrar confirmación aún — el mutate() maneja el redirect
      if (metodoPago !== 'MERCADOPAGO') {
        limpiar(); qc.invalidateQueries({ queryKey: ['productos'] }); qc.invalidateQueries({ queryKey: ['cliente'] }); setPaso('confirmacion')
      }
    },
    onError: (err: any) => {
      setErrorPago(err?.response?.data?.error ?? 'Error al procesar el pedido. Verifica tu conexion e intenta de nuevo.')
      setPaso('error')
    },
  })

  const continuarDatos = () => {
    const errs = validarFormulario(datos)
    setErrores(errs)
    // Marcar todos como tocados
    setTocados({ nombre: true, email: true, telefono: true, direccion: true })
    if (Object.keys(errs).length > 0) {
      toast.error('Corrige los errores antes de continuar')
      return
    }
    setPaso('pago')
  }

  const verificarAlergenosAntesDePagar = useCallback(async () => {
    if (!tieneAlergenos || !cliente) {
      return true
    }

    setVerificandoSalud(true)
    try {
      const res = await chatbotService.verificarInteracciones(
        items.map(i => i.productoId),
        perfilSalud?.alergenos
      )
      if (res?.tieneAlertas && res?.alertas?.length > 0) {
        setAlertasInteraccion(res.alertas)
        return false
      }
      return true
    } catch {
      return true
    } finally {
      setVerificandoSalud(false)
    }
  }, [items, cliente, tieneAlergenos, perfilSalud])

  const continuarPago = async () => {
    if (!metodoPago) {
      setTocados(prev => ({ ...prev, metodoPago: true }))
      toast.error('Selecciona un metodo de pago')
      return
    }

    if (tieneAlergenos && cliente) {
      const puedeContinuar = await verificarAlergenosAntesDePagar()
      if (!puedeContinuar) return
    }

    ejecutarPago()
  }

  const handleConfirmarConInteraccion = () => {
    setAlertasInteraccion(null)
    ejecutarPago()
  }

  const handleCancelarInteraccion = () => {
    setAlertasInteraccion(null)
  }

  const ejecutarPago = () => {
    if (metodoPago === 'EFECTIVO') { ventaMut.mutate(); return }
    if (metodoPago === 'MERCADOPAGO') {
      // Crear la venta y luego redirigir a MercadoPago
      ventaMut.mutate(undefined, {
        onSuccess: async (data: any) => {
          try {
            const mpRes = await pagosService.crearMercadoPago({
              ventaId: data?.id,
              items: items.map(i => ({
                nombre: i.nombre,
                cantidad: i.cantidad,
                precioUnitario: i.precioUnitario,
              })),
              monto: total,
              clienteEmail: datos.email,
            })
            if (mpRes?.initPoint) {
              window.location.href = mpRes.initPoint
              return
            }
          } catch (e) {
            console.error('[MercadoPago] Error al crear preferencia:', e)
          }
          // Fallback: mostrar confirmación local
          limpiar(); qc.invalidateQueries({ queryKey: ['productos'] }); qc.invalidateQueries({ queryKey: ['cliente'] })
          setPaso('confirmacion')
        },
        onError: (err: any) => {
          setErrorPago(err?.response?.data?.error ?? 'Error al procesar el pedido.')
          setPaso('error')
        },
      })
      return
    }
    setPaso('simulando')
  }

  const handleReintentar = () => {
    setPaso('simulando')
    setErrorPago('')
  }

  const handleCancelarPago = () => {
    setPaso('pago')
    setErrorPago('')
  }

  // ── Pantalla: carrito vacío ────────────────────────────────
  if (items.length === 0 && paso !== 'confirmacion') {
    return (
      <div className="section-shell py-12 flex justify-center">
        <div className="surface p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Tu carrito esta vacio</h1>
          <p className="text-gray-500 text-sm mb-6">Agrega productos desde nuestro catalogo para empezar tu compra</p>
          <button onClick={() => navigate('/productos')} className="btn-primary justify-center">Ver catalogo</button>
        </div>
      </div>
    )
  }

  // ── Pantalla: error post-pago ──────────────────────────────
  if (paso === 'error') {
    return (
      <div className="section-shell py-12 flex justify-center">
        <div className="surface p-10 max-w-lg w-full">
          <StepIndicator paso={2} />
          <ErrorCard
            mensaje={errorPago}
            onReintentar={handleReintentar}
            onVolver={() => { setPaso('pago'); setErrorPago('') }}
          />
        </div>
      </div>
    )
  }

  // Persistir datos de envío en localStorage
  useEffect(() => {
    if (paso === 'datos' || paso === 'pago') {
      localStorage.setItem(DATOS_STORAGE_KEY, JSON.stringify(datos))
    }
  }, [datos, paso])

  // Limpiar localStorage al completar la compra exitosamente
  useEffect(() => {
    if (paso === 'confirmacion') {
      localStorage.removeItem(DATOS_STORAGE_KEY)
    }
  }, [paso])

  // ── Pantalla: confirmación ─────────────────────────────────
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

  // ── Pantalla: simulación de pasarela ───────────────────────
  if (paso === 'simulando' && metodoPago) {
    return (
      <div className="section-shell py-12 flex justify-center">
        <div className="surface p-10 max-w-lg w-full">
          <StepIndicator paso={2} />
          <SimulacionPasarela metodo={metodoPago} onComplete={() => ventaMut.mutate()} onCancel={handleCancelarPago} />
        </div>
      </div>
    )
  }

  // ── Pantalla principal: datos + pago ────────────────────────
  return (
    <>
      {alertasInteraccion && (
        <InteractionAlertModal
          alertas={alertasInteraccion}
          onConfirm={handleConfirmarConInteraccion}
          onCancel={handleCancelarInteraccion}
          loading={ventaMut.isPending}
        />
      )}

    <div className="section-shell py-8 md:py-10 px-4 md:px-0">
      <div className="mb-6"><h1 className="text-3xl font-bold text-slate-900">Finalizar compra</h1></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="surface p-6 md:p-8">
            <StepIndicator paso={paso === 'datos' ? 1 : 2} />

            {/* ── Step 1: Datos de envío ─────────────────── */}
            {paso === 'datos' && (
              <div className="animate-fade-in">
                <p className="text-sm text-gray-500 mb-6">Ingresa tus datos para realizar el envio</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nombre completo <span className="text-red-500">*</span></label>
                    <input
                      value={datos.nombre}
                      onChange={e => handleChange('nombre', e.target.value)}
                      onBlur={() => handleBlur('nombre')}
                      className={`input-base ${erroresVisibles.nombre || errores.nombre ? 'border-red-400 ring-red-200 focus:ring-red-400' : ''}`}
                      placeholder="Tu nombre"
                      disabled={false}
                      aria-invalid={!!errores.nombre}
                      aria-describedby={errores.nombre ? 'err-nombre' : undefined}
                    />
                    <InputError error={erroresVisibles.nombre || errores.nombre} />
                  </div>
                  <div>
                    <label className="label">Correo electronico <span className="text-red-500">*</span></label>
                    <input
                      value={datos.email}
                      onChange={e => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      className={`input-base ${erroresVisibles.email || errores.email ? 'border-red-400 ring-red-200 focus:ring-red-400' : ''}`}
                      placeholder="correo@ejemplo.com"
                      aria-invalid={!!errores.email}
                      aria-describedby={errores.email ? 'err-email' : undefined}
                    />
                    <InputError error={erroresVisibles.email || errores.email} />
                  </div>
                  <div>
                    <label className="label">Telefono <span className="text-red-500">*</span></label>
                    <input
                      value={datos.telefono}
                      onChange={e => handleChange('telefono', e.target.value)}
                      onBlur={() => handleBlur('telefono')}
                      className={`input-base ${erroresVisibles.telefono || errores.telefono ? 'border-red-400 ring-red-200 focus:ring-red-400' : ''}`}
                      placeholder="300 123 4567"
                      aria-invalid={!!errores.telefono}
                      aria-describedby={errores.telefono ? 'err-tel' : undefined}
                    />
                    <InputError error={erroresVisibles.telefono || errores.telefono} />
                  </div>
                  <div>
                    <label className="label">Direccion de envio <span className="text-red-500">*</span></label>
                    <input
                      value={datos.direccion}
                      onChange={e => handleChange('direccion', e.target.value)}
                      onBlur={() => handleBlur('direccion')}
                      className={`input-base ${erroresVisibles.direccion || errores.direccion ? 'border-red-400 ring-red-200 focus:ring-red-400' : ''}`}
                      placeholder="Cra 1 # 2-3, Bogota"
                      aria-invalid={!!errores.direccion}
                      aria-describedby={errores.direccion ? 'err-dir' : undefined}
                    />
                    <InputError error={erroresVisibles.direccion || errores.direccion} />
                  </div>
                </div>
                <div className="mt-6 flex gap-4">
                  <button onClick={() => navigate('/carrito')} className="btn-secondary justify-center">
                    <ArrowLeft size={16} /> Volver al carrito
                  </button>
                  <button onClick={continuarDatos} className="flex-1 btn-primary justify-center">
                    Continuar al pago &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Selección de pago ─────────────────── */}
            {paso === 'pago' && (
              <div className="animate-fade-in">
                <div className="mb-4 p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-start gap-3 text-sm text-teal-900">
                  <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Conexion segura</p>
                    <p className="text-teal-700/80 mt-0.5">Tus datos estan protegidos con cifrado SSL. Modo sandbox - demo educativa.</p>
                  </div>
                </div>

                {/* Resumen de envío colapsable */}
                <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600 flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-400" />
                  <span>Envio a: <strong className="text-gray-800">{datos.nombre}</strong> — {datos.direccion}</span>
                </div>

                <p className="text-sm font-medium text-gray-600 mb-4">
                  Selecciona tu metodo de pago preferido:
                </p>

                {ventaMut.isPending ? (
                  <SkeletonPago />
                ) : (
                  <div className="grid gap-3">
                    {METODOS.map(m => (
                      <MetodoCard
                        key={m.id}
                        m={m}
                        sel={metodoPago === m.id}
                        onClick={() => { setMetodoPago(m.id); setTocados(prev => ({ ...prev, metodoPago: true })) }}
                        disabled={ventaMut.isPending}
                        error={errorMetodoPago}
                      />
                    ))}
                  </div>
                )}

                {errorMetodoPago && (
                  <p className="flex items-center gap-1 text-xs text-red-600 mt-2" role="alert">
                    <AlertCircle className="w-3 h-3" /> Selecciona un metodo de pago para continuar
                  </p>
                )}

                <div className="mt-6 flex gap-4">
                  <button onClick={() => setPaso('datos')} disabled={ventaMut.isPending} className="btn-secondary justify-center">
                    <ArrowLeft size={16} /> Volver
                  </button>
                  <button
                    onClick={continuarPago}
                    disabled={ventaMut.isPending || !metodoPago}
                    className={`flex-1 btn-primary justify-center border-none disabled:opacity-50 ${
                      ventaMut.isPending
                        ? 'bg-teal-500 cursor-wait'
                        : 'bg-teal-600 hover:bg-teal-700'
                    }`}
                  >
                    {ventaMut.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                      </span>
                    ) : (
                      `Pagar $${total.toLocaleString()} COP`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ───────────────────────────────────── */}
        <aside className="lg:col-span-1 space-y-4">
          <div className={`surface p-5 space-y-4 ${ventaMut.isPending ? 'opacity-60 pointer-events-none' : ''}`}>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Tag size={16} /> Codigo de descuento</h3>
            <div className="flex gap-2">
              <input
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                placeholder="Ej: FARMACY10"
                className="input-base flex-1 uppercase text-sm"
                disabled={ventaMut.isPending}
                onKeyDown={e => e.key === 'Enter' && aplicarCodigo()}
              />
              <button
                onClick={aplicarCodigo}
                disabled={ventaMut.isPending || !codigo.trim()}
                className="px-4 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {ventaMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
              </button>
            </div>
            {codigo.toUpperCase() === 'FARMACY10' && descuento > 0 && (
              <p className="text-green-600 text-xs font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Descuento del 10% aplicado!
              </p>
            )}

            {cliente && saldoPts > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Coins size={16} className="text-amber-500" /> Mis Puntos</h3>
                  <span className="text-xs font-bold text-amber-600 border border-amber-200 bg-amber-50 px-2 py-1 rounded-lg">{saldoPts.toLocaleString()} pts</span>
                </div>
                <label className={`flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition ${ventaMut.isPending ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input
                    type="checkbox"
                    checked={usarPuntos}
                    onChange={e => setUsarPuntos(e.target.checked)}
                    className="w-5 h-5 accent-teal-600"
                    disabled={ventaMut.isPending}
                  />
                  <div className="text-sm">
                    <p className="font-medium text-gray-800">Usar puntos como cashback</p>
                    <p className="text-xs text-gray-500">Ahorras hasta ${saldoPts.toLocaleString()} COP</p>
                  </div>
                </label>
                {usarPuntos && (
                  <p className="text-amber-600 text-xs font-medium mt-1 flex items-center gap-1">
                    <Coins className="w-3 h-3" /> Redimiendo {valPts.toLocaleString()} puntos
                  </p>
                )}
              </div>
            )}
          </div>

          <div className={`surface p-5 ${ventaMut.isPending ? 'opacity-60' : ''}`}>
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
            <div className={`flex justify-between items-end pt-4 mt-4 border-t border-slate-200 ${ventaMut.isPending ? 'animate-pulse' : ''}`}>
              <div>
                <span className="font-bold text-slate-900 block">Total a pagar</span>
                {cliente && <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">+ {ptsGanados} pts nuevos</span>}
              </div>
              <span className={`text-2xl font-bold ${ventaMut.isPending ? 'text-gray-400' : 'text-teal-700'}`}>
                {ventaMut.isPending ? '...' : `$${total.toLocaleString()}`}
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Badge perfil de salud en sidebar ──────────── */}
      {cliente && (
        <div className="fixed bottom-4 right-4 z-40 md:static md:block">
          <div className="bg-white dark:bg-dark-surface border border-rose-200 dark:border-rose-800/30 rounded-xl px-3 py-2 shadow-sm flex items-center gap-2">
            <Heart size={14} className={tieneAlergenos ? 'text-rose-500' : 'text-gray-300'} />
            <span className="text-[11px] text-gray-500 dark:text-dark-text/60">
              {tieneAlergenos
                ? `${perfilSalud.alergenos.length} alérgeno(s) registrado(s)`
                : 'Sin perfil de salud — configura en Mi Cuenta'
              }
            </span>
          </div>
        </div>
      )}

      {/* ── Verificación en progreso — overlay ───────── */}
      {verificandoSalud && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-surface rounded-2xl px-8 py-6 shadow-xl flex items-center gap-4">
            <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
            <p className="text-sm font-medium text-gray-700 dark:text-dark-text">
              Verificando alérgenos en tu carrito...
            </p>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

export default Checkout
