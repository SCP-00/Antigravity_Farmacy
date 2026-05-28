// ══════════════════════════════════════════════════════════
//  LazyImage — Carga diferida de imágenes con placeholder
//  Usa IntersectionObserver con rootMargin para carga anticipada
// ══════════════════════════════════════════════════════════
import { useState, useRef, useEffect, type ImgHTMLAttributes } from 'react'

/**
 * Props para el componente de imagen con carga diferida.
 * Extiende los atributos nativos de `<img>`.
 */
type LazyImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** Clases CSS para el placeholder/skeleton mientras carga */
  placeholderClassName?: string
  /** Root margin para IntersectionObserver (default: '200px') */
  rootMargin?: string
}

/**
 * Imagen con carga diferida (lazy loading) usando IntersectionObserver.
 * Muestra un placeholder animado mientras la imagen no está en viewport o no ha cargado.
 * La imagen solo se descarga cuando está cerca del viewport (configurable via rootMargin).
 *
 * @example
 * ```tsx
 * <LazyImage
 *   src="/productos/ibuprofeno.jpg"
 *   alt="Ibuprofeno 400mg"
 *   className="w-full h-48 rounded-xl"
 *   rootMargin="100px"
 * />
 * ```
 */
export default function LazyImage({
  src,
  alt = '',
  className = '',
  placeholderClassName = '',
  rootMargin = '200px',
  ...props
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = imgRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin])

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} {...props}>
      {/* Placeholder / skeleton */}
      {!loaded && (
        <div
          className={`absolute inset-0 bg-slate-100 dark:bg-dark-border/30 animate-pulse ${placeholderClassName}`}
        />
      )}
      {/* Imagen real — solo carga cuando está en viewport */}
      {inView && src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)} // hide placeholder even on error
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}
