import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Shield, ShieldOff, CheckCircle2, XCircle } from 'lucide-react'
import { empleadosService } from '@/services'
import toast from 'react-hot-toast'
import FormularioEmpleado from './components/FormularioEmpleado'

export default function ListaEmpleados() {
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [empleadoEdit, setEmpleadoEdit] = useState<any>(null)

  const fetchEmpleados = async () => {
    setLoading(true)
    try {
      const data = await empleadosService.listar()
      setEmpleados(data.data || data) // Depende de cómo venga el wrapper de respuesta
    } catch (error) {
      toast.error('Error al cargar empleados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmpleados()
  }, [])

  const handleToggleEstado = async (id: string, activoActual: boolean) => {
    try {
      await empleadosService.cambiarEstado(id, !activoActual)
      toast.success(activoActual ? 'Empleado desactivado' : 'Empleado activado')
      fetchEmpleados()
    } catch (error) {
      toast.error('Error al cambiar el estado')
    }
  }

  const openEdit = (emp: any) => {
    setEmpleadoEdit(emp)
    setIsFormOpen(true)
  }

  const filteredEmpleados = Array.isArray(empleados) 
    ? empleados.filter(e => 
        e.nombre.toLowerCase().includes(search.toLowerCase()) || 
        e.email.toLowerCase().includes(search.toLowerCase())
      )
    : []

  return (
    <div className="space-y-6">
      
      {/* Header y Acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Empleados</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestión de usuarios internos, roles y accesos al sistema.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar empleado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <button
            onClick={() => { setEmpleadoEdit(null); setIsFormOpen(true) }}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nuevo Empleado</span>
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-gray-700 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Sucursal</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      Cargando empleados...
                    </div>
                  </td>
                </tr>
              ) : filteredEmpleados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron empleados.
                  </td>
                </tr>
              ) : (
                filteredEmpleados.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{emp.nombre} {emp.apellido}</div>
                      <div className="text-gray-500 text-xs">{emp.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        emp.rol === 'ADMINISTRADOR' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        emp.rol === 'FARMACEUTA' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {emp.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {emp.sucursal?.nombre || 'Sin asignar'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 ${emp.activo ? 'text-green-600' : 'text-red-500'}`}>
                        {emp.activo ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        {emp.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(emp)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar empleado"
                        >
                          <Edit2 size={18} />
                        </button>
                        
                        {/* No permitir desactivar al administrador principal si es él mismo (simulado aquí) */}
                        <button
                          onClick={() => handleToggleEstado(emp.id, emp.activo)}
                          className={`p-2 rounded-lg transition-colors ${
                            emp.activo 
                              ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={emp.activo ? 'Desactivar acceso' : 'Activar acceso'}
                        >
                          {emp.activo ? <ShieldOff size={18} /> : <Shield size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <FormularioEmpleado
          empleadoActual={empleadoEdit}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false)
            fetchEmpleados()
          }}
        />
      )}
    </div>
  )
}
