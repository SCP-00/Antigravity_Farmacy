import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Plus, Pencil, Check, X, Clock, Mail, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/config/api'

export default function ConfigSucursales() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [form, setForm] = useState({ codigo: '', nombre: '', direccion: '', ciudad: '', telefono: '', email: '', horarioApertura: '07:00', horarioCierre: '21:00' })

  // Obtenemos sucursales desde el backend (api)
  const { data: sucursales = [], isLoading } = useQuery({
    queryKey: ['admin-sucursales'],
    queryFn: () => api.get('/sucursales').then(r => r.data.data),
  })

  const guardarMutation = useMutation({
    mutationFn: (payload: any) => editando 
      ? api.patch(/sucursales/ + editando.id, payload)
      : api.post('/sucursales', payload),
    onSuccess: () => {
      toast.success(editando ? 'Sucursal actualizada' : 'Sucursal creada')
      setModalOpen(false)
      qc.invalidateQueries({ queryKey: ['admin-sucursales'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error al guardar la sucursal')
  })

  const abrirModal = (sucursal: any = null) => {
    setEditando(sucursal)
    setForm(sucursal ? {
      codigo: sucursal.codigo, nombre: sucursal.nombre, direccion: sucursal.direccion, ciudad: sucursal.ciudad,
      telefono: sucursal.telefono, email: sucursal.email, horarioApertura: sucursal.horarioApertura, horarioCierre: sucursal.horarioCierre
    } : { codigo: '', nombre: '', direccion: '', ciudad: '', telefono: '', email: '', horarioApertura: '07:00', horarioCierre: '21:00' })
    setModalOpen(true)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sucursales</h1>
          <p className="text-sm text-gray-500 mt-1">Administra los puntos físicos de venta y despachos.</p>
        </div>
        <button onClick={() => abrirModal()} className="btn-primary flex items-center gap-2">
          <Plus size={16}/> Nueva Sucursal
        </button>
      </div>

      {isLoading ? (
        <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sucursales.map((s: any) => (
            <div key={s.id} className="surface p-6 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">{s.codigo}</span>
                  <button onClick={() => abrirModal(s)} className="text-gray-400 hover:text-teal-700 transition"><Pencil size={16}/></button>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{s.nombre}</h3>
                
                <div className="space-y-2 mt-4 text-sm text-gray-600">
                  <p className="flex items-start gap-2"><MapPin size={16} className="text-teal-600 flex-shrink-0"/> {s.direccion}, {s.ciudad}</p>
                  <p className="flex items-center gap-2"><Clock size={16} className="text-teal-600"/> {s.horarioApertura} - {s.horarioCierre}</p>
                  <p className="flex items-center gap-2"><Phone size={16} className="text-teal-600"/> {s.telefono}</p>
                  <p className="flex items-center gap-2"><Mail size={16} className="text-teal-600"/> {s.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Creación/Edición */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-bold text-gray-900">{editando ? 'Editar Sucursal' : 'Nueva Sucursal'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Código (Ej. SC-003)</label><input value={form.codigo} onChange={e=>setForm({...form, codigo: e.target.value})} className="input-base"/></div>
                <div><label className="label">Nombre *</label><input value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} className="input-base"/></div>
                <div className="col-span-2"><label className="label">Dirección *</label><input value={form.direccion} onChange={e=>setForm({...form, direccion: e.target.value})} className="input-base"/></div>
                <div><label className="label">Ciudad</label><input value={form.ciudad} onChange={e=>setForm({...form, ciudad: e.target.value})} className="input-base"/></div>
                <div><label className="label">Teléfono</label><input value={form.telefono} onChange={e=>setForm({...form, telefono: e.target.value})} className="input-base"/></div>
                <div className="col-span-2"><label className="label">Email de contacto</label><input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} type="email" className="input-base"/></div>
                <div><label className="label">Apertura (HH:MM)</label><input value={form.horarioApertura} onChange={e=>setForm({...form, horarioApertura: e.target.value})} type="time" className="input-base"/></div>
                <div><label className="label">Cierre (HH:MM)</label><input value={form.horarioCierre} onChange={e=>setForm({...form, horarioCierre: e.target.value})} type="time" className="input-base"/></div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setModalOpen(false)} className="btn-ghost">Cancelar</button>
              <button onClick={() => guardarMutation.mutate(form)} disabled={guardarMutation.isPending || !form.nombre || !form.codigo} className="btn-primary">
                {guardarMutation.isPending ? 'Guardando...' : <><Check size={16}/> Guardar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
