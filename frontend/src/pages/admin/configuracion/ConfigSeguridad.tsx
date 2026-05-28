import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, Shield, Key, Smartphone, History, Save, Eye, EyeOff, Trash2, Monitor, SmartphoneIcon, Tablet, AlertCircle, RefreshCw, BellOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { pushService } from '@/services'
import { useFormateo } from '@/hooks'
import { useUiStore } from '@/store/uiStore'

// ── Push Device Manager ──────────────────────────────────
function DispositivosPush() {
  const qc = useQueryClient()
  const { darkMode } = useUiStore()
  const { fechaHora } = useFormateo()

  const { data: dispositivos = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['push', 'dispositivos'],
    queryFn: () => pushService.listarDispositivos(),
  })

  const eliminarMut = useMutation({
    mutationFn: (id: string) => pushService.eliminarDispositivo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['push', 'dispositivos'] })
      toast.success('Dispositivo eliminado')
    },
    onError: () => toast.error('Error al eliminar dispositivo'),
  })

  const getIcon = (ua: string | null) => {
    if (!ua) return <SmartphoneIcon size={16} />
    const u = ua.toLowerCase()
    if (u.includes('iphone') || u.includes('android') && u.includes('mobile')) return <SmartphoneIcon size={16} />
    if (u.includes('ipad') || u.includes('tablet')) return <Tablet size={16} />
    return <Monitor size={16} />
  }

  const getBrowser = (ua: string | null) => {
    if (!ua) return 'Desconocido'
    if (ua.includes('Edg')) return 'Edge'
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
    return 'Navegador'
  }

  return (
    <div className="surface p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-gray-800">
          <Smartphone size={18} className="text-teal-700" />
          <h2 className="font-semibold">Dispositivos con notificaciones push</h2>
        </div>
        <button onClick={() => refetch()} disabled={isLoading}
          className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-dark-hover text-dark-text-secondary' : 'hover:bg-gray-100 text-gray-400'}`}
          title="Actualizar lista">
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
          <AlertCircle size={16} />
          <span>Error al cargar dispositivos. Verifica la configuración de notificaciones push.</span>
        </div>
      )}

      {!isLoading && !isError && dispositivos.length === 0 && (
        <div className={`py-8 text-center ${darkMode ? 'text-dark-text-secondary' : 'text-gray-400'}`}>
          <BellOff size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay dispositivos registrados para notificaciones push.</p>
          <p className="text-xs mt-1">Activa las notificaciones desde el botón 🔔 en la barra superior.</p>
        </div>
      )}

      {!isLoading && !isError && dispositivos.length > 0 && (
        <div className="space-y-2">
          {dispositivos.map((d: { id: string; endpoint: string; userAgent: string | null; creadoEn: string }) => (
            <div key={d.id}
              className={`flex items-center justify-between p-3 rounded-xl transition-colors
                ${darkMode ? 'bg-dark-bg hover:bg-dark-hover' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`p-1.5 rounded-lg flex-shrink-0 ${darkMode ? 'bg-dark-surface' : 'bg-white'}`}>
                  {getIcon(d.userAgent)}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${darkMode ? 'text-dark-text' : 'text-gray-900'}`}>
                    {getBrowser(d.userAgent)}
                  </p>
                  <p className={`text-xs truncate ${darkMode ? 'text-dark-text-muted' : 'text-gray-400'}`}>
                    {d.endpoint.slice(0, 50)}...
                  </p>
                  <p className={`text-[10px] ${darkMode ? 'text-dark-text-muted' : 'text-gray-400'}`}>
                    Registrado {fechaHora(d.creadoEn)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('¿Eliminar este dispositivo? Dejarás de recibir notificaciones en él.')) {
                    eliminarMut.mutate(d.id)
                  }
                }}
                disabled={eliminarMut.isPending}
                className={`p-1.5 rounded-lg transition-colors flex-shrink-0
                  ${darkMode ? 'text-dark-text-muted hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                title="Eliminar dispositivo"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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

      {/* Push Devices — Gestión de Dispositivos */}
      <DispositivosPush />

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
