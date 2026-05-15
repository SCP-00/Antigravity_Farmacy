import { Outlet, Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-[#E8F5F0] to-blue-50
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-teal-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">F</span>
            </div>
            <span className="font-serif text-2xl text-teal-900">Farmacy</span>
          </Link>
          <p className="text-sm text-gray-500 mt-1">Sistema de Gestión de Farmacias · UTP</p>
        </div>

        {/* Card de autenticación */}
        <div className="bg-white rounded-3xl shadow-lg border border-[#D8EBE4] p-8">
          <Outlet />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Farmacy · Proyecto académico
        </p>
      </div>
    </div>
  )
}