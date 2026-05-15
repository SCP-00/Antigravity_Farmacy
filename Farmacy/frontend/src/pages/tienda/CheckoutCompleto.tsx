import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Truck, Lock, ArrowLeft, CheckCircle } from 'lucide-react'
import { useCarritoStore } from '@/store/carritoStore'
import toast from 'react-hot-toast'

export function Checkout() {
  const navigate = useNavigate()
  const { items, total, subtotal, limpiar } = useCarritoStore()
  
  const [step, setStep] = useState<'datos' | 'pago' | 'confirmacion'>('datos')
  const [cargando, setCargando] = useState(false)
  const [formDatos, setFormDatos] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: 'Pereira',
    codigoPostal: '',
  })
  const [formPago, setFormPago] = useState({
    nombreTarjeta: '',
    numeroTarjeta: '',
    mes: '',
    año: '',
    cvv: '',
    metodoPago: 'tarjeta',
  })
  const [numeroPedido, setNumeroPedido] = useState('')

  if (items.length === 0) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h1>
          <button
            onClick={() => navigate('/catalogo')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    )
  }

  const handleDatos = () => {
    if (!formDatos.nombre || !formDatos.email || !formDatos.telefono || !formDatos.direccion) {
      toast.error('Completa todos los campos')
      return
    }
    setStep('pago')
  }

  const handlePago = async () => {
    if (!formPago.nombreTarjeta || !formPago.numeroTarjeta || !formPago.mes || !formPago.año || !formPago.cvv) {
      toast.error('Completa todos los datos de la tarjeta')
      return
    }

    setCargando(true)
    try {
      // Simular pago
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      const numero = `FMC-${Date.now().toString().slice(-8)}`
      setNumeroPedido(numero)
      setStep('confirmacion')
      
      // Limpiar carrito
      limpiar()
      
      toast.success('¡Pago procesado exitosamente!')
    } catch (error) {
      toast.error('Error al procesar el pago')
    } finally {
      setCargando(false)
    }
  }

  if (step === 'confirmacion') {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Pedido Confirmado!</h1>
          <p className="text-gray-600 mb-8">
            Tu pedido ha sido procesado exitosamente. Te enviaremos un correo de confirmación.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Número de Pedido</p>
              <p className="text-2xl font-bold text-blue-600 font-mono">{numeroPedido}</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Resumen del Pedido</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{items.length} producto{items.length !== 1 ? 's' : ''}</span>
                <span className="font-semibold">${subtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Envío</span>
                <span className="font-semibold text-green-600">Gratis</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IVA (19%)</span>
                <span className="font-semibold">${Math.round(subtotal() * 0.19).toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-semibold text-lg text-blue-600">${Math.round(total() * 1.19).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mb-6 text-left bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>🚚 Envío:</strong> Tu pedido llegará entre 30-45 minutos. Recibirás actualizaciones en tiempo real.
            </p>
          </div>

          <button
            onClick={() => navigate('/catalogo')}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Seguir comprando
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Steps */}
        <div className="flex gap-8 mb-12">
          <div className="flex-1 text-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
              step === 'datos' ? 'bg-blue-600 text-white' : step === 'pago' ? 'bg-green-600 text-white' : 'bg-gray-300 text-white'
            }`}>
              1
            </div>
            <p className={`text-sm font-medium ${step === 'datos' ? 'text-blue-600' : 'text-gray-600'}`}>
              Datos de Envío
            </p>
          </div>
          <div className="flex-1 text-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
              step === 'pago' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-white'
            }`}>
              2
            </div>
            <p className={`text-sm font-medium ${step === 'pago' ? 'text-blue-600' : 'text-gray-600'}`}>
              Pago
            </p>
          </div>
          <div className="flex-1 text-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 bg-gray-300 text-white`}>
              ✓
            </div>
            <p className="text-sm font-medium text-gray-600">
              Confirmación
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg p-8 shadow">
              {step === 'datos' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Datos de Envío</h2>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={formDatos.nombre}
                      onChange={(e) => setFormDatos({ ...formDatos, nombre: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      value={formDatos.email}
                      onChange={(e) => setFormDatos({ ...formDatos, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono"
                      value={formDatos.telefono}
                      onChange={(e) => setFormDatos({ ...formDatos, telefono: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      placeholder="Dirección"
                      value={formDatos.direccion}
                      onChange={(e) => setFormDatos({ ...formDatos, direccion: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Ciudad"
                        value={formDatos.ciudad}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                        disabled
                      />
                      <input
                        type="text"
                        placeholder="Código postal"
                        value={formDatos.codigoPostal}
                        onChange={(e) => setFormDatos({ ...formDatos, codigoPostal: e.target.value })}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleDatos}
                    className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Continuar al pago
                  </button>
                </div>
              )}

              {step === 'pago' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Método de Pago</h2>
                  
                  <div className="mb-6 space-y-3">
                    <label className="flex items-center gap-3 p-4 border-2 border-blue-500 rounded-lg cursor-pointer bg-blue-50">
                      <input type="radio" name="metodo" value="tarjeta" checked readOnly className="w-4 h-4" />
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">Tarjeta de Crédito/Débito</span>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Nombre en la tarjeta"
                      value={formPago.nombreTarjeta}
                      onChange={(e) => setFormPago({ ...formPago, nombreTarjeta: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Número de tarjeta (simulado)"
                      value={formPago.numeroTarjeta}
                      onChange={(e) => setFormPago({ ...formPago, numeroTarjeta: e.target.value.slice(0, 16) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={16}
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="MM"
                        value={formPago.mes}
                        onChange={(e) => setFormPago({ ...formPago, mes: e.target.value.slice(0, 2) })}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength="2"
                      />
                      <input
                        type="text"
                        placeholder="AA"
                        value={formPago.año}
                        onChange={(e) => setFormPago({ ...formPago, año: e.target.value.slice(0, 2) })}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength="2"
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        value={formPago.cvv}
                        onChange={(e) => setFormPago({ ...formPago, cvv: e.target.value.slice(0, 3) })}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={3}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex gap-4">
                    <button
                      onClick={() => setStep('datos')}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Atrás
                    </button>
                    <button
                      onClick={handlePago}
                      disabled={cargando}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      {cargando ? 'Procesando...' : 'Pagar Ahora'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resumen */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Resumen</h3>
              <div className="space-y-3 pb-4 border-b border-gray-200">
                {items.slice(0, 3).map((item: any) => (
                  <div key={item.productoId} className="text-sm">
                    <p className="text-gray-700 line-clamp-1">{item.nombre}</p>
                    <p className="text-gray-600">x{item.cantidad} = ${(item.precioUnitario * item.cantidad).toLocaleString()}</p>
                  </div>
                ))}
                {items.length > 3 && (
                  <p className="text-sm text-gray-600">+{items.length - 3} más</p>
                )}
              </div>

              <div className="space-y-2 py-4 border-b border-gray-200">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Envío</span>
                  <span className="text-green-600 font-semibold">Gratis</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>IVA (19%)</span>
                  <span>${Math.round(subtotal() * 0.19).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold text-gray-900 pt-4">
                <span>Total</span>
                <span>${Math.round(total() * 1.19).toLocaleString()}</span>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                <Lock className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Compra 100% segura. Tus datos están protegidos.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
