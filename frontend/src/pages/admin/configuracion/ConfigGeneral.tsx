import { useState } from 'react'
import { Save, Building2, Percent, Phone, MapPin, Clock, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ConfigGeneral() {
  const [form, setForm] = useState({
    nombre: 'Antigravity Farmacy',
    nit: '901.xxx.xxx-x',
    direccion: 'Carrera 7 # 72-41, Bogotá D.C.',
    telefono: '+57 (601) 123 4567',
    email: 'contacto@antigravityfarmacy.co',
    website: 'www.antigravityfarmacy.co',
    iva: 19,
    margen: 25,
    horaApertura: '08:00',
    horaCierre: '20:00',
    moneda: 'COP',
  })

  const [guardando, setGuardando] = useState(false)

  const handleChange = (campo: string, valor: any) => setForm(f => ({ ...f, [campo]: valor }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    // Simular guardado
    await new Promise(r => setTimeout(r, 800))
    toast.success('Configuración general guardada exitosamente')
    setGuardando(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración general</h1>
        <p className="text-sm text-gray-500 mt-1">Parámetros básicos de la farmacia</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información de la empresa */}
        <div className="surface p-6">
          <div className="flex items-center gap-2 mb-5 text-gray-800">
            <Building2 size={18} className="text-teal-700" />
            <h2 className="font-semibold">Información de la empresa</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de la farmacia</label>
              <input type="text" value={form.nombre} onChange={e => handleChange('nombre', e.target.value)}
                className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">NIT</label>
              <input type="text" value={form.nit} onChange={e => handleChange('nit', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Moneda</label>
              <select value={form.moneda} onChange={e => handleChange('moneda', e.target.value)} className="input-base">
                <option value="COP">COP — Peso colombiano</option>
                <option value="USD">USD — Dólar americano</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="surface p-6">
          <div className="flex items-center gap-2 mb-5 text-gray-800">
            <Phone size={18} className="text-teal-700" />
            <h2 className="font-semibold">Información de contacto</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={form.direccion} onChange={e => handleChange('direccion', e.target.value)} className="input-base pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
              <input type="tel" value={form.telefono} onChange={e => handleChange('telefono', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Correo</label>
              <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sitio web</label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={form.website} onChange={e => handleChange('website', e.target.value)} className="input-base pl-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Configuración de negocio */}
        <div className="surface p-6">
          <div className="flex items-center gap-2 mb-5 text-gray-800">
            <Percent size={18} className="text-teal-700" />
            <h2 className="font-semibold">Parámetros de negocio</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">IVA (%)</label>
              <input type="number" min={0} max={100} value={form.iva} onChange={e => handleChange('iva', Number(e.target.value))}
                className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Margen sugerido (%)</label>
              <input type="number" min={0} max={100} value={form.margen} onChange={e => handleChange('margen', Number(e.target.value))}
                className="input-base" />
            </div>
          </div>
        </div>

        {/* Horarios */}
        <div className="surface p-6">
          <div className="flex items-center gap-2 mb-5 text-gray-800">
            <Clock size={18} className="text-teal-700" />
            <h2 className="font-semibold">Horario de atención</h2>
          </div>
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Apertura</label>
              <input type="time" value={form.horaApertura} onChange={e => handleChange('horaApertura', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cierre</label>
              <input type="time" value={form.horaCierre} onChange={e => handleChange('horaCierre', e.target.value)} className="input-base" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={guardando}
            className="btn-primary flex items-center gap-2">
            <Save size={16} />
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
