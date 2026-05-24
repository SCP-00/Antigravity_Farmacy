import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageCircle, X, Send, Bot, User as UserIcon,
  AlertTriangle, AlertCircle, Info, Pill, ShoppingCart,
  Activity, ChevronDown, ChevronUp, Menu,
} from 'lucide-react'
import { useChatbot, type ProductoChatbot, type AlertaChatbot } from '@/hooks'
import { useUiStore } from '@/store/uiStore'
import { useFormateo } from '@/hooks'

const DELAY_CLASSES = ['[animation-delay:0ms]', '[animation-delay:150ms]', '[animation-delay:300ms]']

// Acciones rápidas siempre disponibles
const ACCIONES_RAPIDAS = [
  { label: '🔍 Buscar', cmd: 'Buscar medicamentos' },
  { label: '⚠️ Interacciones', cmd: 'Verificar interacciones' },
  { label: '🏪 Sedes', cmd: 'Sedes y ubicaciones' },
  { label: '🚚 Domicilios', cmd: 'Servicio a domicilio' },
  { label: '💊 Alternativas', cmd: 'Alternativas y genéricos' },
  { label: '❓ FAQ', cmd: 'Preguntas frecuentes' },
]

// ── ProductCard ───────────────────────────────────────────
function ProductCard({ p }: { p: ProductoChatbot }) {
  const { cop } = useFormateo()
  const navigate = useNavigate()
  return (
    <div className="flex items-start gap-2.5 p-2.5 bg-white border border-teal-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Pill size={14} className="text-teal-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-slate-900 truncate">
          {p.nombre} {p.concentracion ?? ''}
        </p>
        <p className="text-[10px] text-slate-400 truncate">
          {p.laboratorio ?? ''} · {p.presentacion ?? ''}
        </p>
        {p.stockTotal > 0 && (
          <p className="text-[10px] text-teal-600 font-semibold mt-0.5">
            {cop(p.precioVenta)} · {p.stockTotal} uds.
            {p.requiereRx && <span className="text-amber-600 ml-1">RX</span>}
          </p>
        )}
      </div>
      <button
        onClick={() => navigate(`/producto/${p.id}`)}
        className="flex-shrink-0 px-2 py-1 bg-teal-700 text-white text-[9px] font-semibold rounded-lg hover:bg-teal-600 transition-colors"
        title="Ver producto"
      >
        <ShoppingCart size={10} className="inline mr-0.5" />
        Ver
      </button>
    </div>
  )
}

// ── AlertaBadge ───────────────────────────────────────────
function AlertaBadge({ a }: { a: AlertaChatbot }) {
  const [expandida, setExpandida] = useState(false)

  const config = a.severidad === 'ALTA'
    ? { bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle, iconColor: 'text-red-600', badge: 'bg-red-600', label: 'Alta' }
    : a.severidad === 'MEDIA'
    ? { bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-600', badge: 'bg-amber-600', label: 'Media' }
    : { bg: 'bg-blue-50', border: 'border-blue-200', icon: Info, iconColor: 'text-blue-600', badge: 'bg-blue-600', label: 'Info' }

  const Icon = config.icon

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-2 text-[10px]`}>
      <button
        onClick={() => setExpandida(!expandida)}
        className="flex items-center gap-1.5 w-full text-left"
      >
        <Icon size={12} className={`${config.iconColor} flex-shrink-0`} />
        <span className={`px-1.5 py-0.5 rounded text-white text-[8px] font-bold ${config.badge} flex-shrink-0`}>
          {config.label}
        </span>
        <span className="text-slate-700 font-medium truncate flex-1">{a.descripcion}</span>
        {expandida ? <ChevronUp size={10} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={10} className="text-slate-400 flex-shrink-0" />}
      </button>
      {expandida && (
        <div className="mt-1.5 pl-5 space-y-0.5 text-[10px] text-slate-500">
          {a.productoA && <p>Producto: {a.productoA}</p>}
          {a.productoB && <p>Interactúa con: {a.productoB}</p>}
          <p>Tipo: {a.tipo}</p>
        </div>
      )}
    </div>
  )
}

// ── AlertaBanner ──────────────────────────────────────────
function AlertaBanner({ count }: { count: number }) {
  return (
    <div className="mx-2 my-1 px-2.5 py-2 bg-red-50 border border-red-200 rounded-xl">
      <div className="flex items-center gap-2">
        <AlertCircle size={14} className="text-red-600 flex-shrink-0 animate-pulse" />
        <p className="text-[10px] text-red-800 font-semibold">
          {count} alerta{count !== 1 ? 's' : ''} de seguridad detectada{count !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}

// ── ChatbotWidget ─────────────────────────────────────────
export default function ChatbotWidget() {
  const { chatbotAbierto, toggleChatbot } = useUiStore()
  const { mensajes, escribiendo, enviar } = useChatbot()
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, escribiendo])

  // Contar alertas del último mensaje (derivación directa, sin estado)
  const alertasRecientes = mensajes[mensajes.length - 1]?.alertas?.length ?? 0

  const handleEnviar = () => {
    const txt = input.trim()
    if (!txt) return
    setInput('')
    enviar(txt)
  }

  const handleResetMenu = () => {
    enviar('hola')
  }

  const totalAlertas = mensajes.reduce((acc, m) => acc + (m.alertas?.length ?? 0), 0)

  return (
    <>
      {/* FAB */}
      <button
        onClick={toggleChatbot}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg
                    flex items-center justify-center transition-all duration-200
                    ${chatbotAbierto
            ? 'bg-gray-600 scale-90'
            : 'bg-teal-700 hover:bg-teal-600 hover:scale-110'}`}
        title="Chatbot Farmacy"
        aria-label="Abrir asistente virtual"
      >
        {chatbotAbierto
          ? <X size={22} className="text-white" />
          : <MessageCircle size={22} className="text-white" />}
        {!chatbotAbierto && (mensajes.length === 0 || totalAlertas > 0) && (
          <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white
                          ${totalAlertas > 0 ? 'bg-red-500 animate-none flex items-center justify-center text-[8px] text-white font-bold' : 'bg-amber-400 animate-pulse'}`}>
            {totalAlertas > 0 ? totalAlertas : ''}
          </span>
        )}
      </button>

      {/* Panel */}
      {chatbotAbierto && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white rounded-3xl
                        shadow-lg border border-[#D8EBE4] flex flex-col overflow-hidden
                        animate-fade-in max-h-[75vh]">
          {/* Header */}
          <div className="bg-teal-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-500 rounded-full flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">FarmaBot</p>
                <p className="text-teal-200 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  En línea
                </p>
              </div>
              {/* Indicador de menú activo */}
              {mensajes[mensajes.length - 1]?.menuActivo && (
                <span className="ml-1 px-1.5 py-0.5 bg-teal-600 rounded text-[8px] text-teal-100 font-mono flex items-center gap-0.5">
                  <Menu size={8} />
                  Menú
                </span>
              )}
            </div>

            {mensajes.length > 0 && (
              <button
                onClick={handleResetMenu}
                className="text-xs bg-teal-800 text-teal-100 px-3 py-1.5 rounded-full hover:bg-teal-600 active:scale-95 transition-all"
                title="Volver al menú principal"
                aria-label="Volver al menú principal"
              >
                Menú
              </button>
            )}
          </div>

          {/* Alertas recientes banner */}
          {alertasRecientes > 0 && <AlertaBanner count={alertasRecientes} />}

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#F5F8F6] space-y-3 min-h-0">
            {/* Mensaje de bienvenida */}
            {mensajes.length === 0 && (
              <div className="flex gap-2 items-start">
                <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={13} className="text-teal-700" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%]
                                border border-[#D8EBE4] shadow-soft">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    ¡Hola! 👋 Soy <strong>FarmaBot</strong>, tu asistente virtual de <strong>Farmacy</strong>. 🏪
                  </p>
                  <p className="text-[11px] text-gray-600 mt-2">
                    Puedo ayudarte a buscar medicamentos, verificar interacciones, consultar horarios y más.
                    Elige una opción del menú para empezar 👇
                  </p>
                </div>
              </div>
            )}

            {mensajes.map((m, i) => (
              <div key={i} className="space-y-2">
                <div className={`flex gap-2 items-start ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center
                                   flex-shrink-0 mt-0.5
                                   ${m.role === 'user' ? 'bg-teal-700' : 'bg-teal-100'}`}>
                    {m.role === 'user'
                      ? <UserIcon size={12} className="text-white" />
                      : <Bot size={12} className="text-teal-700" />}
                  </div>
                  <div className={`rounded-2xl px-3 py-2 max-w-[80%] text-xs leading-relaxed
                                   whitespace-pre-wrap shadow-soft space-y-2
                                   ${m.role === 'user'
                      ? 'bg-teal-700 text-white rounded-tr-sm'
                      : 'bg-white text-gray-700 border border-[#D8EBE4] rounded-tl-sm'}`}>
                    <p>{m.texto}</p>

                    {/* Product cards */}
                    {m.productos && m.productos.length > 0 && (
                      <div className="space-y-1.5 pt-1.5 border-t border-gray-100">
                        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                          Productos encontrados ({m.productos.length})
                        </p>
                        {m.productos.map(p => (
                          <ProductCard key={p.id} p={p} />
                        ))}
                        <p className="text-[9px] text-slate-400 italic">
                          Haz clic en "Ver" para más detalles e información INVIMA.
                        </p>
                      </div>
                    )}

                    {/* Alertas de seguridad */}
                    {m.alertas && m.alertas.length > 0 && (
                      <div className="space-y-1.5 pt-1.5 border-t border-gray-100">
                        <p className="flex items-center gap-1 text-[9px] text-red-600 font-bold uppercase tracking-wider">
                          <Activity size={10} />
                          Alertas de seguridad ({m.alertas.length})
                        </p>
                        {m.alertas.map((a, idx) => (
                          <AlertaBadge key={idx} a={a} />
                        ))}
                        <p className="text-[9px] text-slate-400 italic">
                          ⚕️ Consulta siempre con un profesional de la salud.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {escribiendo && (
              <div className="flex gap-2 items-start">
                <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={12} className="text-teal-700" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-[#D8EBE4]">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <div key={i}
                        className={`w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce ${DELAY_CLASSES[i]}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Acciones rápidas — siempre visibles cuando no hay input */}
          {mensajes.length > 0 && (
            <div className="px-3 py-2 bg-[#F5F8F6] border-t border-[#D8EBE4]">
              <div className="flex flex-wrap gap-1">
                {ACCIONES_RAPIDAS.slice(0, 6).map(a => (
                  <button
                    key={a.cmd}
                    onClick={() => enviar(a.cmd)}
                    className="text-[10px] px-2 py-1 bg-white border border-teal-200 text-teal-700
                               rounded-full hover:bg-teal-50 hover:border-teal-300 transition-all"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )
          /* Sugerencias iniciales */
          || (
            <div className="px-3 pb-2 bg-[#F5F8F6]">
              <div className="flex flex-wrap gap-1.5">
                {ACCIONES_RAPIDAS.map(a => (
                  <button key={a.cmd} onClick={() => enviar(a.cmd)}
                    className="text-xs px-3 py-1.5 bg-white border border-teal-200 text-teal-700
                               rounded-full hover:bg-teal-50 hover:border-teal-300 transition-all font-medium"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="px-4 py-1.5 bg-amber-50 border-t border-amber-100">
            <p className="text-[10px] text-amber-700">
              ⚕️ Este chatbot no reemplaza asesoría médica profesional.
            </p>
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-[#D8EBE4] bg-white">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar() } }}
              placeholder="Ej: ¿tienen ibuprofeno?"
              className="flex-1 text-sm px-3 py-2 bg-[#F5F8F6] border border-[#D8EBE4]
                         rounded-xl outline-none focus:border-teal-400 focus:ring-2
                         focus:ring-teal-400/20 transition-all"
            />
            <button
              onClick={handleEnviar}
              disabled={!input.trim() || escribiendo}
              className="w-9 h-9 bg-teal-700 rounded-xl flex items-center justify-center
                         text-white hover:bg-teal-600 disabled:opacity-40 transition-all
                         flex-shrink-0"
              title="Enviar mensaje"
              aria-label="Enviar mensaje"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
