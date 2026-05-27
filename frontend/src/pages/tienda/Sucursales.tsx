import { useQuery } from '@tanstack/react-query'
import { MapPin, Clock, Phone, Mail } from 'lucide-react'
import { sucursalesService } from '@/services'
import SEOHead from '@/components/shared/SEOHead'

export default function Sucursales() {
  const { data: sedes } = useQuery({
    queryKey: ['sucursales'],
    queryFn:  sucursalesService.listar,
  })

  return (
    <>
      <SEOHead
        title="Sucursales"
        description="Encuentra todas nuestras sedes en Pereira. Horarios, direcciones y datos de contacto de cada punto de atención Farmacy."
        path="/sucursales"
      />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Nuestras sedes</h1>
        <p className="text-gray-500 mb-8">Visítanos en cualquiera de nuestros puntos de atención en Pereira.</p>

        <div className="grid md:grid-cols-2 gap-6">
          {(sedes ?? []).map((s: any) => (
            <div key={s.id} className="card hover:shadow-md transition-all">
              {/* Mapa estático embed */}
              {s.latitud && s.longitud && (
                <div className="h-40 rounded-xl overflow-hidden mb-4 bg-teal-50 flex items-center justify-center">
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${s.longitud - 0.005},${s.latitud - 0.005},${s.longitud + 0.005},${s.latitud + 0.005}&layer=mapnik&marker=${s.latitud},${s.longitud}`}
                    className="w-full h-full border-0"
                    title={s.nombre}
                    loading="lazy"
                  />
                </div>
              )}
              <h2 className="font-semibold text-lg mb-3">{s.nombre}</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-teal-600 flex-shrink-0" />
                  {s.direccion}, {s.ciudad}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-teal-600 flex-shrink-0" />
                  Lun–Sáb {s.horarioApertura} – {s.horarioCierre}
                </div>
                {s.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-teal-600 flex-shrink-0" />
                    <a href={`tel:${s.telefono}`} className="hover:text-teal-700">{s.telefono}</a>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-teal-600 flex-shrink-0" />
                    <a href={`mailto:${s.email}`} className="hover:text-teal-700">{s.email}</a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
