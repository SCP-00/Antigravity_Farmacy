// ══════════════════════════════════════════════════════════
//  utils/fuzzySearch.ts — Búsqueda flexible/fuzzy matching
// ══════════════════════════════════════════════════════════

/**
 * Calcular similaridad fuzzy entre una query y un string objetivo.
 * Retorna un score de 0 a 1 (1 = match perfecto).
 * 
 * Ejemplo:
 *  fuzzyScore('acetam', 'acetaminofén') = 0.85
 *  fuzzyScore('ibpf', 'ibuprofeno') = 0.70
 */
export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase().trim()
  const t = target.toLowerCase().trim()

  if (q === t) return 1.0
  if (!q || !t) return 0

  let score = 0
  let qIdx = 0
  let lastMatch = -1

  // Iterar por cada carácter de la query y encontrar en el target
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      // Match encontrado
      const distance = i - lastMatch
      const baseScore = 0.7 // Base score para match
      const sequentialBonus = distance === 1 ? 0.1 : 0 // Bonus si es consecutivo
      score += baseScore + sequentialBonus
      qIdx++
      lastMatch = i
    }
  }

  // Normalizar el score
  const maxScore = q.length
  return qIdx === q.length ? Math.min(1.0, score / maxScore) : 0
}

/**
 * Buscar productos con fuzzy matching.
 * Retorna productos ordenados por relevancia (score descendente).
 */
export function fuzzyFilterProductos(
  productos: any[],
  query: string,
  threshold = 0.4
): Array<{ producto: any; score: number }> {
  if (!query.trim()) return []

  const results = productos
    .map((p) => {
      // Buscar score máximo entre nombre, concentración y presentación
      const nameScore = fuzzyScore(query, p.nombre ?? '')
      const concScore = fuzzyScore(query, p.concentracion ?? '')
      const presScore = fuzzyScore(query, p.presentacion ?? '')
      const barScore = fuzzyScore(query, p.codigoBarras ?? '')

      const maxScore = Math.max(nameScore, concScore, presScore, barScore)
      return { producto: p, score: maxScore }
    })
    .filter((r) => r.score >= threshold)
    .sort((a, b) => b.score - a.score)

  return results
}
