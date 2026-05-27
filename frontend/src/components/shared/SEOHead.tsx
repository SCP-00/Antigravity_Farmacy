// ══════════════════════════════════════════════════════════
//  SEOHead — Meta tags dinámicos + Open Graph + Twitter Card
//  Uso: <SEOHead title="..." description="..." />
// ══════════════════════════════════════════════════════════
import { Helmet } from 'react-helmet-async'

interface SEOHeadProps {
  /** Título de la página (se le agrega " | Farmacy" automáticamente) */
  title?: string
  /** Meta description (máximo 160 caracteres) */
  description?: string
  /** Ruta canónica relativa (ej: "/productos", se completa con siteUrl) */
  path?: string
  /** URL de imagen para Open Graph / Twitter Card */
  image?: string
  /** Tipo de contenido OG (por defecto "website") */
  type?: string
  /** Publicar como artículo (para blog/posts) */
  publishedTime?: string
  /** No indexar esta página */
  noIndex?: boolean
  /** Robots adicionales (ej: "noarchive, nosnippet") */
  robotsExtra?: string
}

const SITE_NAME = 'Farmacy'
const SITE_URL = 'https://farmacy.co'
const DEFAULT_DESCRIPTION =
  'Farmacy — Tu farmacia digital de confianza en Pereira. Explora medicamentos, cuidado personal y vitaminas con inventario en tiempo real y método FEFO.'
const DEFAULT_IMAGE = 'https://farmacy.co/og-default.jpg'

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  image = DEFAULT_IMAGE,
  type = 'website',
  publishedTime,
  noIndex,
  robotsExtra,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const canonical = path ? `${SITE_URL}${path}` : SITE_URL
  const descriptionTrimmed = description.slice(0, 160)

  const robotsContent = [
    'index, follow',
    robotsExtra,
    noIndex && 'noindex',
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <Helmet>
      {/* ── Básicos ─────────────────────────────────── */}
      <title>{fullTitle}</title>
      <meta name="description" content={descriptionTrimmed} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={robotsContent} />

      {/* ── Open Graph ──────────────────────────────── */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={descriptionTrimmed} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="es_CO" />

      {/* ── Twitter Card ────────────────────────────── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={descriptionTrimmed} />
      <meta name="twitter:image" content={image} />

      {/* ── Artículo (opcional) ─────────────────────── */}
      {publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}

      {/* ── JSON-LD Schema.org ──────────────────────── */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': type === 'article' ? 'Article' : 'WebSite',
          name: fullTitle,
          description: descriptionTrimmed,
          url: canonical,
          ...(type === 'article' && publishedTime
            ? { datePublished: publishedTime }
            : {}),
          ...(type === 'website'
            ? {
                potentialAction: {
                  '@type': 'SearchAction',
                  target: {
                    '@type': 'EntryPoint',
                    urlTemplate: `${SITE_URL}/productos?q={search_term_string}`,
                  },
                  'query-input': 'required name=search_term_string',
                },
              }
            : {}),
        })}
      </script>
    </Helmet>
  )
}
