import { useSearchParams } from 'react-router-dom'
import { Filter, Sparkles, Loader2 } from 'lucide-react'
import { ProductCard } from '@/components/tienda/ProductCard'
import { useProductosBusqueda, useCategorias } from '@/hooks'

export function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') ?? ''
  const categoria = searchParams.get('categoria') ?? ''
  const ordenar = searchParams.get('ordenar') ?? 'nombre'

  const { data: categorias } = useCategorias()
  
  const { data: resultado, isLoading } = useProductosBusqueda({ 
    q, 
    categoria, 
    ordenar, 
    limite: 50 
  })

  const handleChange = (key: string, value?: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  const limpiar = () => setSearchParams({})

  const productos = resultado?.data ?? []
  const meta = resultado?.meta ?? { total: 0 }

  return (
    <div className="section-shell py-8 md:py-10">
      <div className="surface overflow-hidden">
        <div className="hero-panel px-6 py-8 md:px-8 md:py-10 text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]">
            <Sparkles size={14} /> Catálogo
          </span>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">Catálogo de productos</h1>
          <p className="mt-3 text-white/80 max-w-2xl">{meta.total} productos reales sincronizados desde nuestra base de datos.</p>
        </div>
      </div>

      <div className="py-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <div className="surface p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Filter className="w-5 h-5" />Filtros</h2>
              <button onClick={limpiar} className="text-xs text-teal-700 font-semibold">Limpiar</button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Buscar</label>
                <input
                  value={q}
                  onChange={(e) => handleChange('q', e.target.value)}
                  placeholder="Ibuprofeno, Genfar..."
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Categoría</label>
                <select value={categoria} onChange={(e) => handleChange('categoria', e.target.value)} className="input-base">
                  <option value="">Todas</option>
                  {(categorias ?? []).map((cat: any) => <option key={cat.id} value={cat.slug}>{cat.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ordenar</label>
                <select value={ordenar} onChange={(e) => handleChange('ordenar', e.target.value)} className="input-base">
                  <option value="nombre">Relevancia</option>
                  <option value="precio_asc">Menor precio</option>
                  <option value="precio_desc">Mayor precio</option>
                  <option value="stock">Más stock</option>
                </select>
              </div>
            </div>
          </div>
        </aside>

        <main className="md:col-span-3">
          {isLoading ? (
            <div className="surface p-16 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
              <p className="text-slate-500">Cargando inventario real...</p>
            </div>
          ) : productos.length === 0 ? (
            <div className="surface p-10 text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">No hay productos</h3>
              <p className="text-slate-600 mb-4">Prueba ajustando tu búsqueda o filtros.</p>
              <button onClick={limpiar} className="text-teal-700 font-semibold">Limpiar filtros</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {productos.map((producto: any) => <ProductCard key={producto.id} producto={producto} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Catalogo