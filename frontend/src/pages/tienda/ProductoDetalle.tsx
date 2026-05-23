import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, ShoppingCart, Truck, ShieldAlert, Heart, AlertTriangle, Info, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCarritoStore } from '@/store/carritoStore'
import { useFormateo, useAuthCliente } from '@/hooks'
import { clientesService, productosService } from '@/services'
import toast from 'react-hot-toast'

export default function ProductoDetalle() {
  const { slug: id } = useParams()
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
    return <div className="py-20 text-center text-gray-500">Cargando información regulatoria de la base de datos...</div>
  }

  if (!producto) {
    return (
      <div className="section-shell py-12">
        <div className="surface p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Producto no encontrado</h1>
          <p className="mt-3 text-slate-600">El producto no existe, es de uso institucional controlado o fue retirado del sistema.</p>
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

  // Segmentar alérgenos si existen
  const listaAlergenos = producto.alergenos
    ? producto.alergenos.split(',').map((a: string) => a.trim())
    : []

  return (
    <div className="section-shell py-8 md:py-10">
      <Link to="/productos" className="inline-flex items-center gap-2 text-teal-700 font-semibold hover:text-teal-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Imagen */}
        <div className="surface p-6 md:p-8">
          <div className="aspect-square rounded-[2rem] bg-gradient-to-br from-teal-50 to-sky-50 flex items-center justify-center text-8xl">
            💊
          </div>
        </div>

        {/* Detalles Principales */}
        <div className="surface p-6 md:p-8 space-y-6">
          <div>
            <span className="section-chip mb-2">{producto.categoria?.nombre || 'Antialérgicos'}</span>
            <h1 className="text-3xl font-bold text-slate-900">{producto.nombre} {producto.concentracion}</h1>
            <p className="text-sm text-slate-500 mt-1">Por {producto.laboratorio || 'PROCAPS S.A.'}</p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-teal-700">{cop(precio)}</span>
            <span className="text-sm text-slate-400 line-through">{cop(Math.round(precio * 1.18))}</span>
          </div>

          {/* Bloques de advertencias sanitarias e información crítica */}
          <div className="space-y-3">
            {producto.requiereRx && (
              <div className="flex gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-900 text-xs font-semibold">
                <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-bold uppercase tracking-wider">Medicamento de Control (RX)</p>
                  <p className="font-normal text-red-700 mt-0.5">Se requiere presentar la prescripción médica original firmada al momento del despacho.</p>
                </div>
              </div>
            )}

            {listaAlergenos.length > 0 && (
              <div className="flex gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-bold uppercase tracking-wider">Alerta de Excipientes / Alérgenos</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {listaAlergenos.map((al: string) => (
                      <span key={al} className="px-2 py-0.5 bg-amber-200/50 text-amber-800 rounded-md font-bold text-[10px] uppercase">
                        {al}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {producto.advertencias && (
              <div className="flex gap-2.5 p-3.5 bg-sky-50 border border-sky-200 rounded-2xl text-sky-900 text-xs">
                <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />
                <div>
                  <p className="font-bold uppercase tracking-wider">Uso Seguro y Precauciones</p>
                  <p className="text-sky-800 mt-0.5 leading-relaxed">{producto.advertencias}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
            <p className="flex items-center gap-2"><Truck className="w-4 h-4 text-teal-700" /> Disponible para domicilio urgente</p>
            <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> {stockTotal > 0 ? `${stockTotal} unidades en inventario real (FEFO)` : 'Agotado temporalmente'}</p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
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
                {esFavorito ? 'En favoritos' : 'Guardar favorito'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ficha técnica del INVIMA de cara al público */}
      <div className="surface p-6 md:p-8 mt-8 space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
          <FileText size={18} className="text-teal-700" /> Ficha Técnica Autorizada (INVIMA)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs text-slate-700">
          <div className="flex justify-between border-b py-2">
            <span className="text-slate-400">CUM (Código Único):</span>
            <span className="font-mono font-semibold text-slate-900">{producto.cum}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-slate-400">Registro Sanitario:</span>
            <span className="font-semibold text-slate-900">{producto.registroInvima}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-slate-400">Principio Activo:</span>
            <span className="font-bold text-teal-900">{producto.principioActivo}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-slate-400">Código ATC:</span>
            <span className="font-mono font-semibold text-slate-900">{producto.atc || 'No Registrado'}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-slate-400">Forma Farmacéutica:</span>
            <span className="font-semibold text-slate-900">{producto.formaFarmaceutica || 'No Registrada'}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-slate-400">Vía de Administración:</span>
            <span className="font-semibold text-slate-900">{producto.viaAdministracion || 'No Registrada'}</span>
          </div>
          <div className="col-span-1 md:col-span-2 pt-2">
            <span className="text-slate-400 block mb-1">Presentación Comercial Autorizada:</span>
            <p className="bg-slate-50 border p-3 rounded-xl leading-relaxed text-slate-600 font-medium">
              {producto.presentacion}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}