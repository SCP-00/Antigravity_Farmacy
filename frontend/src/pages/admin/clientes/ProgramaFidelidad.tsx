import { Coins, Sparkles, TrendingUp, Users } from 'lucide-react'

export default function ProgramaFidelidad() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <div className="bg-gradient-to-r from-teal-900 to-emerald-800 rounded-3xl p-8 text-white shadow-xl">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkles size={14}/> Configuración Global
        </span>
        <h1 className="text-4xl font-serif font-bold mb-2">Programa de Fidelidad</h1>
        <p className="text-teal-100 max-w-xl">
          Políticas actuales del sistema de Cashback para clientes registrados en la tienda web y sucursales.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="surface p-6">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4"><Coins size={24}/></div>
          <h3 className="font-bold text-gray-900 mb-1">Ratio de Acumulación</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Los clientes ganan <strong>1 punto</strong> por cada <strong>$100 COP</strong> en compras finalizadas.
          </p>
        </div>

        <div className="surface p-6">
          <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-4"><TrendingUp size={24}/></div>
          <h3 className="font-bold text-gray-900 mb-1">Ratio de Redención</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Cada punto equivale a <strong>$1 COP</strong> de descuento en el Checkout.
          </p>
        </div>

        <div className="surface p-6">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Users size={24}/></div>
          <h3 className="font-bold text-gray-900 mb-1">Vencimiento</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Los puntos expiran a los <strong>12 meses (1 año)</strong> exactos desde la fecha de acumulación.
          </p>
        </div>
      </div>

      <div className="surface p-8 text-center mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Creación de Códigos de Descuento Promocionales</h3>
        <p className="text-gray-500 text-sm max-w-xl mx-auto mb-6">
          La tabla de <code>CodigoDescuento</code> ya fue implementada en base de datos en la Fase 5. 
          El módulo de creación (UI) estará disponible próximamente en las configuraciones del sistema.
        </p>
        <button className="btn-secondary" disabled>Módulo UI en construcción</button>
      </div>

    </div>
  )
}
