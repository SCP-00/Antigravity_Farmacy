import { AlertTriangle, AlertCircle, Info, X, ShieldAlert, ArrowLeft, CheckCircle } from 'lucide-react'

interface AlertaInteraccion {
  tipo: 'INTERACCION_MEDICAMENTOSA' | 'ALERGENO' | 'CONTRAINDICACION' | 'REACCION'
  productoA: string
  productoB?: string
  descripcion: string
  severidad: 'ALTA' | 'MEDIA' | 'BAJA' | 'INFO'
}

/**
 * Props del modal de alertas de interacciones medicamentosas.
 * Muestra alertas clínicas al agregar productos al carrito.
 */
interface InteractionAlertModalProps {
  /** Lista de alertas detectadas (vacía = sin alertas) */
  alertas: AlertaInteraccion[]
  /** Callback al confirmar (continuar con la venta) */
  onConfirm: () => void
  /** Callback al cancelar (revisar carrito) */
  onCancel: () => void
  /** Estado de carga mientras se procesa */
  loading: boolean
}

const SEVERIDAD_CONFIG = {
  ALTA: {
    icon: ShieldAlert,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    badge: 'bg-red-600 text-white',
    label: 'Alta Prioridad',
  },
  MEDIA: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-600 text-white',
    label: 'Precaución',
  },
  BAJA: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    badge: 'bg-yellow-600 text-white',
    label: 'Baja',
  },
  INFO: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-600 text-white',
    label: 'Informativo',
  },
}

function parseDescripcion(desc: string): string {
  return desc
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}

/**
 * Modal de alertas clínicas para interacciones medicamentosas (FEFO/INVIMA).
 * Agrupa las alertas por severidad (ALTA > MEDIA > BAJA > INFO)
 * y permite al usuario continuar o revisar el carrito.
 *
 * @example
 * ```tsx
 * <InteractionAlertModal
 *   alertas={[
 *     { tipo: 'INTERACCION_MEDICAMENTOSA', productoA: 'Ibuprofeno', productoB: 'Warfarina',
 *       descripcion: 'Riesgo de sangrado', severidad: 'ALTA' }
 *   ]}
 *   onConfirm={() => procesarVenta()}
 *   onCancel={() => setShowModal(false)}
 *   loading={false}
 * />
 * ```
 */
export default function InteractionAlertModal({ alertas, onConfirm, onCancel, loading }: InteractionAlertModalProps) {
  const severidadMaxima = alertas.reduce((max, a) => {
    const orden = { ALTA: 3, MEDIA: 2, BAJA: 1, INFO: 0 }
    return orden[a.severidad] > orden[max] ? a.severidad : max
  }, 'INFO' as AlertaInteraccion['severidad'])

  const tieneAltaPrioridad = severidadMaxima === 'ALTA'

  // Agrupar por severidad
  const alertasAgrupadas = {
    ALTA: alertas.filter(a => a.severidad === 'ALTA'),
    MEDIA: alertas.filter(a => a.severidad === 'MEDIA'),
    BAJA: alertas.filter(a => a.severidad === 'BAJA'),
    INFO: alertas.filter(a => a.severidad === 'INFO'),
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className={`px-6 py-5 border-b flex items-center gap-3 ${
          tieneAltaPrioridad ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className={`p-2.5 rounded-full ${
            tieneAltaPrioridad ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
          }`}>
            <ShieldAlert size={24} />
          </div>
          <div className="flex-1">
            <h2 className={`text-lg font-bold ${tieneAltaPrioridad ? 'text-red-900' : 'text-amber-900'}`}>
              Alerta Clínica
            </h2>
            <p className={`text-xs mt-0.5 ${tieneAltaPrioridad ? 'text-red-700' : 'text-amber-700'}`}>
              Se detectaron {alertas.length} alerta{alertas.length !== 1 ? 's' : ''} de seguridad en los productos del carrito
            </p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-white/50 transition-colors">
            <X size={18} className={tieneAltaPrioridad ? 'text-red-400' : 'text-amber-400'} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {alertas.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
              <p className="font-semibold text-gray-700">Sin alertas detectadas</p>
            </div>
          ) : (
            <>
              {/* Alertas ALTA primero */}
              {(['ALTA', 'MEDIA', 'BAJA', 'INFO'] as const).map(sev => {
                const items = alertasAgrupadas[sev]
                if (items.length === 0) return null
                const cfg = SEVERIDAD_CONFIG[sev]
                const Icon = cfg.icon

                return items.map((alerta, idx) => (
                  <div key={`${sev}-${idx}`} className={`p-4 rounded-2xl border ${cfg.bgColor}`}>
                    <div className="flex items-start gap-3">
                      <Icon size={18} className={`${cfg.color} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                          <span className="text-xs font-semibold text-gray-700">
                            {alerta.productoA}
                            {alerta.productoB && <span className="text-gray-400"> ↔ </span>}
                            {alerta.productoB && <span className="text-gray-700">{alerta.productoB}</span>}
                          </span>
                        </div>
                        <p
                          className="text-xs text-gray-600 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: parseDescripcion(alerta.descripcion) }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-surface/80 flex items-center justify-between gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 dark:text-dark-text/60 dark:hover:bg-dark-border transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Revisar carrito
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-md ${
              tieneAltaPrioridad
                ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                : 'bg-teal-700 text-white hover:bg-teal-600 disabled:opacity-50'
            }`}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            {loading ? 'Procesando...' : tieneAltaPrioridad ? 'Continuar de todas formas' : 'Continuar con la venta'}
          </button>
        </div>
      </div>
    </div>
  )
}
