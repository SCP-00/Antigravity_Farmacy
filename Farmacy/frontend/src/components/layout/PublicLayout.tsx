import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, Heart, User, ChevronDown, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useAuthCliente, useDebounce } from '@/hooks'
import { useCategorias } from '@/hooks'
import { CATEGORIAS_ICONOS } from '@/config/constants'
import ChatbotWidget from '@/components/tienda/ChatbotWidget'

export default function PublicLayout() {
  const { estaLogueado, cliente, cerrarSesion } = useAuthCliente()
  const { data: categorias } = useCategorias()
  const navigate = useNavigate()

  const [busqueda, setBusqueda] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const debouncedQ = useDebounce(busqueda, 300)

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault()
    if (debouncedQ.trim()) navigate(`/productos?q=${encodeURIComponent(debouncedQ)}`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F8F6]">
      <div className="bg-teal-700 text-teal-100 text-xs py-1.5 px-4 flex justify-between items-center">
        <span>📞 (606) 335-0000 · Lun–Sáb 7AM–9PM</span>
        <div className="flex gap-4">
          <Link to="/sucursales" className="hover:text-white flex items-center gap-1">
            <MapPin size={11}/> Sedes
          </Link>
          <Link to="/nosotros" className="hover:text-white">Quiénes somos</Link>
          <Link to="/contacto" className="hover:text-white">Contacto</Link>
        </div>
      </div>

      <header className="bg-white border-b border-[#D8EBE4] sticky top-0 z-40 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-teal-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="font-serif text-xl text-teal-900 hidden sm:block">Farmacy</span>
          </Link>

          <form onSubmit={handleBuscar} className="flex-1 relative max-w-xl">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar medicamentos, vitaminas..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F5F8F6] border border-[#D8EBE4] rounded-full text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
            />
          </form>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-gray-600 hover:bg-teal-50 hover:text-teal-700 transition-all"
              >
                <User size={18}/>
                <span className="hidden md:block">{estaLogueado ? cliente?.nombre : 'Ingresar'}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-44 menu-popover py-1 z-50">
                  {estaLogueado ? (
                    <>
                      <Link to="/cuenta" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-teal-50 text-gray-700">Mi cuenta</Link>
                      <Link to="/cuenta/pedidos" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-teal-50 text-gray-700">Mis pedidos</Link>
                      <Link to="/cuenta/favoritos" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-teal-50 text-gray-700">Favoritos</Link>
                      <hr className="my-1 border-[#D8EBE4]"/>
                      <button onClick={() => { cerrarSesion(); setUserMenuOpen(false) }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Cerrar sesión</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-teal-50 text-gray-700">Iniciar sesión</Link>
                      <Link to="/registro" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-teal-50 text-teal-700 font-medium">Crear cuenta</Link>
                      <hr className="my-1 border-[#D8EBE4]"/>
                      <Link to="/admin/login" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-xs text-gray-400 hover:bg-gray-50">Acceso empleados →</Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <Link to="/cuenta/favoritos" className="p-2 rounded-full text-gray-500 hover:bg-teal-50 hover:text-teal-700">
              <Heart size={20}/>
            </Link>

            <Link to="/carrito" className="relative flex items-center gap-2 px-3 py-2 bg-teal-700 text-white rounded-full text-sm font-medium hover:bg-teal-500 transition-all">
              <ShoppingCart size={16}/>
              <span className="hidden sm:block">Carrito</span>
            </Link>
          </div>
        </div>

        <nav className="bg-teal-50 border-t border-teal-100 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-1 py-1 overflow-x-auto">
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-teal-800 font-medium hover:bg-teal-100 transition-all">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-teal-700 border border-teal-100">
                  <ChevronDown size={13} className="rotate-180"/>
                </span>
                Categorías <ChevronDown size={13}/>
              </button>

              <div className="absolute left-0 top-full pt-3 hidden group-hover:block group-focus-within:block z-50">
                <div className="menu-popover w-72 p-3">
                  <div className="mb-3 px-2 pt-1 pb-2 border-b border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-teal-700">Explorar</p>
                    <p className="text-sm text-slate-500">Accede rápido a las categorías más usadas</p>
                  </div>
                  <div className="grid grid-cols-1 gap-1 max-h-80 overflow-y-auto pr-1">
                    {(categorias ?? []).map((cat: any) => (
                      <Link key={cat.id} to={`/productos?categoria=${cat.slug}`} className="menu-item">
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-50 text-lg">
                          {CATEGORIAS_ICONOS[cat.nombre] ?? '💊'}
                        </span>
                        <span className="font-medium">{cat.nombre}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {[
              { label: 'Analgésicos', slug: 'analgesicos' },
              { label: 'Vitaminas', slug: 'vitaminas' },
              { label: 'Antibióticos', slug: 'antibioticos' },
              { label: 'Domicilios', slug: '' },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.slug ? `/productos?categoria=${item.slug}` : '/sucursales'}
                className="px-3 py-1.5 rounded-full text-sm text-teal-700 hover:bg-teal-100 transition-all whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-teal-900 text-teal-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
              <span className="font-serif text-white text-lg">Farmacy</span>
            </div>
            <p className="text-sm leading-relaxed">Tu salud, nuestra prioridad. Medicamentos de calidad al mejor precio.</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Tienda</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/productos" className="hover:text-white">Todos los productos</Link></li>
              <li><Link to="/productos?rx=false" className="hover:text-white">Venta libre</Link></li>
              <li><Link to="/sucursales" className="hover:text-white">Nuestras sedes</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Información</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/nosotros" className="hover:text-white">Quiénes somos</Link></li>
              <li><Link to="/contacto" className="hover:text-white">Contacto</Link></li>
              <li><Link to="/privacidad" className="hover:text-white">Política de privacidad</Link></li>
              <li><Link to="/terminos" className="hover:text-white">Términos y condiciones</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Horarios</h4>
            <ul className="space-y-1 text-sm">
              <li>Lun–Sáb: 7:00 AM – 9:00 PM</li>
              <li>Domingos: 8:00 AM – 6:00 PM</li>
              <li className="pt-2">📞 (606) 335-0000</li>
              <li>✉️ info@farmacy.co</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-teal-800 text-center py-4 text-xs text-teal-400">
          © {new Date().getFullYear()} Farmacy · Proyecto académico UTP · NIT 900000000-1 · Pereira, Colombia
        </div>
      </footer>

      <ChatbotWidget/>
    </div>
  )
}