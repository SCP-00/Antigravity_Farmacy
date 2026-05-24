import { useState } from 'react'
import { Lock, Shield, Key, Smartphone, History, Save, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ConfigSeguridad() {
  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' })
  const [verPass, setVerPass] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [twoFA, setTwoFA] = useState(false)

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.nueva !== passwords.confirmar) return toast.error('Las contraseñas no coinciden')
    if (passwords.nueva.length < 8) return toast.error('La contraseña debe tener al menos 8 caracteres')

    setGuardando(true)
    await new Promise(r => setTimeout(r, 1000))
    toast.success('Contraseña actualizada exitosamente')
    setPasswords({ actual: '', nueva: '', confirmar: '' })
    setGuardando(false)
  }

  const toggle2FA = () => {
    setTwoFA(!twoFA)
    toast.success(`Autenticación de dos factores ${!twoFA ? 'activada' : 'desactivada'}`)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seguridad</h1>
        <p className="text-sm text-gray-500 mt-1">Políticas de acceso, contraseñas y sesiones</p>
      </div>

      {/* Cambiar contraseña */}
      <div className="surface p-6">
        <div className="flex items-center gap-2 mb-5 text-gray-800">
          <Key size={18} className="text-teal-700" />
          <h2 className="font-semibold">Cambiar contraseña</h2>
        </div>
        <form onSubmit={handleSubmitPassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña actual</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={verPass ? 'text' : 'password'} value={passwords.actual}
                onChange={e => setPasswords(p => ({ ...p, actual: e.target.value }))}
                className="input-base pl-10" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nueva contraseña</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={verPass ? 'text' : 'password'} value={passwords.nueva}
                onChange={e => setPasswords(p => ({ ...p, nueva: e.target.value }))}
                className="input-base pl-10 pr-10" required minLength={8} />
              <button type="button" onClick={() => setVerPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar nueva contraseña</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={verPass ? 'text' : 'password'} value={passwords.confirmar}
                onChange={e => setPasswords(p => ({ ...p, confirmar: e.target.value }))}
                className={`input-base pl-10 ${passwords.confirmar && passwords.nueva !== passwords.confirmar ? 'border-red-300' : ''}`}
                required minLength={8} />
            </div>
            {passwords.confirmar && passwords.nueva !== passwords.confirmar && (
              <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
            )}
          </div>
          <button type="submit" disabled={guardando}
            className="btn-primary flex items-center gap-2 text-sm">
            <Save size={16} />
            {guardando ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>

      {/* Autenticación de dos factores */}
      <div className="surface p-6">
        <div className="flex items-center gap-2 mb-5 text-gray-800">
          <Smartphone size={18} className="text-teal-700" />
          <h2 className="font-semibold">Autenticación de dos factores (2FA)</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">Verificación adicional al iniciar sesión</p>
            <p className="text-xs text-gray-400 mt-0.5">Recibirás un código en tu correo o teléfono</p>
          </div>
          <button
            onClick={toggle2FA}
            className={`relative w-12 h-6 rounded-full transition-colors ${twoFA ? 'bg-teal-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${twoFA ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Sesiones activas */}
      <div className="surface p-6">
        <div className="flex items-center gap-2 mb-5 text-gray-800">
          <History size={18} className="text-teal-700" />
          <h2 className="font-semibold">Sesiones activas</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Sesión actual</p>
                <p className="text-xs text-gray-400">Chrome en Windows — Activa ahora</p>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">Activa</span>
          </div>
        </div>
        <button className="text-xs text-red-600 hover:text-red-700 font-medium mt-3 hover:underline">
          Cerrar todas las demás sesiones
        </button>
      </div>

      {/* Políticas de acceso */}
      <div className="surface p-6">
        <div className="flex items-center gap-2 mb-5 text-gray-800">
          <Shield size={18} className="text-teal-700" />
          <h2 className="font-semibold">Políticas de acceso</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Bloqueo por inactividad</p>
              <p className="text-xs text-gray-400">Cerrar sesión después de 30 minutos sin actividad</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-teal-700 focus:ring-teal-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Notificar nuevos inicios de sesión</p>
              <p className="text-xs text-gray-400">Recibir correo cuando se acceda desde un dispositivo nuevo</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-teal-700 focus:ring-teal-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Contraseña expira cada 90 días</p>
              <p className="text-xs text-gray-400">Forzar cambio de contraseña periódicamente</p>
            </div>
            <input type="checkbox" className="rounded border-gray-300 text-teal-700 focus:ring-teal-500" />
          </div>
        </div>
      </div>
    </div>
  )
}
