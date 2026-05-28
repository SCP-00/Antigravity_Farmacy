import { Link } from 'react-router-dom'

/**
 * Página genérica con encabezado decorativo, descripción y acción.
 * Usada como placeholder para páginas en construcción o como base de páginas estáticas.
 */
interface Props {
  eyebrow?: string
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}

export default function PageShell({ eyebrow = 'Farmacy', title, description, actionLabel, actionTo }: Props) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      <section className="rounded-[2rem] border border-white/70 bg-white/90 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-teal-900 via-teal-700 to-blue-700 text-white px-6 py-8 md:px-10">
          <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
            {eyebrow}
          </span>
          <h1 className="mt-4 text-3xl md:text-5xl font-serif leading-tight">
            <span className="text-white">{title}</span>
            <span className="text-red-200">.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm md:text-base text-white/80">
            {description}
          </p>
        </div>

        <div className="px-6 py-8 md:px-10">
          <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr] items-center">
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                Esta pantalla todavía es una base funcional. La iré reemplazando por la lógica real del flujo que priorizaste.
              </p>
              <p>
                Mientras tanto, el catálogo, el carrito y la persistencia ya quedan conectados para que puedas probar el recorrido principal.
              </p>
            </div>
            {actionLabel && actionTo && (
              <div className="flex md:justify-end">
                <Link to={actionTo} className="btn-primary w-full md:w-auto justify-center">
                  {actionLabel}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
