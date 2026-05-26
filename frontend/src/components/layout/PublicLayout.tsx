import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, Heart, User, ChevronDown, MapPin, Menu, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuthCliente, useDebounce, useCategorias } from '@/hooks'
import { CATEGORIAS_ICONOS } from '@/config/constants'
import { useUiStore } from '@/store/uiStore'
import ThemeToggle from '@/components/shared/ThemeToggle'
import ChatbotWidget from '@/components/tienda/ChatbotWidget'

export default function PublicLayout() {
  const { estaLogueado, cliente, cerrarSesion } = useAuthCliente()
  const { data: categorias } = useCategorias()
  const navigate = useNavigate()

  const [busqueda, setBusqueda] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [catMenuOpen, setCatMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const catMenuRef = useRef<HTMLDivElement>(null)
  const debouncedQ = useDebounce(busqueda, 300)

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false)
      if (catMenuRef.current && !catMenuRef.current.contains(e.target as Node))
        setCatMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault()
    if (debouncedQ.trim()) navigate(`/productos?q=${encodeURIComponent(debouncedQ)}`)
  }

  const darkMode = useUiStore((s) => s.darkMode)

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300
      ${darkMode ? 'bg-dark-bg text-dark-text' : 'bg-[#F5F8F6] text-slate-900'}`}>
      {/* ── Topbar ─────────────────────────────────────── */}
      <div className={`text-xs py-1.5 px-4 flex justify-between items-center transition-colors duration-300
        ${darkMode ? 'bg-dark-surface text-dark-text-secondary border-b border-dark-border' : 'bg-teal-700 text-teal-100'}`}>
        <span>📞 (606) 335-0000 · Lun–Sáb 7AM–9PM</span>
        <div className="flex gap-4 items-center">
          <Link to="/sucursales" className="hover:text-white flex items-center gap-1 transition-colors">
            <MapPin size={11}/> Sedes
          </Link>
          <Link to="/quienes-somos" className="hover:text-white hidden sm:block transition-colors">Quiénes somos</Link>
          <Link to="/contacto" className="hover:text-white hidden sm:block transition-colors">Contacto</Link>
          <ThemeToggle compact />
        </div>
      </div>

      {/* ── Header principal ───────────────────────────── */}
      <header className={`border-b sticky top-0 z-40 transition-colors duration-300
        ${darkMode ? 'bg-dark-surface border-dark-border shadow-none' : 'bg-white border-[#D8EBE4] shadow-soft'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105
              ${darkMode ? 'bg-teal-600' : 'bg-teal-700'}`}>
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className={`font-serif text-xl hidden sm:block transition-colors duration-300
              ${darkMode ? 'text-dark-text' : 'text-teal-900'}`}>
              Farmacy
            </span>
          </Link>

          {/* Buscador */}
          <form onSubmit={handleBuscar} className="flex-1 relative max-w-xl">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar medicamentos, vitaminas..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-full text-sm outline-none transition-all duration-200
                ${darkMode
                  ? 'bg-dark-bg border border-dark-border text-dark-text placeholder-dark-text-muted focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                  : 'bg-[#F5F8F6] border border-[#D8EBE4] focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20'
                }`}
            />
          </form>

          {/* Acciones derecha */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((open) => !open)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all duration-200
                  ${darkMode
                    ? 'text-dark-text-secondary hover:bg-dark-hover'
                    : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700'
                  }`}
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
              >
                <User size={18}/>
                <span className="hidden md:block">{estaLogueado ? cliente?.nombre : 'Ingresar'}</span>
              </button>
              {userMenuOpen && (
                <div className={`absolute right-0 mt-1 w-44 py-1 z-50 animate-menu-slide
                  ${darkMode ? 'bg-dark-surface border border-dark-border' : 'bg-white border border-slate-200'}
                  rounded-3xl shadow-lg backdrop-blur-xl`}>
                  {estaLogueado ? (
                    <>
                      <Link to="/cuenta" onClick={() => setUserMenuOpen(false)} className="menu-item">Mi cuenta</Link>
                      <Link to="/cuenta/pedidos" onClick={() => setUserMenuOpen(false)} className="menu-item">Mis pedidos</Link>
                      <Link to="/cuenta/favoritos" onClick={() => setUserMenuOpen(false)} className="menu-item">Favoritos</Link>
                      <hr className={`my-1 ${darkMode ? 'border-dark-border' : 'border-[#D8EBE4]'}`}/>
                      <button onClick={() => { cerrarSesion(); setUserMenuOpen(false) }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl mx-1">
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setUserMenuOpen(false)} className="menu-item">Iniciar sesión</Link>
                      <Link to="/registro" onClick={() => setUserMenuOpen(false)} className="menu-item text-teal-700 dark:text-teal-400 font-medium">Crear cuenta</Link>
                      <hr className={`my-1 ${darkMode ? 'border-dark-border' : 'border-[#D8EBE4]'}`}/>
                      <Link to="/admin/login" onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-xs text-gray-400 dark:text-dark-text-muted hover:bg-gray-50 dark:hover:bg-dark-hover rounded-2xl mx-1">
                        Acceso empleados →
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Favoritos */}
            <Link to="/cuenta/favoritos" className={`p-3 rounded-full transition-all duration-200
              ${darkMode ? 'text-dark-text-secondary hover:bg-dark-hover' : 'text-gray-500 hover:bg-teal-50 hover:text-teal-700'}`}>
              <Heart size={20}/>
            </Link>

            {/* Carrito */}
            <Link to="/carrito" className={`relative flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95
              ${darkMode ? 'bg-teal-600 text-white hover:bg-teal-500' : 'bg-teal-700 text-white hover:bg-teal-600'}`}>
              <ShoppingCart size={16}/>
              <span className="hidden sm:block">Carrito</span>
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors
                ${darkMode ? 'text-dark-text-secondary hover:bg-dark-hover' : 'text-gray-600 hover:bg-gray-100'}`}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X size={22}/> : <Menu size={22}/>}
            </button>
          </div>
        </div>

        {/* ── Navbar categorías ────────────────────────── */}
        <nav className={`border-t transition-colors duration-300 px-4
          ${darkMode ? 'bg-dark-surface border-dark-border' : 'bg-teal-50 border-teal-100'}`}>
          <div className="max-w-7xl mx-auto flex items-center gap-1 py-1 overflow-x-auto scrollbar-none">
            {/* Menú Categorías desplegable */}
            <div className="relative" ref={catMenuRef}>
              <button
                onClick={() => setCatMenuOpen(!catMenuOpen)}
                onMouseEnter={() => setCatMenuOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                  ${catMenuOpen
                    ? (darkMode ? 'bg-dark-hover text-teal-400' : 'bg-teal-100 text-teal-800')
                    : (darkMode ? 'text-dark-text-secondary hover:bg-dark-hover' : 'text-teal-800 hover:bg-teal-100')
                  }`}
                aria-haspopup="true"
                aria-expanded={catMenuOpen}
              >
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full transition-colors
                  ${darkMode ? 'bg-dark-hover text-teal-400' : 'bg-white text-teal-700 border border-teal-100'}`}>
                  <ChevronDown size={13} className={`transition-transform duration-200 ${catMenuOpen ? 'rotate-180' : ''}`}/>
                </span>
                Categorías <ChevronDown size={13} className={`transition-transform duration-200 ${catMenuOpen ? 'rotate-180' : ''}`}/>
              </button>

              {/* Dropdown */}
              {catMenuOpen && (
                <div
                  onMouseLeave={() => setCatMenuOpen(false)}
                  className={`absolute left-0 top-full mt-1 z-50 animate-menu-slide
                    ${darkMode ? 'bg-dark-surface border border-dark-border' : 'bg-white border border-slate-200'}
                    w-72 p-3 rounded-3xl shadow-lg backdrop-blur-xl`}>
                  <div className={`mb-3 px-2 pt-1 pb-2 border-b ${darkMode ? 'border-dark-border' : 'border-slate-100'}`}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-teal-700 dark:text-teal-400">Explorar</p>
                    <p className={`text-sm ${darkMode ? 'text-dark-text-secondary' : 'text-slate-500'}`}>Accede rápido a las categorías</p>
                  </div>
                  <div className="grid grid-cols-1 gap-1 max-h-80 overflow-y-auto pr-1">
                    {(categorias ?? []).map((cat: any) => (
                      <Link key={cat.id} to={`/productos?categoria=${cat.slug}`}
                        onClick={() => setCatMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-2xl p-2 text-sm transition-all duration-150 hover:translate-x-0.5
                          ${darkMode
                            ? 'text-dark-text-secondary hover:bg-dark-hover hover:text-dark-text'
                            : 'text-slate-700 hover:bg-teal-50 hover:text-teal-800'}`}>
                        <span className={`flex h-9 w-9 items-center justify-center rounded-2xl text-lg
                          ${darkMode ? 'bg-dark-hover' : 'bg-teal-50'}`}>
                          {CATEGORIAS_ICONOS[cat.nombre] ?? '💊'}
                        </span>
                        <span className="font-medium">{cat.nombre}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Links rápidos */}
            {[
              { label: 'Analgésicos', slug: 'analgesicos' },
              { label: 'Vitaminas', slug: 'vitaminas' },
              { label: 'Antibióticos', slug: 'antibioticos' },
              { label: 'Domicilios', slug: '' },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.slug ? `/productos?categoria=${item.slug}` : '/sucursales'}
                className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 whitespace-nowrap
                  ${darkMode
                    ? 'text-dark-text-secondary hover:bg-dark-hover hover:text-dark-text'
                    : 'text-teal-700 hover:bg-teal-100'
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* ── Mobile menu overlay ────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className={`absolute right-0 top-0 h-full w-72 shadow-xl animate-slide-in
            ${darkMode ? 'bg-dark-surface border-l border-dark-border' : 'bg-white border-l border-gray-200'}`}>
            <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-dark-border' : 'border-gray-100'}`}>
              <span className={`font-semibold ${darkMode ? 'text-dark-text' : 'text-gray-900'}`}>Menú</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-hover">
                <X size={20} className={darkMode ? 'text-dark-text' : 'text-gray-600'}/>
              </button>
            </div>
            <nav className="p-4 space-y-1">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-2xl text-sm font-medium transition-colors
                  ${darkMode ? 'text-dark-text hover:bg-dark-hover' : 'text-gray-700 hover:bg-teal-50'}`}>
                🏠 Inicio
              </Link>
              <Link to="/productos" onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-2xl text-sm font-medium transition-colors
                  ${darkMode ? 'text-dark-text hover:bg-dark-hover' : 'text-gray-700 hover:bg-teal-50'}`}>
                💊 Catálogo
              </Link>
              <Link to="/sucursales" onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-2xl text-sm font-medium transition-colors
                  ${darkMode ? 'text-dark-text hover:bg-dark-hover' : 'text-gray-700 hover:bg-teal-50'}`}>
                📍 Sucursales
              </Link>
              <Link to="/quienes-somos" onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-2xl text-sm font-medium transition-colors
                  ${darkMode ? 'text-dark-text hover:bg-dark-hover' : 'text-gray-700 hover:bg-teal-50'}`}>
                👥 Quiénes somos
              </Link>
              <Link to="/contacto" onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-2xl text-sm font-medium transition-colors
                  ${darkMode ? 'text-dark-text hover:bg-dark-hover' : 'text-gray-700 hover:bg-teal-50'}`}>
                📞 Contacto
              </Link>
              <hr className={`my-2 ${darkMode ? 'border-dark-border' : 'border-gray-100'}`}/>
              {estaLogueado ? (
                <>
                  <Link to="/cuenta" onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-2xl text-sm font-medium transition-colors
                      ${darkMode ? 'text-dark-text hover:bg-dark-hover' : 'text-gray-700 hover:bg-teal-50'}`}>
                    👤 Mi cuenta
                  </Link>
                  <button onClick={() => { cerrarSesion(); setMobileMenuOpen(false) }}
                    className={`block w-full text-left px-4 py-3 rounded-2xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors`}>
                    🔒 Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-2xl text-sm font-medium transition-colors
                      ${darkMode ? 'text-dark-text hover:bg-dark-hover' : 'text-gray-700 hover:bg-teal-50'}`}>
                    🔑 Iniciar sesión
                  </Link>
                  <Link to="/registro" onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-2xl text-sm font-medium text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 text-center">
                    ✨ Crear cuenta gratis
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* ── Main content ───────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className={`transition-colors duration-300 mt-16
        ${darkMode ? 'bg-dark-surface text-dark-text-secondary border-t border-dark-border' : 'bg-teal-900 text-teal-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                ${darkMode ? 'bg-teal-600' : 'bg-teal-500'}`}>
                <span className="text-white font-bold">F</span>
              </div>
              <span className={`font-serif text-lg ${darkMode ? 'text-dark-text' : 'text-white'}`}>Farmacy</span>
            </div>
            <p className="text-sm leading-relaxed">Tu salud, nuestra prioridad. Medicamentos de calidad al mejor precio.</p>
          </div>
          <div>
            <h4 className={`font-medium mb-3 ${darkMode ? 'text-dark-text' : 'text-white'}`}>Tienda</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/productos" className="hover:text-white dark:hover:text-dark-text transition-colors">Todos los productos</Link></li>
              <li><Link to="/productos?rx=false" className="hover:text-white dark:hover:text-dark-text transition-colors">Venta libre</Link></li>
              <li><Link to="/sucursales" className="hover:text-white dark:hover:text-dark-text transition-colors">Nuestras sedes</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={`font-medium mb-3 ${darkMode ? 'text-dark-text' : 'text-white'}`}>Información</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/quienes-somos" className="hover:text-white dark:hover:text-dark-text transition-colors">Quiénes somos</Link></li>
              <li><Link to="/contacto" className="hover:text-white dark:hover:text-dark-text transition-colors">Contacto</Link></li>
              <li><Link to="/privacidad" className="hover:text-white dark:hover:text-dark-text transition-colors">Política de privacidad</Link></li>
              <li><Link to="/terminos" className="hover:text-white dark:hover:text-dark-text transition-colors">Términos y condiciones</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={`font-medium mb-3 ${darkMode ? 'text-dark-text' : 'text-white'}`}>Horarios</h4>
            <ul className="space-y-1 text-sm">
              <li>Lun–Sáb: 7:00 AM – 9:00 PM</li>
              <li>Domingos: 8:00 AM – 6:00 PM</li>
              <li className="pt-2">📞 (606) 335-0000</li>
              <li>✉️ info@farmacy.co</li>
            </ul>
          </div>
        </div>
        <div className={`border-t text-center py-4 text-xs
          ${darkMode ? 'border-dark-border text-dark-text-muted' : 'border-teal-800 text-teal-400'}`}>
          © {new Date().getFullYear()} Farmacy · Proyecto académico UTP · NIT 900000000-1 · Pereira, Colombia
        </div>
      </footer>

      {/* Chatbot */}
      <ChatbotWidget/>
    </div>
  )
}
