import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Pill, Truck } from 'lucide-react'
import { useCarritoStore } from '@/store/carritoStore'
import type { ProductoCatalogo } from '@/types/producto.types'
import toast from 'react-hot-toast'
import { useAuthCliente } from '@/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clientesService } from '@/services'

interface ProductCardProps {
  producto: ProductoCatalogo
  variant?: 'grid' | 'list'
}

export function ProductCard({ producto, variant = 'grid' }: ProductCardProps) {
  const agregarCarrito = useCarritoStore((state) => state.agregar)
  const { estaLogueado } = useAuthCliente()
  const queryClient = useQueryClient()

  const favoritoMutation = useMutation({
    mutationFn: () => clientesService.toggleFavorito(producto.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritos-cliente'] })
      toast.success('Lista de favoritos actualizada')
    },
    onError: () => {
      toast.error('Error al actualizar favoritos')
    }
  })

  const handleAgregarCarrito = () => {
    agregarCarrito({
      productoId: producto.id,
      nombre: producto.nombre,
      marca: producto.marca,
      presentacion: producto.presentacion,
      concentracion: producto.concentracion,
      precioUnitario: producto.precioVenta,
      cantidad: 1,
      stockMaximo: producto.stockTotal,
      requiereRx: producto.requiereRx,
      disponibleEnvio: producto.disponibleEnvio,
      disponibleTienda: producto.disponibleTienda,
      imagenUrl: producto.imagenUrl,
    })
    toast.success(`${producto.nombre} agregado al carrito`)
  }

  const descuentoPorcentaje = 15 // Simulado
  const precioAnterior = Math.round(producto.precioVenta * 1.18)

  if (variant === 'list') {
    return (
      <div className="flex gap-4 p-4 surface transition hover:-translate-y-0.5">
        <Link to={`/productos/${producto.slug}`} className="flex-shrink-0">
          <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center">
            <Pill className="w-10 h-10 text-teal-300" />
          </div>
        </Link>
        <div className="flex-1">
          <Link to={`/productos/${producto.slug}`} className="font-semibold text-slate-900 hover:text-teal-700">
            {producto.nombre}
          </Link>
          <p className="text-sm text-slate-600">{producto.marca} • {producto.presentacion}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-bold text-teal-700">${producto.precioVenta.toLocaleString()}</span>
            <span className="text-sm text-slate-500 line-through">${precioAnterior.toLocaleString()}</span>
            <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">-{descuentoPorcentaje}%</span>
          </div>
          {producto.requiereRx && (
            <p className="text-xs text-orange-600 mt-1">⚕️ Requiere receta médica</p>
          )}
        </div>
        <button
          onClick={handleAgregarCarrito}
          className="self-center p-2 bg-teal-700 text-white rounded-xl hover:bg-teal-600"
          disabled={producto.stockTotal === 0}
          title="Agregar al carrito de compras"
          aria-label="Agregar al carrito de compras"
        >
          <ShoppingCart className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="surface overflow-hidden transition group hover:-translate-y-0.5">
      {/* Image container */}
      <Link to={`/productos/${producto.slug}`} className="relative block overflow-hidden bg-slate-100 aspect-square">
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-sky-50">
          <Pill className="w-16 h-16 text-teal-300" />
        </div>

        {/* Badge */}
        {producto.requiereRx && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            Rx
          </div>
        )}

        {/* Discount badge */}
        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
          -{descuentoPorcentaje}%
        </div>

        {/* Shipping badge */}
        {producto.disponibleEnvio && (
          <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Truck className="w-3 h-3" /> Envío
          </div>
        )}

        {/* Favorite button (Interactivo y visible si está logueado) */}
        {estaLogueado && (
          <button
            onClick={(e) => {
              e.preventDefault()
              favoritoMutation.mutate()
            }}
            disabled={favoritoMutation.isPending}
            className="absolute bottom-2 right-2 bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition shadow-md hover:scale-110 active:scale-95 z-10"
            title="Agregar a mis favoritos"
            aria-label="Agregar a mis favoritos"
          >
            <Heart className="w-5 h-5 text-slate-400 hover:text-red-500 hover:fill-red-500" />
          </button>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link to={`/productos/${producto.slug}`}>
          <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 hover:text-teal-700 mb-1 min-h-[40px]">
            {producto.nombre}
          </h3>
        </Link>

        <p className="text-xs text-slate-600 mb-2">{producto.marca}</p>
        <p className="text-xs text-slate-500 mb-3">{producto.presentacion}</p>

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-teal-700">${producto.precioVenta.toLocaleString()}</span>
            <span className="text-sm text-slate-500 line-through">${precioAnterior.toLocaleString()}</span>
          </div>
        </div>

        {/* Stock */}
        {producto.stockTotal === 0 ? (
          <button className="w-full py-2 bg-gray-300 text-gray-600 rounded-lg font-medium cursor-not-allowed">
            Agotado
          </button>
        ) : (
          <button
            onClick={handleAgregarCarrito}
            className="w-full py-2 bg-teal-700 text-white rounded-full font-medium hover:bg-teal-600 transition flex items-center justify-center gap-2"
            title="Agregar producto al carrito"
            aria-label="Agregar producto al carrito"
          >
            <ShoppingCart className="w-4 h-4" />
            Agregar
          </button>
        )}

        {/* Stock indicator */}
        <p className="text-xs text-slate-600 mt-2">
          {producto.stockTotal > 10 ? (
            <span className="text-green-600">✓ En stock</span>
          ) : producto.stockTotal > 0 ? (
            <span className="text-orange-600">⚠ Últimas {producto.stockTotal} unidades</span>
          ) : (
            <span className="text-red-600">✗ Agotado</span>
          )}
        </p>
      </div>
    </div>
  )
}

export default ProductCard