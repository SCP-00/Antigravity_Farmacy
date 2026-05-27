import { FileText } from 'lucide-react'
import SEOHead from '@/components/shared/SEOHead'

export default function TerminosCondiciones() {
  return (
    <>
      <SEOHead
        title="Términos y condiciones"
        description="Términos y condiciones de uso de Farmacy. Lee nuestras políticas sobre medicamentos, prescripciones, entregas y devoluciones."
        path="/terminos"
      />
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <section className="rounded-[2rem] border border-white/70 bg-white/95 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-teal-900 via-teal-700 to-blue-700 text-white px-6 py-8 md:px-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
              <FileText size={12} /> Legal
            </span>
            <h1 className="mt-4 text-3xl md:text-5xl font-serif leading-tight">
              Términos y condiciones
              <span className="text-red-200">.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm md:text-base text-white/80">
              Última actualización: mayo 2026
            </p>
          </div>

          <div className="px-6 py-8 md:px-10 prose prose-sm max-w-none text-gray-700">
            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">1. Aceptación de los términos</h2>
            <p>
              Al acceder y utilizar el portal web <strong>Antigravity Farmacy</strong> (en adelante, "Farmacy"), 
              usted acepta los presentes Términos y Condiciones. Si no está de acuerdo con alguna disposición, 
              le solicitamos no utilizar nuestros servicios.
            </p>

            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">2. Descripción del servicio</h2>
            <p>
              Farmacy es una plataforma de comercio electrónico especializada en la venta de medicamentos, 
              productos farmacéuticos, cosméticos y artículos de cuidado personal. Operamos en territorio colombiano 
              bajo la regulación del <strong>INVIMA</strong> y la <strong>Superintendencia de Industria y Comercio</strong>.
            </p>

            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">3. Requisitos de uso</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Ser mayor de edad (18 años) o estar autorizado por un representante legal.</li>
              <li>Proporcionar información veraz y actualizada en el registro.</li>
              <li>No utilizar la plataforma para fines ilícitos o no autorizados.</li>
              <li>No compartir sus credenciales de acceso con terceros.</li>
            </ul>

            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">4. Medicamentos y prescripciones</h2>
            <p>
              De conformidad con la <strong>Resolución 1403 de 2007</strong> y demás normativa colombiana aplicable:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Medicamentos de venta libre (OTC):</strong> pueden ser adquiridos directamente sin receta médica.</li>
              <li><strong>Medicamentos de venta bajo fórmula médica (Rx):</strong> requieren prescripción médica vigente. El usuario debe cargar la fórmula al momento de la compra.</li>
              <li>Farmacy verificará la validez de la prescripción antes de despachar. Nos reservamos el derecho de rechazar pedidos que no cumplan con este requisito.</li>
              <li>La dispensación de medicamentos se realiza de acuerdo con el perfil farmacoterapéutico del paciente y las alertas de interacciones medicamentosas.</li>
            </ul>

            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">5. Precios y pagos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Todos los precios están expresados en pesos colombianos (COP) e incluyen el IVA cuando aplica.</li>
              <li>Los métodos de pago aceptados son: tarjetas débito y crédito (Visa, Mastercard, Amex), PSE, Nequi (a través de Wompi), MercadoPago, Stripe y efectivo en punto de venta.</li>
              <li>Farmacy se reserva el derecho de modificar precios sin previo aviso, salvo por pedidos ya confirmados.</li>
            </ul>

            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">6. Despacho y entregas</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Realizamos entregas en todo el territorio colombiano a través de operadores logísticos autorizados.</li>
              <li>Los tiempos de entrega varían según la ubicación: 1-3 días hábiles en zonas urbanas principales, 3-7 días en zonas rurales.</li>
              <li>Los medicamentos que requieren cadena de frío serán entregados en empaques especiales que garanticen su integridad.</li>
              <li>Se requiere firma de recepción para todos los pedidos de medicamentos. Si no hay quien reciba, se intentará una segunda entrega.</li>
            </ul>

            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">7. Devoluciones y garantías</h2>
            <p>
              Aplican las disposiciones del <strong>Estatuto del Consumidor (Ley 1480 de 2011)</strong>:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Puede solicitar la devolución de un producto no farmacéutico dentro de los 5 días hábiles siguientes a la entrega.</li>
              <li>Por razones sanitarias, no aceptamos devoluciones de medicamentos una vez entregados, salvo defectos de fabricación comprobados.</li>
              <li>Si recibe un producto incorrecto o en mal estado, contáctenos dentro de las 24 horas siguientes a la entrega.</li>
            </ul>

            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">8. Responsabilidad</h2>
            <p>
              Farmacy no se hace responsable por el uso indebido de los medicamentos adquiridos a través de la plataforma. 
              El usuario es responsable de seguir las indicaciones del médico tratante y las instrucciones del producto. 
              En caso de reacción adversa, suspenda el uso y consulte a su médico o a la línea de urgencias.
            </p>

            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">9. Propiedad intelectual</h2>
            <p>
              Todos los contenidos del portal —incluyendo textos, imágenes, logotipos, marcas y código— son propiedad 
              de Farmacy o de sus licenciantes. Queda prohibida su reproducción total o parcial sin autorización expresa.
            </p>

            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">10. Ley aplicable</h2>
            <p>
              Estos Términos y Condiciones se rigen por las leyes de la República de Colombia. Cualquier controversia 
              será sometida a los jueces de Bogotá D.C., renunciando a cualquier otro fuero.
            </p>

            <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">11. Contacto</h2>
            <p>
              Para cualquier consulta sobre estos términos, contáctenos en{' '}
              <strong>legal@antigravityfarmacy.co</strong> o en nuestra dirección física en Bogotá D.C.
            </p>

            <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
              <p><strong>Antigravity Farmacy S.A.S.</strong> — NIT 901.xxx.xxx-x</p>
              <p>Bogotá D.C., Colombia</p>
              <p>contacto@antigravityfarmacy.co</p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
