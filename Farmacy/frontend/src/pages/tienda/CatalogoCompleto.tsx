import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Filter, X } from 'lucide-react'
import { apiCliente } from '@/config/api'
import { ProductCard } from '@/components/tienda/ProductCard'
import type { ProductoCatalogo, CategoriaCatalogo } from '@/types/producto.types'
import toast from 'react-hot-toast'

export function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [productos, setProductos] = useState<ProductoCatalogo[]>([])
  const [categorias, setCategorias] = useState<CategoriaCatalogo[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtroAbierto, setFiltroAbierto] = useState(false)

  // Filtros
  const q = searchParams.get('q') || ''
  const categoria = searchParams.get('categoria') || ''
  const marca = searchParams.get('marca') || ''
  const precioMin = searchParams.get('precioMin') ? Number(searchParams.get('precioMin')) : undefined
  const precioMax = searchParams.get('precioMax') ? Number(searchParams.get('precioMax')) : undefined
  const ordenar = searchParams.get('ordenar') || 'relevancia'

  const marcas = useMemo(
    () => [...new Set(productos.map((p) => p.marca))].sort(),
    [productos]
  )

  const precios = useMemo(() => {
    if (productos.length === 0) return { min: 0, max: 100000 }
    const precios = productos.map((p) => p.precioVenta)
    return { min: Math.min(...precios), max: Math.max(...precios) }
  }, [productos])

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true)
        const params = new URLSearchParams()
        if (q) params.append('q', q)
        if (categoria) params.append('categoria', categoria)
        if (marca) params.append('marca', marca)
        if (precioMin) params.append('precioMin', String(precioMin))
        if (precioMax) params.append('precioMax', String(precioMax))
        if (ordenar && ordenar !== 'relevancia') params.append('ordenar', ordenar)

        const [resProductos, resCategorias] = await Promise.all([
          apiCliente.get(`/productos/buscar?${params.toString()}&limite=50`),
          apiCliente.get('/categorias'),
        ])

        setProductos(resProductos.data.data)
        setCategorias(resCategorias.data.data)
      } catch (error) {
        toast.error('Error cargando productos')
        console.error(error)
      } finally {
        setCargando(false)
      }
    }
    cargarDatos()
  }, [q, categoria, marca, precioMin, precioMax, ordenar])

  const handleFiltroChange = (key: string, value: string | undefined) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    setSearchParams(newParams)
  }

  const limpiarFiltros = () => {
    setSearchParams({})
  }

  const tieneFiltros = q || categoria || marca || precioMin || precioMax

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {categoria ? `Categoría: ${categorias.find((c) => c.slug === categoria)?.nombre || categoria}` : 'Catálogo de Productos'}
          </h1>
          <p className="text-gray-600 mt-1">{productos.length} productos encontrados</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar - Filters */}
          <aside className={`${filtroAbierto ? 'block' : 'hidden'} md:block md:col-span-1`}>
            <div className="bg-gray-50 rounded-lg p-6 sticky top-20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros
                </h2>
                {tieneFiltros && (
                  <button
                    onClick={limpiarFiltros}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Búsqueda */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Búsqueda</label>
                <input
                  type="text"
                  placeholder="Producto, marca..."
                  value={q}
                  onChange={(e) => handleFiltroChange('q', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Categorías */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Categorías</label>
                <div className="space-y-2">
                  <button
                    onClick={() => handleFiltroChange('categoria', undefined)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      !categoria ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todas
                  </button>
                  {categorias.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleFiltroChange('categoria', cat.slug)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                        categoria === cat.slug
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Marcas */}
              {marcas.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Marcas</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {marcas.map((m) => (
                      <label key={m} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={marca === m}
                          onChange={(e) => handleFiltroChange('marca', e.target.checked ? m : undefined)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">{m}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Precio */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Rango de Precio</label>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder={`Mín: $${precios.min}`}
                    value={precioMin || ''}
                    onChange={(e) => handleFiltroChange('precioMin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    placeholder={`Máx: $${precios.max}`}
                    value={precioMax || ''}
                    onChange={(e) => handleFiltroChange('precioMax', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Ordenar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
                <select
                  value={ordenar}
                  onChange={(e) => handleFiltroChange('ordenar', e.target.value === 'relevancia' ? undefined : e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="relevancia">Relevancia</option>
                  <option value="precio-asc">Menor precio</option>
                  <option value="precio-desc">Mayor precio</option>
                  <option value="stock">Más disponibles</option>
                </select>
              </div>
            </div>

            {/* Close button mobile */}
            <button
              onClick={() => setFiltroAbierto(false)}
              className="md:hidden mt-4 w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
            >
              Cerrar filtros
            </button>
          </aside>

          {/* Main content */}
          <div className="md:col-span-3">
            {/* Mobile filter button */}
            <button
              onClick={() => setFiltroAbierto(!filtroAbierto)}
              className="md:hidden flex items-center gap-2 mb-6 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium"
            >
              <Filter className="w-5 h-5" />
              Filtros
            </button>

            {/* Products grid */}
            {cargando ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
                ))}
              </div>
            ) : productos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {productos.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay productos</h3>
                <p className="text-gray-600 mb-4">Intenta ajustar tus filtros de búsqueda</p>
                <button
                  onClick={limpiarFiltros}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver todos los productos
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Catalogo
