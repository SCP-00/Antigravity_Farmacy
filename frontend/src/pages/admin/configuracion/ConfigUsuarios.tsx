import { useState } from 'react'
import { Users, UserPlus, CheckCircle, XCircle, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string
  activo: boolean
  ultimoAcceso: string
}

const MOCK_USUARIOS: Usuario[] = [
  { id: '1', nombre: 'Admin Principal', email: 'admin@farmacy.co', rol: 'ADMINISTRADOR', activo: true, ultimoAcceso: '2026-05-20T14:30:00' },
  { id: '2', nombre: 'Carlos Farmacéutico', email: 'carlos@farmacy.co', rol: 'FARMACEUTA', activo: true, ultimoAcceso: '2026-05-19T10:15:00' },
  { id: '3', nombre: 'María Auxiliar', email: 'maria@farmacy.co', rol: 'AUXILIAR', activo: true, ultimoAcceso: '2026-05-20T08:00:00' },
  { id: '4', nombre: 'Pedro Gómez', email: 'pedro@farmacy.co', rol: 'AUXILIAR', activo: false, ultimoAcceso: '2026-04-28T16:45:00' },
]

const ROL_LABELS: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  FARMACEUTA: 'Farmacéutico(a)',
  AUXILIAR: 'Auxiliar',
}

const ROL_COLORS: Record<string, string> = {
  ADMINISTRADOR: 'bg-purple-50 text-purple-700 border-purple-200',
  FARMACEUTA: 'bg-blue-50 text-blue-700 border-blue-200',
  AUXILIAR: 'bg-teal-50 text-teal-700 border-teal-200',
}

export default function ConfigUsuarios() {
  const [usuarios, setUsuarios] = useState(MOCK_USUARIOS)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  const filtrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  )

  const toggleEstado = (id: string) => {
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: !u.activo } : u))
    const user = usuarios.find(u => u.id === id)
    toast.success(`Usuario ${user?.activo ? 'desactivado' : 'activado'} exitosamente`)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de empleados y roles del panel</p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="btn-primary flex items-center gap-2 text-sm self-start">
          <UserPlus size={16} /> Nuevo usuario
        </button>
      </div>

      {/* Búsqueda */}
      <div className="surface p-3">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="input-base pl-10 text-sm" placeholder="Buscar por nombre o correo..." />
        </div>
      </div>

      {/* Tabla */}
      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-white text-slate-500 uppercase text-[11px] tracking-[0.18em]">
              <tr>
                <th className="px-5 py-3 text-left">Usuario</th>
                <th className="px-5 py-3 text-left">Correo</th>
                <th className="px-5 py-3 text-center">Rol</th>
                <th className="px-5 py-3 text-center">Estado</th>
                <th className="px-5 py-3 text-right">Último acceso</th>
                <th className="px-5 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtrados.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                        {user.nombre.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{user.nombre}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{user.email}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${ROL_COLORS[user.rol]}`}>
                      {ROL_LABELS[user.rol] ?? user.rol}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {user.activo
                      ? <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle size={12} /> Activo</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium"><XCircle size={12} /> Inactivo</span>
                    }
                  </td>
                  <td className="px-5 py-4 text-right text-xs text-gray-400">
                    {new Date(user.ultimoAcceso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => toggleEstado(user.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors
                        ${user.activo
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'}`}>
                      {user.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtrados.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 text-gray-200" />
            <p>No se encontraron usuarios con ese criterio de búsqueda.</p>
          </div>
        )}
      </div>

      {/* Modal: Nuevo usuario */}
      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setMostrarForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-5">
              <UserPlus size={18} className="text-teal-700" />
              <h3 className="font-semibold text-gray-900">Nuevo usuario</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo</label>
                <input type="text" className="input-base" placeholder="Nombre del empleado" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Correo electrónico</label>
                <input type="email" className="input-base" placeholder="correo@farmacy.co" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
                <select className="input-base">
                  <option value="AUXILIAR">Auxiliar</option>
                  <option value="FARMACEUTA">Farmacéutico(a)</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setMostrarForm(false)} className="btn-secondary flex-1 justify-center text-sm">
                  Cancelar
                </button>
                <button onClick={() => { toast.success('Usuario creado exitosamente'); setMostrarForm(false) }}
                  className="btn-primary flex-1 justify-center text-sm">
                  Crear usuario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
