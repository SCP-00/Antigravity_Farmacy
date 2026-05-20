import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, ShoppingCart, Truck, ShieldAlert, Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mockProductos } from '@/data/catalogo'
import { useCarritoStore } from '@/store/carritoStore'
import { useFormateo, useAuthCliente } from '@/hooks'
import { clientesService } from '@/services'
import toast from 'react-hot-toast'

export default function ProductoDetalle() {
  const { slug } = useParams()
  const { cop } = useFormateo()
  const agregar = useCarritoStore((state) => state.agregar)
  const { estaLogueado } = useAuthCliente()
  const queryClient = useQueryClient()
  const [esFavorito, setEsFavorito] = useState(false)

  const producto = mockProductos.find((item) => item.slug === slug || item.id === slug)

  const favoritosQuery = useQuery({
    queryKey: ['favoritos-cliente'],
    queryFn: clientesService.obtenerFavoritos,
    enabled: estaLogueado,
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (!producto || !favoritosQuery.data) return
    setEsFavorito(
      favoritosQuery.data.some((favorito: { productoId: string }) => favorito.productoId === producto.id)
    )
  }, [favoritosQuery.data, producto])

  const favoritoMutation = useMutation({
    mutationFn: () => clientesService.toggleFavorito(producto?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritos-cliente'] })
      setEsFavorito(prev => !prev)
      toast.success(esFavorito ? 'Eliminado de favoritos' : 'Agregado a favoritos')
    },
    onError: () => {
      toast.error('Error al actualizar favoritos')
    },
  })

  if (!producto) {
    return (
      <div className="section-shell py-12">
        <div className="surface p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Producto no encontrado</h1>
          <p className="mt-3 text-slate-600">El enlace no coincide con un producto disponible en esta versión local.</p>
          <Link to="/productos" className="btn-primary mt-6">
            <ArrowLeft className="w-4 h-4" /> Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  const agregarAlCarrito = () => {
    agregar({
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

  return (
    <div className="section-shell py-8 md:py-10">
      <Link to="/productos" className="inline-flex items-center gap-2 text-teal-700 font-semibold hover:text-teal-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="surface p-6 md:p-8">
          <div className="aspect-square rounded-[2rem] bg-gradient-to-br from-teal-50 to-sky-50 flex items-center justify-center text-8xl">
            💊
          </div>
        </div>

        <div className="surface p-6 md:p-8">
          <span className="section-chip">{producto.categoriaNombre}</span>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold text-slate-900">{producto.nombre}</h1>
          <p className="mt-2 text-slate-600">{producto.marca} · {producto.presentacion} · {producto.concentracion}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-teal-700">{cop(producto.precioVenta)}</span>
            <span className="text-sm text-slate-500 line-through">{cop(Math.round(producto.precioVenta * 1.18))}</span>
          </div>

          <div className="mt-6 space-y-3 text-sm text-slate-700">
            <p className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-teal-700" /> {producto.requiereRx ? 'Requiere fórmula médica' : 'Venta libre'}</p>
            <p className="flex items-center gap-2"><Truck className="w-4 h-4 text-teal-700" /> {producto.disponibleEnvio ? 'Disponible para domicilio' : 'Solo disponible en sede'}</p>
            <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> {producto.stockTotal > 0 ? `${producto.stockTotal} unidades disponibles` : 'Agotado temporalmente'}</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={agregarAlCarrito} disabled={producto.stockTotal === 0} className="btn-primary disabled:opacity-50">
              <ShoppingCart className="w-4 h-4" /> Agregar al carrito
            </button>
            {estaLogueado && (
              <button
                onClick={() => favoritoMutation.mutate()}
                disabled={favoritoMutation.isPending}
                className={`btn-secondary ${esFavorito ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' : ''}`}
              >
                <Heart className={`w-4 h-4 ${esFavorito ? 'fill-red-700' : ''}`} />
                {esFavorito ? 'En favoritos' : 'Agregar a favoritos'}
              </button>
            )}
          </div>

          <div className="mt-8 rounded-3xl bg-slate-50 border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900">Descripción rápida</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Esta vista usa datos locales para validación del flujo B2C. Puedes ampliar la ficha con indicaciones, composición, contraindicaciones y recomendaciones de uso.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}