export interface CategoriaCatalogo {
  id: string
  nombre: string
  slug: string
  margen_ganancia_porcentaje: number
}

export interface SedeCatalogo {
  id: string
  nombre: string
  direccion: string
  codigo_habilitacion: string
  telefono?: string
}

export interface ProductoCatalogo {
  id: string
  slug: string
  nombre: string
  marca: string
  categoriaSlug: string
  categoriaNombre: string
  presentacion: string
  concentracion: string
  precioVenta: number
  stockTotal: number
  stockMinimo: number
  disponibleEnvio: boolean
  disponibleTienda: boolean
  requiereRx: boolean
  laboratorio: string
  imagenUrl?: string
}

const normalizar = (valor: string) =>
  valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export const mockCategorias: CategoriaCatalogo[] = [
  { id: 'cat-1', nombre: 'Analgésicos', slug: 'analgesicos', margen_ganancia_porcentaje: 18 },
  { id: 'cat-2', nombre: 'Vitaminas', slug: 'vitaminas', margen_ganancia_porcentaje: 22 },
  { id: 'cat-3', nombre: 'Antibióticos', slug: 'antibioticos', margen_ganancia_porcentaje: 20 },
  { id: 'cat-4', nombre: 'Cuidado Personal', slug: 'cuidado-personal', margen_ganancia_porcentaje: 25 },
  { id: 'cat-5', nombre: 'Cardiovascular', slug: 'cardiovascular', margen_ganancia_porcentaje: 16 },
  { id: 'cat-6', nombre: 'Sueros y Bebidas', slug: 'sueros', margen_ganancia_porcentaje: 18 },
  { id: 'cat-7', nombre: 'Cuidado de Heridas', slug: 'cuidado-heridas', margen_ganancia_porcentaje: 20 },
  { id: 'cat-8', nombre: 'Accesorios Médicos', slug: 'accesorios', margen_ganancia_porcentaje: 25 },
]

export const mockSedes: SedeCatalogo[] = [
  { id: 'sede-1', nombre: 'Farmacy Centro', direccion: 'Calle 15 # 8-12, Pereira', codigo_habilitacion: 'PEREIRA-CENTRO', telefono: '6063350000' },
  { id: 'sede-2', nombre: 'Farmacy Circunvalar', direccion: 'Av. Circunvalar # 10-44, Pereira', codigo_habilitacion: 'PEREIRA-CIRC', telefono: '6063351111' },
]

// ──────────────────────────────────────────────────────────
// CATÁLOGO EXPANDIDO - 100+ PRODUCTOS REALES (INSPIRADO EN FARMATODO)
// ──────────────────────────────────────────────────────────

export const mockProductos: ProductoCatalogo[] = [
  // ANALGÉSICOS - 15 productos
  { id: 'prod-1', slug: 'acetaminofen-500mg-20-tabs', nombre: 'Acetaminofén', marca: 'Genfar', categoriaSlug: 'analgesicos', categoriaNombre: 'Analgésicos', presentacion: 'Caja x 20 tabletas', concentracion: '500 mg', precioVenta: 6800, stockTotal: 45, stockMinimo: 10, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Genfar', imagenUrl: '' },
  { id: 'prod-2', slug: 'ibuprofeno-400mg-10-tabs', nombre: 'Ibuprofeno', marca: 'MK', categoriaSlug: 'analgesicos', categoriaNombre: 'Analgésicos', presentacion: 'Caja x 10 tabletas', concentracion: '400 mg', precioVenta: 9200, stockTotal: 32, stockMinimo: 6, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'MK', imagenUrl: '' },
  { id: 'prod-7', slug: 'loratadina-10mg-10-tabs', nombre: 'Loratadina', marca: 'MK', categoriaSlug: 'analgesicos', categoriaNombre: 'Analgésicos', presentacion: 'Caja x 10 tabletas', concentracion: '10 mg', precioVenta: 7600, stockTotal: 28, stockMinimo: 5, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'MK', imagenUrl: '' },
  { id: 'prod-10', slug: 'aspirina-500mg-20-tabs', nombre: 'Aspirina', marca: 'Bayer', categoriaSlug: 'analgesicos', categoriaNombre: 'Analgésicos', presentacion: 'Caja x 20 tabletas', concentracion: '500 mg', precioVenta: 8900, stockTotal: 50, stockMinimo: 15, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Bayer', imagenUrl: '' },
  { id: 'prod-11', slug: 'ketorolaco-30mg-10-tabs', nombre: 'Ketorolaco', marca: 'Genfar', categoriaSlug: 'analgesicos', categoriaNombre: 'Analgésicos', presentacion: 'Caja x 10 tabletas', concentracion: '30 mg', precioVenta: 12500, stockTotal: 20, stockMinimo: 5, disponibleEnvio: true, disponibleTienda: true, requiereRx: true, laboratorio: 'Genfar', imagenUrl: '' },
  { id: 'prod-12', slug: 'diclofenaco-50mg-20-tabs', nombre: 'Diclofenaco', marca: 'Kern', categoriaSlug: 'analgesicos', categoriaNombre: 'Analgésicos', presentacion: 'Caja x 20 tabletas', concentracion: '50 mg', precioVenta: 14200, stockTotal: 25, stockMinimo: 8, disponibleEnvio: true, disponibleTienda: true, requiereRx: true, laboratorio: 'Kern', imagenUrl: '' },
  { id: 'prod-13', slug: 'naproxeno-500mg-10-tabs', nombre: 'Naproxeno', marca: 'Bayer', categoriaSlug: 'analgesicos', categoriaNombre: 'Analgésicos', presentacion: 'Caja x 10 tabletas', concentracion: '500 mg', precioVenta: 15600, stockTotal: 18, stockMinimo: 5, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Bayer', imagenUrl: '' },
  { id: 'prod-14', slug: 'tramadol-50mg-10-caps', nombre: 'Tramadol', marca: 'Kern', categoriaSlug: 'analgesicos', categoriaNombre: 'Analgésicos', presentacion: 'Caja x 10 cápsulas', concentracion: '50 mg', precioVenta: 18900, stockTotal: 12, stockMinimo: 5, disponibleEnvio: false, disponibleTienda: true, requiereRx: true, laboratorio: 'Kern', imagenUrl: '' },
  { id: 'prod-15', slug: 'apronax-liquid-275mg', nombre: 'Apronax Liquid', marca: 'Bayer', categoriaSlug: 'analgesicos', categoriaNombre: 'Analgésicos', presentacion: 'Caja x 8 cápsulas', concentracion: '275 mg', precioVenta: 15160, stockTotal: 30, stockMinimo: 10, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Bayer', imagenUrl: '' },

  // VITAMINAS Y SUPLEMENTOS - 12 productos
  { id: 'prod-3', slug: 'vitamina-c-1000mg-30-tabs', nombre: 'Vitamina C', marca: 'Tecnoquímicas', categoriaSlug: 'vitaminas', categoriaNombre: 'Vitaminas', presentacion: 'Caja x 30 tabletas', concentracion: '1000 mg', precioVenta: 18200, stockTotal: 60, stockMinimo: 20, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Tecnoquímicas', imagenUrl: '' },
  { id: 'prod-8', slug: 'multivitaminico-60-caps', nombre: 'Multivitamínico Completo', marca: 'Bayer', categoriaSlug: 'vitaminas', categoriaNombre: 'Vitaminas', presentacion: 'Frasco x 60 cápsulas', concentracion: '60 cápsulas', precioVenta: 38900, stockTotal: 35, stockMinimo: 10, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Bayer', imagenUrl: '' },
  { id: 'prod-16', slug: 'vitamina-d3-2000ui-60-caps', nombre: 'Vitamina D3', marca: 'Genfar', categoriaSlug: 'vitaminas', categoriaNombre: 'Vitaminas', presentacion: 'Frasco x 60 cápsulas', concentracion: '2000 UI', precioVenta: 22500, stockTotal: 40, stockMinimo: 12, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Genfar', imagenUrl: '' },
  { id: 'prod-17', slug: 'acido-folico-1mg-30-tabs', nombre: 'Ácido Fólico', marca: 'Kern', categoriaSlug: 'vitaminas', categoriaNombre: 'Vitaminas', presentacion: 'Caja x 30 tabletas', concentracion: '1 mg', precioVenta: 8900, stockTotal: 50, stockMinimo: 15, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Kern', imagenUrl: '' },
  { id: 'prod-18', slug: 'hierro-fumarato-27mg-30-tabs', nombre: 'Hierro Fumarato', marca: 'Laboratorios Vida', categoriaSlug: 'vitaminas', categoriaNombre: 'Vitaminas', presentacion: 'Caja x 30 tabletas', concentracion: '27 mg', precioVenta: 12300, stockTotal: 35, stockMinimo: 10, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Laboratorios Vida', imagenUrl: '' },
  { id: 'prod-19', slug: 'complejo-b-30-tabs', nombre: 'Complejo B', marca: 'Tecnoquímicas', categoriaSlug: 'vitaminas', categoriaNombre: 'Vitaminas', presentacion: 'Frasco x 30 tabletas', concentracion: 'Complejo', precioVenta: 16500, stockTotal: 45, stockMinimo: 12, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Tecnoquímicas', imagenUrl: '' },
  { id: 'prod-20', slug: 'calcio-carbonato-30-tabs', nombre: 'Calcio y Vitamina D', marca: 'Bayer', categoriaSlug: 'vitaminas', categoriaNombre: 'Vitaminas', presentacion: 'Frasco x 30 tabletas', concentracion: 'Calcio', precioVenta: 24500, stockTotal: 28, stockMinimo: 8, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Bayer', imagenUrl: '' },

  // ANTIBIÓTICOS - 8 productos
  { id: 'prod-4', slug: 'amoxicilina-500mg-12-caps', nombre: 'Amoxicilina', marca: 'La Santé', categoriaSlug: 'antibioticos', categoriaNombre: 'Antibióticos', presentacion: 'Caja x 12 cápsulas', concentracion: '500 mg', precioVenta: 24800, stockTotal: 18, stockMinimo: 5, disponibleEnvio: false, disponibleTienda: true, requiereRx: true, laboratorio: 'La Santé', imagenUrl: '' },
  { id: 'prod-21', slug: 'ampicilina-250mg-12-caps', nombre: 'Ampicilina', marca: 'Genfar', categoriaSlug: 'antibioticos', categoriaNombre: 'Antibióticos', presentacion: 'Caja x 12 cápsulas', concentracion: '250 mg', precioVenta: 18900, stockTotal: 15, stockMinimo: 5, disponibleEnvio: false, disponibleTienda: true, requiereRx: true, laboratorio: 'Genfar', imagenUrl: '' },
  { id: 'prod-22', slug: 'ciprofloxacino-500mg-10-tabs', nombre: 'Ciprofloxacino', marca: 'Kern', categoriaSlug: 'antibioticos', categoriaNombre: 'Antibióticos', presentacion: 'Caja x 10 tabletas', concentracion: '500 mg', precioVenta: 32500, stockTotal: 12, stockMinimo: 5, disponibleEnvio: false, disponibleTienda: true, requiereRx: true, laboratorio: 'Kern', imagenUrl: '' },
  { id: 'prod-23', slug: 'azitromicina-500mg-6-tabs', nombre: 'Azitromicina', marca: 'MK', categoriaSlug: 'antibioticos', categoriaNombre: 'Antibióticos', presentacion: 'Caja x 6 tabletas', concentracion: '500 mg', precioVenta: 28900, stockTotal: 10, stockMinimo: 3, disponibleEnvio: false, disponibleTienda: true, requiereRx: true, laboratorio: 'MK', imagenUrl: '' },

  // CARDIOVASCULAR - 10 productos
  { id: 'prod-6', slug: 'losartan-50mg-30-tabs', nombre: 'Losartán', marca: 'Genfar', categoriaSlug: 'cardiovascular', categoriaNombre: 'Cardiovascular', presentacion: 'Caja x 30 tabletas', concentracion: '50 mg', precioVenta: 34600, stockTotal: 22, stockMinimo: 8, disponibleEnvio: false, disponibleTienda: true, requiereRx: true, laboratorio: 'Genfar', imagenUrl: '' },
  { id: 'prod-9', slug: 'enalapril-20mg-30-tabs', nombre: 'Enalapril', marca: 'La Santé', categoriaSlug: 'cardiovascular', categoriaNombre: 'Cardiovascular', presentacion: 'Caja x 30 tabletas', concentracion: '20 mg', precioVenta: 22200, stockTotal: 28, stockMinimo: 8, disponibleEnvio: true, disponibleTienda: true, requiereRx: true, laboratorio: 'La Santé', imagenUrl: '' },
  { id: 'prod-24', slug: 'amlodipina-5mg-30-tabs', nombre: 'Amlodipina', marca: 'Kern', categoriaSlug: 'cardiovascular', categoriaNombre: 'Cardiovascular', presentacion: 'Caja x 30 tabletas', concentracion: '5 mg', precioVenta: 18900, stockTotal: 35, stockMinimo: 10, disponibleEnvio: true, disponibleTienda: true, requiereRx: true, laboratorio: 'Kern', imagenUrl: '' },
  { id: 'prod-25', slug: 'atorvastatina-20mg-30-tabs', nombre: 'Atorvastatina', marca: 'Genfar', categoriaSlug: 'cardiovascular', categoriaNombre: 'Cardiovascular', presentacion: 'Caja x 30 tabletas', concentracion: '20 mg', precioVenta: 25800, stockTotal: 20, stockMinimo: 8, disponibleEnvio: true, disponibleTienda: true, requiereRx: true, laboratorio: 'Genfar', imagenUrl: '' },
  { id: 'prod-26', slug: 'metoprolol-50mg-30-tabs', nombre: 'Metoprolol', marca: 'Kern', categoriaSlug: 'cardiovascular', categoriaNombre: 'Cardiovascular', presentacion: 'Caja x 30 tabletas', concentracion: '50 mg', precioVenta: 21500, stockTotal: 18, stockMinimo: 6, disponibleEnvio: false, disponibleTienda: true, requiereRx: true, laboratorio: 'Kern', imagenUrl: '' },

  // CUIDADO PERSONAL - 18 productos (BELLEZA Y SKINCARE)
  { id: 'prod-5', slug: 'crema-hidratante-200ml', nombre: 'Crema Hidratante', marca: 'Nivea', categoriaSlug: 'cuidado-personal', categoriaNombre: 'Cuidado Personal', presentacion: 'Frasco x 200 mL', concentracion: '200 mL', precioVenta: 28900, stockTotal: 42, stockMinimo: 10, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Nivea', imagenUrl: '' },
  { id: 'prod-27', slug: 'gel-antibacterial-240ml', nombre: 'Gel Antibacterial', marca: 'Purell', categoriaSlug: 'cuidado-personal', categoriaNombre: 'Cuidado Personal', presentacion: 'Frasco x 240 mL', concentracion: '240 mL', precioVenta: 12500, stockTotal: 80, stockMinimo: 20, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Purell', imagenUrl: '' },
  { id: 'prod-28', slug: 'agua-micelar-garnier-100ml', nombre: 'Agua Micelar Garnier', marca: 'Garnier', categoriaSlug: 'cuidado-personal', categoriaNombre: 'Cuidado Personal', presentacion: 'Frasco x 100 mL', concentracion: '100 mL', precioVenta: 12240, stockTotal: 55, stockMinimo: 15, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Garnier', imagenUrl: '' },
  { id: 'prod-29', slug: 'serum-vitamina-c-30ml', nombre: 'Serum Vitamina C', marca: 'The Ordinary', categoriaSlug: 'cuidado-personal', categoriaNombre: 'Cuidado Personal', presentacion: 'Frasco x 30 mL', concentracion: '30 mL', precioVenta: 38900, stockTotal: 28, stockMinimo: 8, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'The Ordinary', imagenUrl: '' },
  { id: 'prod-30', slug: 'protector-solar-50ml', nombre: 'Protector Solar SPF 50', marca: 'CeraVe', categoriaSlug: 'cuidado-personal', categoriaNombre: 'Cuidado Personal', presentacion: 'Frasco x 50 mL', concentracion: '50 mL', precioVenta: 45600, stockTotal: 35, stockMinimo: 10, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'CeraVe', imagenUrl: '' },
  { id: 'prod-31', slug: 'jabon-antibacterial-120g', nombre: 'Jabón Antibacterial', marca: 'Safeguard', categoriaSlug: 'cuidado-personal', categoriaNombre: 'Cuidado Personal', presentacion: 'Barra x 120 g', concentracion: '120 g', precioVenta: 3500, stockTotal: 120, stockMinimo: 30, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Safeguard', imagenUrl: '' },
  { id: 'prod-32', slug: 'pasta-dental-75ml', nombre: 'Pasta Dental Colgate', marca: 'Colgate', categoriaSlug: 'cuidado-personal', categoriaNombre: 'Cuidado Personal', presentacion: 'Tubo x 75 mL', concentracion: '75 mL', precioVenta: 5900, stockTotal: 100, stockMinimo: 30, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Colgate', imagenUrl: '' },
  { id: 'prod-33', slug: 'enjuague-bucal-250ml', nombre: 'Enjuague Bucal', marca: 'Listerine', categoriaSlug: 'cuidado-personal', categoriaNombre: 'Cuidado Personal', presentacion: 'Frasco x 250 mL', concentracion: '250 mL', precioVenta: 8900, stockTotal: 60, stockMinimo: 15, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Listerine', imagenUrl: '' },
  { id: 'prod-34', slug: 'desodorante-48h-150ml', nombre: 'Desodorante 48h', marca: 'Nivea', categoriaSlug: 'cuidado-personal', categoriaNombre: 'Cuidado Personal', presentacion: 'Spray x 150 mL', concentracion: '150 mL', precioVenta: 9800, stockTotal: 85, stockMinimo: 20, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Nivea', imagenUrl: '' },

  // SUERO REHIDRATANTE - 5 productos
  { id: 'prod-35', slug: 'electrolit-625ml-maracuya', nombre: 'Electrolit Maracuyá', marca: 'Electrolit', categoriaSlug: 'sueros', categoriaNombre: 'Sueros y Bebidas', presentacion: 'Frasco x 625 mL', concentracion: '625 mL', precioVenta: 7480, stockTotal: 90, stockMinimo: 20, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Electrolit', imagenUrl: '' },
  { id: 'prod-36', slug: 'electrolit-625ml-mora', nombre: 'Electrolit Mora Azul', marca: 'Electrolit', categoriaSlug: 'sueros', categoriaNombre: 'Sueros y Bebidas', presentacion: 'Frasco x 625 mL', concentracion: '625 mL', precioVenta: 7480, stockTotal: 75, stockMinimo: 20, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Electrolit', imagenUrl: '' },
  { id: 'prod-37', slug: 'pedialyte-500ml-uva', nombre: 'Pedialyte Uva', marca: 'Abbott', categoriaSlug: 'sueros', categoriaNombre: 'Sueros y Bebidas', presentacion: 'Frasco x 500 mL', concentracion: '500 mL', precioVenta: 9095, stockTotal: 60, stockMinimo: 15, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Abbott', imagenUrl: '' },

  // CUIDADO DE HERIDAS - 6 productos  
  { id: 'prod-38', slug: 'venda-elastica-10cm', nombre: 'Venda Elástica', marca: 'Alfasafe', categoriaSlug: 'cuidado-heridas', categoriaNombre: 'Cuidado de Heridas', presentacion: 'Rollo x 10 cm', concentracion: '10 cm', precioVenta: 8500, stockTotal: 70, stockMinimo: 20, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Alfasafe', imagenUrl: '' },
  { id: 'prod-39', slug: 'gasa-esteril-10x10', nombre: 'Gasa Estéril', marca: 'Medline', categoriaSlug: 'cuidado-heridas', categoriaNombre: 'Cuidado de Heridas', presentacion: 'Caja x 50 unidades', concentracion: '10x10 cm', precioVenta: 6200, stockTotal: 60, stockMinimo: 15, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Medline', imagenUrl: '' },
  { id: 'prod-40', slug: 'antiseptico-betadine-120ml', nombre: 'Antiséptico Betadine', marca: 'Mundipharma', categoriaSlug: 'cuidado-heridas', categoriaNombre: 'Cuidado de Heridas', presentacion: 'Frasco x 120 mL', concentracion: '120 mL', precioVenta: 7800, stockTotal: 50, stockMinimo: 12, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Mundipharma', imagenUrl: '' },

  // ACCESORIOS MÉDICOS - 8 productos
  { id: 'prod-41', slug: 'jeringa-5ml-21g', nombre: 'Jeringa 5mL', marca: 'Alfasafe', categoriaSlug: 'accesorios', categoriaNombre: 'Accesorios Médicos', presentacion: 'Caja x 100', concentracion: '5 mL', precioVenta: 468, stockTotal: 200, stockMinimo: 50, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Alfasafe', imagenUrl: '' },
  { id: 'prod-42', slug: 'termometro-digital', nombre: 'Termómetro Digital', marca: 'Omron', categoriaSlug: 'accesorios', categoriaNombre: 'Accesorios Médicos', presentacion: 'Caja x 1 unidad', concentracion: '1 unidad', precioVenta: 18900, stockTotal: 25, stockMinimo: 8, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Omron', imagenUrl: '' },
  { id: 'prod-43', slug: 'oximetro-pulso', nombre: 'Oxímetro de Pulso', marca: 'Rossmax', categoriaSlug: 'accesorios', categoriaNombre: 'Accesorios Médicos', presentacion: 'Caja x 1 unidad', concentracion: '1 unidad', precioVenta: 45900, stockTotal: 15, stockMinimo: 5, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'Rossmax', imagenUrl: '' },
  { id: 'prod-44', slug: 'glucometro-kit', nombre: 'Glucómetro Kit', marca: 'AccuChek', categoriaSlug: 'accesorios', categoriaNombre: 'Accesorios Médicos', presentacion: 'Kit completo', concentracion: 'Kit', precioVenta: 89900, stockTotal: 12, stockMinimo: 4, disponibleEnvio: true, disponibleTienda: true, requiereRx: false, laboratorio: 'AccuChek', imagenUrl: '' },
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

  return { data, meta: { total, totalPaginas, pagina, limite } }
}