import { Shield } from 'lucide-react'

export default function PoliticaPrivacidad() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      <section className="rounded-[2rem] border border-white/70 bg-white/95 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-teal-900 via-teal-700 to-blue-700 text-white px-6 py-8 md:px-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
            <Shield size={12} /> Legal
          </span>
          <h1 className="mt-4 text-3xl md:text-5xl font-serif leading-tight">
            Política de privacidad
            <span className="text-red-200">.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm md:text-base text-white/80">
            Última actualización: mayo 2026
          </p>
        </div>

        <div className="px-6 py-8 md:px-10 prose prose-sm max-w-none text-gray-700">
          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">1. Responsable del tratamiento</h2>
          <p>
            <strong>Antigravity Farmacy S.A.S.</strong> (en adelante, "Farmacy"), identificada con NIT 901.xxx.xxx-x,
            con domicilio principal en Bogotá D.C., Colombia, es la responsable del tratamiento de sus datos personales.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">2. Datos que recopilamos</h2>
          <p>Podemos recopilar la siguiente información personal:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Datos de identificación:</strong> nombre completo, documento de identidad, fecha de nacimiento.</li>
            <li><strong>Datos de contacto:</strong> correo electrónico, teléfono, dirección de residencia.</li>
            <li><strong>Datos de salud:</strong> información sobre alergias, condiciones preexistentes y medicamentos de uso habitual, necesarios para la dispensación segura de medicamentos.</li>
            <li><strong>Datos de facturación:</strong> historial de compras, métodos de pago (sin almacenar datos completos de tarjetas).</li>
            <li><strong>Datos de navegación:</strong> dirección IP, tipo de dispositivo, páginas visitadas en nuestro portal.</li>
          </ul>

          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">3. Finalidades del tratamiento</h2>
          <p>Sus datos serán tratados para las siguientes finalidades:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Procesar y gestionar sus pedidos de medicamentos y productos farmacéuticos.</li>
            <li>Verificar la validez de las fórmulas médicas (prescripciones) cuando aplique.</li>
            <li>Facturar y gestionar los métodos de pago seleccionados.</li>
            <li>Enviar información sobre el estado de sus pedidos y notificaciones de despacho.</li>
            <li>Cumplir con obligaciones regulatorias ante el INVIMA y demás autoridades de salud colombianas.</li>
            <li>Mejorar nuestro portal web y la experiencia de usuario.</li>
            <li>Enviar comunicaciones comerciales, previa autorización expresa.</li>
          </ul>

          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">4. Base legal</h2>
          <p>
            El tratamiento de sus datos personales se fundamenta en la <strong>Ley 1581 de 2012</strong> y el 
            <strong>Decreto 1377 de 2013</strong> (compilados en el Decreto 1074 de 2015), así como en la 
            <strong>Resolución 1403 de 2007</strong> del Ministerio de Protección Social sobre publicidad de medicamentos.
            Al registrarse y aceptar nuestra política, usted otorga su consentimiento libre, previo, expreso e informado.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">5. Almacenamiento y seguridad</h2>
          <p>
            Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger sus datos personales 
            contra acceso no autorizado, pérdida, alteración o divulgación indebida. Sus datos se almacenan en servidores 
            ubicados en Colombia y Estados Unidos, con proveedores que cumplen con estándares internacionales de seguridad (ISO 27001, SOC 2).
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">6. Transferencia de datos</h2>
          <p>
            No compartimos sus datos personales con terceros no vinculados, excepto cuando sea necesario para:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Procesar pagos a través de pasarelas autorizadas (Wompi, Stripe, MercadoPago).</li>
            <li>Coordinar entregas con empresas de mensajería y logística.</li>
            <li>Cumplir con obligaciones legales o requerimientos de autoridades competentes.</li>
          </ul>

          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">7. Derechos del titular</h2>
          <p>De acuerdo con la Ley 1581 de 2012, usted tiene derecho a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Acceder</strong> a sus datos personales en nuestro poder.</li>
            <li><strong>Rectificar</strong> datos inexactos o incompletos.</li>
            <li><strong>Solicitar la eliminación</strong> de sus datos cuando no sean necesarios para las finalidades descritas.</li>
            <li><strong>Revocar</strong> el consentimiento otorgado.</li>
            <li><strong>Solicitar prueba</strong> de la autorización otorgada.</li>
            <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley.</li>
          </ul>
          <p className="mt-2">
            Para ejercer sus derechos, contáctenos en <strong>privacidad@antigravityfarmacy.co</strong> o en nuestra 
            dirección física en Bogotá.
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3">8. Vigencia</h2>
          <p>
            La presente política entra en vigor a partir de su publicación y estará vigente hasta que sea modificada. 
            Nos reservamos el derecho de actualizarla en cualquier momento. Le notificaremos cambios significativos a 
            través de nuestro portal o por correo electrónico.
          </p>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
            <p><strong>Antigravity Farmacy S.A.S.</strong> — NIT 901.xxx.xxx-x</p>
            <p>Bogotá D.C., Colombia</p>
            <p>contacto@antigravityfarmacy.co</p>
          </div>
        </div>
      </section>
    </div>
  )
}
