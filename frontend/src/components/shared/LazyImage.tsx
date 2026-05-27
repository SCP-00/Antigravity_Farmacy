// ══════════════════════════════════════════════════════════
//  LazyImage — Carga diferida de imágenes con placeholder
//  Usa IntersectionObserver con rootMargin para carga anticipada
// ══════════════════════════════════════════════════════════
import { useState, useRef, useEffect, type ImgHTMLAttributes } from 'react'

type LazyImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** Clases para el placeholder mientras carga */
  placeholderClassName?: string
  /** Root margin para IntersectionObserver (default: 200px) */
  rootMargin?: string
}

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
