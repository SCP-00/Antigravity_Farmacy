import { useQuery } from '@tanstack/react-query'
import { Heart, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { clientesService } from '@/services'
import { useAuthCliente } from '@/hooks'
import { ProductCard } from '@/components/tienda/ProductCard'
import SEOHead from '@/components/shared/SEOHead'

export default function Favoritos() {
  const { estaLogueado } = useAuthCliente()

  const { data: favoritos = [], isLoading } = useQuery({
    queryKey: ['favoritos-cliente'],
    queryFn: clientesService.obtenerFavoritos,
    enabled: estaLogueado,
  })

  const productos = favoritos.map((f: any) => f.producto)

  if (!estaLogueado) {
    return (
      <>
        <SEOHead title="Mis favoritos" description="Inicia sesión para guardar tus productos favoritos en Farmacy." path="/cuenta/favoritos" />
        <div className="section-shell py-20 text-center">
          <Heart className="w-16 h-16 mx-auto text-slate-200 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Inicia sesión para guardar favoritos</h1>
          <p className="text-slate-500 mb-6">Crea una cuenta para guardar tus medicamentos de uso regular.</p>
          <Link to="/login" className="btn-primary">Iniciar sesión</Link>
        </div>
      </>
    )
  }

  return (
    <>
      <SEOHead title="Mis favoritos" description="Tus productos favoritos guardados en Farmacy. Accede rápidamente a tus medicamentos de uso regular." path="/cuenta/favoritos" />
      <div className="section-shell py-8 md:py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/productos" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mis favoritos</h1>
            <p className="text-slate-500 text-sm mt-1">{productos.length} producto(s) guardado(s)</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : productos.length === 0 ? (
          <div className="surface p-12 text-center">
            <Heart className="w-16 h-16 mx-auto text-slate-200 mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Tu lista está vacía</h2>
            <p className="text-slate-500 mb-6">Explora nuestro catálogo y presiona el ❤️ para guardar tus productos preferidos.</p>
            <Link to="/productos" className="btn-primary">Ver catálogo</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {productos.map((producto: any) => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
