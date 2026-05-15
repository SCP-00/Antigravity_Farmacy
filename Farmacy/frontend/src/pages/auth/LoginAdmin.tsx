import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/hooks'

export default function LoginAdmin() {
  const { login, loginLoading } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [verPass,  setVerPass]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Completa todos los campos'); return }
    login({ email, password })
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Acceso empleados</h2>
      <p className="text-sm text-gray-500 mb-7">Ingresa con tus credenciales de Farmacy</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@farmacy.co"
              autoComplete="email"
              className="input-base pl-10"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              type={verPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="input-base pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setVerPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {verPass ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loginLoading}
          className="w-full py-3 bg-teal-700 text-white rounded-xl font-semibold text-sm
                     hover:bg-teal-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {loginLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              Verificando...
            </>
          ) : 'Ingresar al sistema'}
        </button>
      </form>

      {/* Credenciales de prueba */}
      <div className="mt-6 p-4 bg-teal-50 rounded-2xl border border-teal-100">
        <p className="text-xs font-semibold text-teal-800 mb-2">🔐 Credenciales de prueba</p>
        <div className="space-y-1 text-xs text-teal-700 font-mono">
          <p>admin@farmacy.co / Admin@1234</p>
          <p>farmaceuta@farmacy.co / Farm@1234</p>
          <p>auxiliar@farmacy.co / Aux@1234</p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link to="/" className="text-sm text-gray-400 hover:text-teal-700 transition-colors">
          ← Volver a la tienda
        </Link>
      </div>
    </>
  )
}