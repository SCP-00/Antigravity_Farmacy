import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import SEOHead from '@/components/shared/SEOHead'

function SeccionExpandible({ titulo, children, defaultOpen = false }: { titulo: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [abierto, setAbierto] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        aria-expanded={abierto}
      >
        <h2 className="text-lg font-semibold text-gray-900">{titulo}</h2>
        {abierto ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </button>
      {abierto && (
        <div className="px-5 py-4 text-gray-700 leading-relaxed animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}

export default function QuienesSomos() {
  const [todasAbiertas, setTodasAbiertas] = useState(false)

  return (
    <>
      <SEOHead
        title="Quiénes somos"
        description="Conoce la historia de Farmacy. Farmacia digital en Pereira con sedes físicas, atención profesional y cumplimiento normativo INVIMA."
        path="/quienes-somos"
      />
      <div className="section-shell py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Quiénes somos</h1>
            <button
              onClick={() => setTodasAbiertas(!todasAbiertas)}
              className="text-sm text-teal-700 font-medium hover:text-teal-600 transition-colors"
            >
              {todasAbiertas ? 'Colapsar todo' : 'Expandir todo'}
            </button>
          </div>

          <div className="space-y-3">
            <SeccionExpandible titulo="Nuestra Historia" defaultOpen={true}>
              <p className="mb-3">
                <strong>Farmacy</strong> nació con la misión de acercar medicamentos y productos de bienestar 
                a la comunidad, combinando la confianza de una farmacia física con la comodidad de la tienda online.
              </p>
              <p className="mb-3">
                Contamos con sedes locales en Pereira, entrega en ciudad y personal farmacéutico certificado 
                para asesoría profesional. Nuestro compromiso es ofrecer productos originales, con registro 
                INVIMA y a precios justos.
              </p>
              <p>
                Desde nuestra fundación, hemos atendido a más de 10,000 clientes en el eje cafetero, 
                procesando más de 50,000 órdenes con un índice de satisfacción del 98%.
              </p>
            </SeccionExpandible>

            <SeccionExpandible titulo="Misión" defaultOpen={false}>
              <p>
                Brindar acceso rápido a productos de salud y bienestar de alta calidad, 
                con atención humana y cumplimiento normativo. Trabajamos con proveedores 
                certificados y mantenemos estándares de calidad rigurosos en cada proceso, 
                desde la recepción de mercancía hasta la entrega al cliente final.
              </p>
            </SeccionExpandible>

            <SeccionExpandible titulo="Visión" defaultOpen={false}>
              <p>
                Ser la cadena de farmacias líder en el eje cafetero para 2027, reconocida por 
                nuestra innovación digital, atención personalizada y compromiso con la salud 
                de nuestra comunidad. Expandir nuestra cobertura a 10 municipios y procesar 
                más de 100,000 órdenes al año.
              </p>
            </SeccionExpandible>

            <SeccionExpandible titulo="Valores" defaultOpen={false}>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Seguridad y cumplimiento</strong> — Todos nuestros productos cuentan con registro INVIMA vigente y cumplen con la normativa colombiana.</li>
                <li><strong>Atención profesional</strong> — Nuestro equipo está conformado por farmacéuticos certificados y personal capacitado.</li>
                <li><strong>Rapidez y cercanía</strong> — Entregas en menos de 45 minutos en Pereira y Dosquebradas.</li>
                <li><strong>Transparencia en precios</strong> — Sin cargos ocultos. El precio que ves es el que pagas.</li>
                <li><strong>Innovación</strong> — Plataforma digital con verificación de interacciones, chatbot y seguimiento en tiempo real.</li>
              </ul>
            </SeccionExpandible>

            <SeccionExpandible titulo="Cobertura" defaultOpen={false}>
              <p className="mb-3">
                Operamos con múltiples sedes físicas en Pereira y ofrecemos entrega a domicilio 
                en zonas urbanas del área metropolitana.
              </p>
              <h3 className="font-semibold text-gray-800 mt-4 mb-2">Cobertura actual:</h3>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>🏙️ Pereira — Centro, El Lago, Circunvalar, Cuba, Villa Olímpica</li>
                <li>🏙️ Dosquebradas — Centro, La Pradera, Milán</li>
                <li>🏙️ La Virginia — Casco urbano</li>
              </ul>
              <h3 className="font-semibold text-gray-800 mt-4 mb-2">Próximamente:</h3>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>📍 Marsella</li>
                <li>📍 Santa Rosa de Cabal</li>
              </ul>
            </SeccionExpandible>

            <SeccionExpandible titulo="Equipo" defaultOpen={false}>
              <p className="mb-3">Contamos con un equipo multidisciplinario de más de 20 profesionales:</p>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>👨‍⚕️ Farmacéuticos certificados (Registro Nacional)</li>
                <li>💊 Auxiliares de farmacia</li>
                <li>🚚 Mensajeros y personal logístico</li>
                <li>💻 Equipo de desarrollo y tecnología</li>
                <li>📞 Atención al cliente</li>
              </ul>
            </SeccionExpandible>

            <SeccionExpandible titulo="Certificaciones" defaultOpen={false}>
              <ul className="list-disc ml-6 space-y-2 text-sm">
                <li>✅ Registro Sanitario INVIMA</li>
                <li>✅ Cumplimiento BPM (Buenas Prácticas de Manufactura)</li>
                <li>✅ Protección de datos personales - Ley 1581 de 2012</li>
                <li>✅ Facturación electrónica - DIAN</li>
              </ul>
              <p className="mt-4 text-xs text-gray-500">
                Todos nuestros procesos cumplen con la normativa colombiana vigente para 
                establecimientos farmacéuticos (Decreto 2200 de 2005, Resolución 1403 de 2007).
              </p>
            </SeccionExpandible>
          </div>
        </div>
      </div>
    </>
  )
}
