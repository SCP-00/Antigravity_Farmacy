import { Link } from 'react-router-dom'
import { MapPin, Clock, Phone, ChevronRight, ShoppingCart, Shield, Truck, Sparkles, ArrowRight } from 'lucide-react'
import { useCarrito, useFormateo } from '@/hooks'
import { CATEGORIAS_ICONOS } from '@/config/constants'
import { mockCategorias, mockProductos, mockSedes } from '@/data/catalogo'

function Hero() {
  const destacados = mockProductos.slice(0, 4)

  return (
    <section className="section-shell py-8 md:py-12">
      <div className="hero-panel overflow-hidden rounded-[2rem] text-white shadow-2xl">
        <div className="grid lg:grid-cols-[1.25fr_0.85fr] gap-8 items-center px-6 py-10 md:px-10 md:py-14">
          <div>
            <h1 className="mt-5 max-w-2xl text-4xl md:text-6xl font-bold tracking-tight">
              Una farmacia digital con experiencia clara y compras rápidas.
            </h1>
            <p className="mt-5 max-w-xl text-base md:text-lg text-white/85 leading-7">
              Explora medicamentos, cuidado personal, vitaminas y productos de bienestar en un catálogo pensado para navegar como una tienda real.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/productos" className="btn-primary bg-white text-teal-900 hover:bg-teal-50">
                Ver catálogo
                <ArrowRight size={16} />
              </Link>
              <Link to="/carrito" className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20">
                Ir al carrito
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              <span className="feature-pill"><Truck size={14} /> Domicilios locales</span>
              <span className="feature-pill"><Shield size={14} /> Productos certificados</span>
              <span className="feature-pill"><Clock size={14} /> Atención extendida</span>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-[1.75rem] bg-white/10 p-5 backdrop-blur border border-white/20">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Destacados</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {destacados.map((producto) => (
                  <Link key={producto.id} to={`/productos/${producto.slug}`} className="rounded-2xl bg-white/10 p-3 transition hover:bg-white/20">
                    <div className="text-2xl">{CATEGORIAS_ICONOS[producto.categoriaNombre] ?? '💊'}</div>
                    <p className="mt-2 text-sm font-semibold leading-tight text-white">{producto.nombre}</p>
                    <p className="text-xs text-white/70">{producto.concentracion}</p>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

function Beneficios() {
  const items = [
    { icon: <Shield size={22}/>, titulo: 'Productos certificados', desc: 'Todos con Registro INVIMA vigente' },
    { icon: <Truck size={22}/>, titulo: 'Domicilios en Pereira', desc: 'Entrega en 30–45 minutos' },
    { icon: <Clock size={22}/>, titulo: 'Amplio horario', desc: 'Lun–Sáb 7AM–9PM · Dom 8AM–6PM' },
    { icon: <Phone size={22}/>, titulo: 'Asesoría farmacéutica', desc: 'Farmacéutas certificados en sede' },
  ]

  return (
    <div className="section-shell py-3">
      <div className="surface px-5 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {items.map((item) => (
          <div key={item.titulo} className="flex items-center gap-3">
            <div className="w-11 h-11 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-700 flex-shrink-0">
              {item.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.titulo}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SeccionCategorias() {
  return (
    <section className="section-shell py-10">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <span className="section-kicker">Categorías</span>
          <h2 className="section-title mt-2">Explorar por categoría</h2>
        </div>
        <Link to="/productos" className="text-sm text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1">
          Ver todo <ChevronRight size={14}/>
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-10 gap-3">
        {mockCategorias.map((cat: any) => (
          <Link key={cat.id} to={`/productos?categoria=${cat.slug}`} className="surface flex flex-col items-center gap-2 p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md group">
            <span className="text-2xl group-hover:scale-110 transition-transform">{CATEGORIAS_ICONOS[cat.nombre] ?? '💊'}</span>
            <span className="text-[11px] font-semibold text-slate-600 leading-tight">{cat.nombre}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function ProductosDestacados() {
  const { agregar } = useCarrito()
  const { cop } = useFormateo()
  const productos = mockProductos.slice(0, 8)

  return (
    <section className="section-shell py-10">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <span className="section-kicker">Ofertas</span>
          <h2 className="section-title mt-2">Más vendidos</h2>
        </div>
        <Link to="/productos" className="text-sm text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1">
          Ver catálogo completo <ChevronRight size={14}/>
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {productos.map((p: any) => (
          <div key={p.id} className="card group hover:-translate-y-0.5 transition-transform">
            <div className="h-28 rounded-2xl mb-3 flex items-center justify-center bg-gradient-to-br from-teal-50 to-sky-50 group-hover:from-teal-100 group-hover:to-sky-100 transition-colors">
              <span className="text-4xl">{CATEGORIAS_ICONOS[p.categoriaNombre] ?? '💊'}</span>
            </div>
            <span className="section-chip">{p.categoriaNombre}</span>
            <Link to={`/productos/${p.slug}`} className="block text-sm font-semibold text-slate-900 hover:text-teal-700 transition-colors mt-2 mb-1 line-clamp-2 min-h-[40px]">
              {p.nombre} {p.concentracion}
            </Link>
            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{p.presentacion}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="font-bold text-teal-700">{cop(p.precioVenta)}</span>
              <button
                onClick={() => agregar({
                  productoId: p.id,
                  nombre: p.nombre,
                  marca: p.marca,
                  concentracion: p.concentracion ?? '',
                  presentacion: p.presentacion ?? '',
                  precioUnitario: Number(p.precioVenta),
                  cantidad: 1,
                  stockMaximo: p.stockTotal,
                  disponibleEnvio: p.disponibleEnvio,
                  disponibleTienda: p.disponibleTienda,
                  imagenUrl: p.imagenUrl,
                  requiereRx: p.requiereRx,
                })}
                disabled={p.stockTotal === 0}
                className="w-9 h-9 bg-teal-700 text-white rounded-full flex items-center justify-center hover:bg-teal-500 disabled:opacity-40 transition-all hover:scale-110 active:scale-95"
              >
                <ShoppingCart size={13}/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function SeccionSedes() {
  return (
    <section className="section-shell py-10 pb-16">
      <div className="surface overflow-hidden bg-slate-950 text-white">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-0">
          <div className="p-8 md:p-10 bg-teal-900/95">
            <span className="section-kicker text-teal-200">Sedes</span>
            <h2 className="mt-3 text-3xl font-bold">Encuentra tu punto de atención más cercano</h2>
            <p className="mt-4 text-white/80 leading-7">
              Consulta horarios, direcciones y cobertura local. La experiencia de tienda está pensada para compras rápidas y entrega en ciudad.
            </p>
            <Link to="/sucursales" className="btn-primary mt-6 bg-white text-teal-900 hover:bg-teal-50">
              Ver sedes
            </Link>
          </div>
          <div className="grid gap-4 p-6 md:p-8">
            {mockSedes.map((sede) => (
              <div key={sede.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-lg font-semibold text-white">{sede.nombre}</h3>
                <div className="mt-3 space-y-2 text-sm text-white/75">
                  <p className="flex items-center gap-2"><MapPin size={14}/> {sede.direccion}</p>
                  <p className="flex items-center gap-2"><Clock size={14}/> Horario local</p>
                  {sede.telefono && <p className="flex items-center gap-2"><Phone size={14}/> {sede.telefono}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Inicio() {
  return (
    <>
      <Hero />
      <Beneficios />
      <SeccionCategorias />
      <ProductosDestacados />
      <SeccionSedes />
    </>
  )
}