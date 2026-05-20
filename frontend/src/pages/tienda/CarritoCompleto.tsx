import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ArrowLeft, ShoppingCart } from 'lucide-react'
import { useCarritoStore } from '@/store/carritoStore'

export function Carrito() {
  const { items, quitar, cambiarCantidad, total, subtotal, tieneRx, limpiar } = useCarritoStore()

  if (items.length === 0) {
    return (
      <div className="bg-white min-h-[60vh] flex flex-col items-center justify-center">
        <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h1>
        <p className="text-gray-600 mb-6">Explora nuestro catálogo y agrega productos</p>
        <Link
          to="/catalogo"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Seguir comprando
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tu Carrito</h1>
          <p className="text-gray-600 mt-1">{items.length} producto{items.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productoId} className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {/* Image */}
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <span className="text-2xl">💊</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.nombre}</h3>
                    <p className="text-sm text-gray-600">{item.marca} • {item.presentacion}</p>
                    {item.requiereRx && (
                      <p className="text-xs text-orange-600 mt-1">⚕️ Requiere receta médica</p>
                    )}
                    <p className="text-sm font-semibold text-blue-600 mt-2">
                      ${item.precioUnitario.toLocaleString()} c/u
                    </p>
                  </div>

                  {/* Quantity */}
                  <div className="flex flex-col items-center justify-between">
                    <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg">
                      <button
                        onClick={() => cambiarCantidad(item.productoId, item.cantidad - 1)}
                        className="p-1 hover:bg-gray-100"
                        disabled={item.cantidad <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.cantidad}</span>
                      <button
                        onClick={() => cambiarCantidad(item.productoId, item.cantidad + 1)}
                        className="p-1 hover:bg-gray-100"
                        disabled={item.cantidad >= item.stockMaximo}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => quitar(item.productoId)}
                      className="mt-2 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="text-lg font-bold text-gray-900">
                      ${(item.precioUnitario * item.cantidad).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue shopping */}
            <Link
              to="/catalogo"
              className="mt-8 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Seguir comprando
            </Link>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Resumen del pedido</h2>

              <div className="space-y-4 pb-6 border-b border-gray-300">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>${subtotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Envío</span>
                  <span className="text-green-600 font-semibold">Gratis</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>IVA (19%)</span>
                  <span>${Math.round(subtotal() * 0.19).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold text-gray-900 pt-6 mb-6">
                <span>Total</span>
                <span>${Math.round(total() * 1.19).toLocaleString()}</span>
              </div>

              {tieneRx() && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs text-orange-800">
                    ⚠️ Tu carrito contiene medicamentos que requieren receta médica. Necesitarás subir la documentación en el checkout.
                  </p>
                </div>
              )}

              <Link
                to="/checkout"
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 mb-3"
              >
                Proceder al pago
              </Link>

              <button
                onClick={() => limpiar()}
                className="w-full py-2 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-100"
              >
                Vaciar carrito
              </button>

              {/* Guarantee */}
              <div className="mt-6 p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-800">
                  ✓ Compra segura • Medicinas certificadas • Garantía de calidad
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Carrito
