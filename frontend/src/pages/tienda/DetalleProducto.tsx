// ══════════════════════════════════════════════════════════
//  PÁGINAS STUB — Listas para desarrollar
//  Cada una tiene su estructura base y el import correcto
//  para que el router de App.tsx no falle al arrancar
// ══════════════════════════════════════════════════════════

// ── src/pages/tienda/DetalleProducto.tsx ─────────────────
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, ArrowLeft } from 'lucide-react'
import { productosService } from '@/services'
import { useFormateo } from '@/hooks'
import { useCarritoStore } from '@/store/carritoStore'
import { CATEGORIAS_ICONOS } from '@/config/constants'

export function DetalleProducto() {
  const { slug } = useParams<{ slug: string }>()
  const { cop }  = useFormateo()
  const agregar = useCarritoStore((state: any) => state.agregar)

  const { data: p, isLoading } = useQuery({
    queryKey: ['producto', slug],
    queryFn:  () => productosService.obtener(slug!),
    enabled:  !!slug,
  })

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="animate-pulse grid md:grid-cols-2 gap-8">
        <div className="h-72 bg-gray-100 rounded-2xl"/>
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3"/>
          <div className="h-4 bg-gray-100 rounded w-1/2"/>
          <div className="h-8 bg-gray-200 rounded w-1/3"/>
        </div>
      </div>
    </div>
  )

  if (!p) return (
    <div className="text-center py-20">
      <p className="text-gray-400">Producto no encontrado</p>
      <Link to="/productos" className="text-teal-700 hover:underline mt-2 inline-block">← Volver al catálogo</Link>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/productos" className="inline-flex items-center gap-1 text-sm text-gray-500
                                        hover:text-teal-700 mb-6 transition-colors">
        <ArrowLeft size={15}/> Volver al catálogo
      </Link>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-teal-50 rounded-3xl flex items-center justify-center h-72">
          {p.imagenUrl
            ? <img src={p.imagenUrl} alt={p.nombre} className="max-h-60 object-contain"/>
            : <span className="text-8xl">{CATEGORIAS_ICONOS[p.categoria?.nombre] ?? '💊'}</span>}
        </div>
        <div>
          <span className="badge-otc mb-2 inline-block">{p.categoria?.nombre}</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{p.nombre} {p.concentracion}</h1>
          <p className="text-gray-500 mb-1">{p.presentacion} · {p.laboratorio}</p>
          {p.requiereRx && <span className="badge-rx mb-3 inline-block">⚠️ Requiere fórmula médica</span>}
          {p.descripcion && <p className="text-gray-600 text-sm mb-4">{p.descripcion}</p>}
          <p className="text-3xl font-bold text-teal-700 mb-4">{cop(p.precioVenta)}</p>
          <button
            onClick={() => agregar({
              productoId:    p.id,
              nombre:        p.nombre,
              concentracion: p.concentracion ?? '',
              presentacion:  p.presentacion ?? '',
              precioUnitario:Number(p.precioVenta),
              imagenUrl:     p.imagenUrl,
              requiereRx:    p.requiereRx,
              stockMaximo:   p.stockTotal || 10,
            })}
            className="btn-primary w-full justify-center py-3">
            <ShoppingCart size={18}/> Agregar al carrito
          </button>
          <p className="text-xs text-gray-400 mt-3 text-center">
            ⚕️ Consulta siempre con un profesional de la salud antes de tomar cualquier medicamento.
          </p>
        </div>
      </div>
    </div>
  )
}
export default DetalleProducto