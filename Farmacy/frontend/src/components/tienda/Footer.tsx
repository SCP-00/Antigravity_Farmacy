import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Farmacy</h3>
            <p className="text-sm leading-relaxed">
              Tu farmacia online de confianza. Medicamentos, vitaminas y productos de salud con envío rápido.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="hover:text-blue-400"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-blue-400"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="hover:text-blue-400"><Twitter className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Enlaces rápidos</h4>
            <ul className="text-sm space-y-2">
              <li><Link to="/catalogo" className="hover:text-blue-400">Catálogo</Link></li>
              <li><Link to="/sucursales" className="hover:text-blue-400">Sucursales</Link></li>
              <li><Link to="/quienes-somos" className="hover:text-blue-400">Quiénes somos</Link></li>
              <li><Link to="/contacto" className="hover:text-blue-400">Contacto</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Soporte</h4>
            <ul className="text-sm space-y-2">
              <li><Link to="/politica-privacidad" className="hover:text-blue-400">Política de Privacidad</Link></li>
              <li><Link to="/terminos-condiciones" className="hover:text-blue-400">Términos y Condiciones</Link></li>
              <li><a href="#" className="hover:text-blue-400">Preguntas Frecuentes</a></li>
              <li><a href="#" className="hover:text-blue-400">Cambios y Devoluciones</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contáctanos</h4>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <Phone className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span>+57 (6) 312-7525</span>
              </div>
              <div className="flex gap-2">
                <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span>info@farmacy.com</span>
              </div>
              <div className="flex gap-2">
                <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span>Pereira, Risaralda</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; 2024 Farmacy. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <img src="https://img.icons8.com/?size=32&id=nAH3QQzz0nO1&format=png" alt="Visa" className="h-6" />
              <img src="https://img.icons8.com/?size=32&id=sC7bTJuB5rqV&format=png" alt="Mastercard" className="h-6" />
              <img src="https://img.icons8.com/?size=32&id=16509&format=png" alt="PayPal" className="h-6" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
