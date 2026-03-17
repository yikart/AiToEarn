/**
 * 字符 n-gram 文本相似度工具
 * 基于字符 n-gram 余弦相似度，天然支持多语言
 */

function charNgrams(text: string, n: number): Map<string, number> {
  const freq = new Map<string, number>()
  const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase()
  for (let i = 0; i <= normalized.length - n; i++) {
    const gram = normalized.slice(i, i + n)
    freq.set(gram, (freq.get(gram) ?? 0) + 1)
  }
  return freq
}

function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>,
): number {
  let dot = 0
  let normA = 0
  let normB = 0

  for (const [key, val] of a) {
    normA += val * val
    const bVal = b.get(key)
    if (bVal !== undefined) {
      dot += val * bVal
    }
  }

  for (const val of b.values()) {
    normB += val * val
  }

  if (normA === 0 || normB === 0)
    return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function textSimilarity(a: string, b: string): number {
  if (!a && !b)
    return 1
  if (!a || !b)
    return 0
  if (a === b)
    return 1

  const bigram = cosineSimilarity(charNgrams(a, 2), charNgrams(b, 2))
  const trigram = cosineSimilarity(charNgrams(a, 3), charNgrams(b, 3))
  return bigram * 0.5 + trigram * 0.5
}

export function draftWorkSimilarity(
  draft: { title?: string, desc?: string },
  work: { title?: string, desc?: string },
): { score: number, titleScore: number, descScore: number } {
  const titleScore = textSimilarity(draft.title ?? '', work.title ?? '')
  const descScore = textSimilarity(draft.desc ?? '', work.desc ?? '')

  const hasTitle = !!(draft.title || work.title)
  const hasDesc = !!(draft.desc || work.desc)

  let score: number
  if (hasTitle && hasDesc) {
    score = titleScore * 0.3 + descScore * 0.7
  }
  else if (hasTitle) {
    score = titleScore
  }
  else if (hasDesc) {
    score = descScore
  }
  else {
    score = 1
  }

  return { score, titleScore, descScore }
}
