import type { ProductoCatalogo, CategoriaCatalogo, SedeCatalogo } from '@/types/producto.types'

const normalizar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

export const mockCategorias: CategoriaCatalogo[] = [
  { id: 'cat-1', nombre: 'Analgésicos', slug: 'analgesicos', margen_ganancia_porcentaje: 18 },
  { id: 'cat-2', nombre: 'Vitaminas', slug: 'vitaminas', margen_ganancia_porcentaje: 22 },
  { id: 'cat-3', nombre: 'Antibióticos', slug: 'antibioticos', margen_ganancia_porcentaje: 20 },
  { id: 'cat-4', nombre: 'Cuidado Personal', slug: 'cuidado-personal', margen_ganancia_porcentaje: 25 },
  { id: 'cat-5', nombre: 'Cardiovascular', slug: 'cardiovascular', margen_ganancia_porcentaje: 16 },
]

export const mockSedes: SedeCatalogo[] = [
  { id: 'sede-1', nombre: 'Farmacy Centro', direccion: 'Calle 15 # 8-12, Pereira', codigo_habilitacion: 'PEREIRA-CENTRO', telefono: '6063350000' },
  { id: 'sede-2', nombre: 'Farmacy Circunvalar', direccion: 'Av. Circunvalar # 10-44, Pereira', codigo_habilitacion: 'PEREIRA-CIRC', telefono: '6063351111' },
]

export const mockProductos: ProductoCatalogo[] = [
  {
    id: 'prod-1', slug: 'acetaminofen-500mg-20-tabs', nombre: 'Acetaminofén', marca: 'Genfar', categoriaSlug: 'analgesicos', categoriaNombre: 'Analgésicos',
    presentacion: 'Caja x 20 tabletas', concentracion: '500 mg', precioVenta: 6800, stockTotal: 28, stockMinimo: 10,
    disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Genfar', imagenUrl: '',
  },
  {
    id: 'prod-2', slug: 'ibuprofeno-400mg-10-tabs', nombre: 'Ibuprofeno', marca: 'MK', categoriaSlug: 'analgesicos', categoriaNombre: 'Analgésicos',
    presentacion: 'Caja x 10 tabletas', concentracion: '400 mg', precioVenta: 9200, stockTotal: 16, stockMinimo: 6,
    disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'MK', imagenUrl: '',
  },
  {
    id: 'prod-3', slug: 'vitamina-c-1000mg-30-tabs', nombre: 'Vitamina C', marca: 'Tecnoquímicas', categoriaSlug: 'vitaminas', categoriaNombre: 'Vitaminas',
    presentacion: 'Caja x 30 tabletas', concentracion: '1000 mg', precioVenta: 18200, stockTotal: 40, stockMinimo: 12,
    disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Tecnoquímicas', imagenUrl: '',
  },
  {
    id: 'prod-4', slug: 'amoxicilina-500mg-12-caps', nombre: 'Amoxicilina', marca: 'La Santé', categoriaSlug: 'antibioticos', categoriaNombre: 'Antibióticos',
    presentacion: 'Caja x 12 cápsulas', concentracion: '500 mg', precioVenta: 24800, stockTotal: 9, stockMinimo: 8,
    disponibleEnvio: false, disponibleTienda: true, requiereRx: true, laboratorio: 'La Santé', imagenUrl: '',
  },
  {
    id: 'prod-5', slug: 'crema-hidratante-200ml', nombre: 'Crema hidratante', marca: 'Nivea', categoriaSlug: 'cuidado-personal', categoriaNombre: 'Cuidado Personal',
    presentacion: 'Frasco x 200 mL', concentracion: '200 mL', precioVenta: 28900, stockTotal: 24, stockMinimo: 10,
    disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Nivea', imagenUrl: '',
  },
  {
    id: 'prod-6', slug: 'losartan-50mg-30-tabs', nombre: 'Losartán', marca: 'Genfar', categoriaSlug: 'cardiovascular', categoriaNombre: 'Cardiovascular',
    presentacion: 'Caja x 30 tabletas', concentracion: '50 mg', precioVenta: 34600, stockTotal: 6, stockMinimo: 8,
    disponibleEnvio: false, disponibleTienda: true, requiereRx: true, laboratorio: 'Genfar', imagenUrl: '',
  },
  {
    id: 'prod-7', slug: 'loratadina-10mg-10-tabs', nombre: 'Loratadina', marca: 'MK', categoriaSlug: 'analgesicos', categoriaNombre: 'Analgésicos',
    presentacion: 'Caja x 10 tabletas', concentracion: '10 mg', precioVenta: 7600, stockTotal: 12, stockMinimo: 5,
    disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'MK', imagenUrl: '',
  },
  {
    id: 'prod-8', slug: 'multivitaminico-60-caps', nombre: 'Multivitamínico', marca: 'Bayer', categoriaSlug: 'vitaminas', categoriaNombre: 'Vitaminas',
    presentacion: 'Frasco x 60 cápsulas', concentracion: '60 cápsulas', precioVenta: 38900, stockTotal: 18, stockMinimo: 7,
    disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Bayer', imagenUrl: '',
  },
  {
    id: 'prod-9', slug: 'enalapril-20mg-30-tabs', nombre: 'Enalapril', marca: 'La Santé', categoriaSlug: 'cardiovascular', categoriaNombre: 'Cardiovascular',
    presentacion: 'Caja x 30 tabletas', concentracion: '20 mg', precioVenta: 22200, stockTotal: 14, stockMinimo: 6,
    disponibleEnvio: true, disponibleTienda: true, requiereRx: true, laboratorio: 'La Santé', imagenUrl: '',
  },
]

export interface FiltrosCatalogo {
  q?: string
  categoria?: string
  marca?: string
  rx?: boolean
  precioMin?: number
  precioMax?: number
  envio?: boolean
  tienda?: boolean
  ordenar?: string
  pagina?: number
  limite?: number
}

export function filtrarCatalogo(filtros: FiltrosCatalogo = {}) {
  const pagina = Math.max(1, filtros.pagina ?? 1)
  const limite = Math.max(1, filtros.limite ?? 12)
  const q = normalizar(filtros.q ?? '')

  let productos = [...mockProductos]

  if (q) {
    productos = productos.filter((producto) => {
      const texto = normalizar([
        producto.nombre,
        producto.marca,
        producto.presentacion,
        producto.concentracion,
        producto.categoriaNombre,
      ].join(' '))
      return texto.includes(q)
    })
  }

  if (filtros.categoria) productos = productos.filter((producto) => producto.categoriaSlug === filtros.categoria)
  if (filtros.marca) productos = productos.filter((producto) => normalizar(producto.marca).includes(normalizar(filtros.marca ?? '')))
  if (typeof filtros.rx === 'boolean') productos = productos.filter((producto) => producto.requiereRx === filtros.rx)
  if (typeof filtros.envio === 'boolean') productos = productos.filter((producto) => producto.disponibleEnvio === filtros.envio)
  if (typeof filtros.tienda === 'boolean') productos = productos.filter((producto) => producto.disponibleTienda === filtros.tienda)
  if (typeof filtros.precioMin === 'number') productos = productos.filter((producto) => producto.precioVenta >= filtros.precioMin!)
  if (typeof filtros.precioMax === 'number') productos = productos.filter((producto) => producto.precioVenta <= filtros.precioMax!)

  if (filtros.ordenar === 'precio-asc') productos.sort((a, b) => a.precioVenta - b.precioVenta)
  if (filtros.ordenar === 'precio-desc') productos.sort((a, b) => b.precioVenta - a.precioVenta)
  if (filtros.ordenar === 'stock') productos.sort((a, b) => b.stockTotal - a.stockTotal)

  const total = productos.length
  const totalPaginas = Math.max(1, Math.ceil(total / limite))
  const inicio = (pagina - 1) * limite
  const data = productos.slice(inicio, inicio + limite)

  return {
    data,
    meta: { total, totalPaginas, pagina, limite },
  }
}
