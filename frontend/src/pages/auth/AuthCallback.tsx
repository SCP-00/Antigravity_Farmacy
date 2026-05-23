// AuthCallback.tsx — Maneja el callback de OAuth (Google)
// Recibe ?token=... en la URL, obtiene los datos del cliente y lo autentica.
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthClienteStore } from '@/store/authStore'
import { authClienteService } from '@/services'

export function AuthCallbackComponent() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setLogin = useAuthClienteStore((s) => s.setLogin)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setError('No se recibió el token de autenticación')
      return
    }

    // Guardar token temporalmente para poder llamar a /me
    const autenticar = async () => {
      try {
        // Llamar al endpoint /me usando el token (lo pasamos manualmente)
        const cliente = await authClienteService.meConToken(token)
        setLogin(token, cliente)
        navigate('/', { replace: true })
      } catch {
        setError('Error al iniciar sesión con Google. Intenta de nuevo.')
      }
    }

    autenticar()
  }, [searchParams, setLogin, navigate])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F8F6] p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Error de autenticación</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="px-6 py-2.5 bg-teal-700 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F5F8F6]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Iniciando sesión...</p>
      </div>
    </div>
  )
}

export default AuthCallbackComponent
