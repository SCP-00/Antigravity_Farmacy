import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User as UserIcon } from 'lucide-react'
import { useChatbot } from '@/hooks'
import { useUiStore } from '@/store/uiStore'

const SUGERENCIAS = ['¿Tienen ibuprofeno?', 'Horarios', 'Sedes y ubicaciones', 'Servicio a domicilio']

export default function ChatbotWidget() {
  const { chatbotAbierto, toggleChatbot } = useUiStore()
  const { mensajes, escribiendo, enviar } = useChatbot()
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, escribiendo])

  const handleEnviar = () => {
    const txt = input.trim()
    if (!txt) return
    setInput('')
    enviar(txt)
  }

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
      >
        {chatbotAbierto
          ? <X size={22} className="text-white"/>
          : <MessageCircle size={22} className="text-white"/>}
        {!chatbotAbierto && mensajes.length === 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full
                           border-2 border-white animate-pulse"/>
        )}
      </button>

      {/* Panel */}
      {chatbotAbierto && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white rounded-3xl
                        shadow-lg border border-[#D8EBE4] flex flex-col overflow-hidden
                        animate-fade-in max-h-[75vh]">
          {/* Header */}
          <div className="bg-teal-700 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-500 rounded-full flex items-center justify-center">
              <Bot size={18} className="text-white"/>
            </div>
            <div>
              <p className="text-white font-medium text-sm">FarmaBot</p>
              <p className="text-teal-200 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"/>
                En línea
              </p>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#F5F8F6] space-y-3 min-h-0">
            {/* Mensaje de bienvenida */}
            {mensajes.length === 0 && (
              <div className="flex gap-2 items-start">
                <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={13} className="text-teal-700"/>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%]
                                border border-[#D8EBE4] shadow-soft">
                  <p className="text-xs text-gray-700">
                    ¡Hola! 👋 Soy FarmaBot. Puedo ayudarte con consultas de medicamentos,
                    horarios y sedes. ¿En qué te puedo ayudar?
                  </p>
                </div>
              </div>
            )}

            {mensajes.map((m, i) => (
              <div key={i}
                className={`flex gap-2 items-start ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center
                                 flex-shrink-0 mt-0.5
                                 ${m.role === 'user' ? 'bg-teal-700' : 'bg-teal-100'}`}>
                  {m.role === 'user'
                    ? <UserIcon size={12} className="text-white"/>
                    : <Bot size={12} className="text-teal-700"/>}
                </div>
                <div className={`rounded-2xl px-3 py-2 max-w-[80%] text-xs leading-relaxed
                                 whitespace-pre-wrap shadow-soft
                                 ${m.role === 'user'
                                   ? 'bg-teal-700 text-white rounded-tr-sm'
                                   : 'bg-white text-gray-700 border border-[#D8EBE4] rounded-tl-sm'}`}>
                  {m.texto}
                </div>
              </div>
            ))}

            {escribiendo && (
              <div className="flex gap-2 items-start">
                <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={12} className="text-teal-700"/>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-[#D8EBE4]">
                  <div className="flex gap-1 items-center">
                    {[0,1,2].map(i => (
                      <div key={i}
                        className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}/>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>

          {/* Sugerencias (solo si no hay mensajes) */}
          {mensajes.length === 0 && (
            <div className="px-3 pb-2 bg-[#F5F8F6] flex flex-wrap gap-1.5">
              {SUGERENCIAS.map(s => (
                <button key={s} onClick={() => enviar(s)}
                  className="text-xs px-3 py-1 bg-white border border-teal-200 text-teal-700
                             rounded-full hover:bg-teal-50 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Disclaimer médico */}
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
              placeholder="Escribe tu consulta..."
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
            >
              <Send size={14}/>
            </button>
          </div>
        </div>
      )}
    </>
  )
}