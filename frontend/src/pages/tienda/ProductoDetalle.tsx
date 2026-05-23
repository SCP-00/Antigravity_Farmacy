import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, ShoppingCart, Truck, ShieldAlert, Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCarritoStore } from '@/store/carritoStore'
import { useFormateo, useAuthCliente } from '@/hooks'
import { clientesService, productosService } from '@/services'
import toast from 'react-hot-toast'

export default function ProductoDetalle() {
  const { slug: id } = useParams() // El enrutador nos pasa el ID real en la variable slug
  const { cop } = useFormateo()
  const agregar = useCarritoStore((state) => state.agregar)
  const { estaLogueado } = useAuthCliente()
  const queryClient = useQueryClient()
  const [esFavorito, setEsFavorito] = useState(false)

  const { data: producto, isLoading: isLoadingProducto } = useQuery({
    queryKey: ['producto', id],
    queryFn: () => productosService.obtener(id!),
    enabled: !!id
  })

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
  })

  if (isLoadingProducto) {
    return <div className="py-20 text-center text-gray-500">Cargando producto desde BD...</div>
  }

  if (!producto) {
    return (
      <div className="section-shell py-12">
        <div className="surface p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Producto no encontrado</h1>
          <p className="mt-3 text-slate-600">El producto no existe o fue retirado del sistema.</p>
          <Link to="/productos" className="btn-primary mt-6">
            <ArrowLeft className="w-4 h-4" /> Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  const stockTotal = producto.lotes?.reduce((sum: number, l: any) => sum + l.cantidadActual, 0) ?? 0
  const precio = Number(producto.precioVenta)

  const agregarAlCarrito = () => {
    agregar({
      productoId: producto.id,
      nombre: producto.nombre,
      marca: producto.laboratorio || 'Genérico',
      presentacion: producto.presentacion || '',
      concentracion: producto.concentracion || '',
      precioUnitario: precio,
      cantidad: 1,
      stockMaximo: stockTotal,
      requiereRx: producto.requiereRx,
      disponibleEnvio: true,
      disponibleTienda: true,
      imagenUrl: producto.imagenUrl,
    })
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
          <span className="section-chip">{producto.categoria?.nombre || 'General'}</span>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold text-slate-900">{producto.nombre} {producto.concentracion}</h1>
          <p className="mt-2 text-slate-600">{producto.laboratorio || 'Genérico'} · {producto.presentacion}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-teal-700">{cop(precio)}</span>
            <span className="text-sm text-slate-500 line-through">{cop(Math.round(precio * 1.18))}</span>
          </div>

          <div className="mt-6 space-y-3 text-sm text-slate-700">
            <p className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-teal-700" /> {producto.requiereRx ? 'Requiere fórmula médica' : 'Venta libre'}</p>
            <p className="flex items-center gap-2"><Truck className="w-4 h-4 text-teal-700" /> Disponible para domicilio</p>
            <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> {stockTotal > 0 ? `${stockTotal} unidades disponibles (Stock Real)` : 'Agotado temporalmente'}</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={agregarAlCarrito} disabled={stockTotal === 0} className="btn-primary disabled:opacity-50">
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
        </div>
      </div>
    </div>
  )
}