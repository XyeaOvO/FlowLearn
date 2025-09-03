import type { Word } from '../../../shared/types'

export type VocabFilter = {
  query: string
  status: 'all' | Word['reviewStatus']
  from?: string
  to?: string
  domain?: string
  requireExample?: boolean
  requirePhonetic?: boolean
  useRegex?: boolean
  regex?: string
  showDeleted?: boolean
}

export function filterWords(words: Word[], f: VocabFilter): Word[] {
  const q = (f.query || '').trim().toLowerCase()
  let re: RegExp | null = null
  if (f.useRegex && (f.regex || '').trim()) {
    try { re = new RegExp((f.regex || '').trim(), 'i') } catch { re = null }
  }
  const fromTs = f.from ? new Date(f.from + 'T00:00:00').getTime() : null
  const toTs = f.to ? new Date(f.to + 'T23:59:59').getTime() : null
  return words.filter(w => {
    const isDeleted = !!(w as Word & { deletedAt?: number }).deletedAt
    if (f.showDeleted) {
      if (!isDeleted) return false
    } else {
      if (isDeleted) return false
    }
    const fields = [w.term, w.definition, w.example, w.phonetic]
    const okQuery = re
      ? (re.test(fields.join('\n')))
      : (!q || fields.some(val => (val || '').toLowerCase().includes(q)))
    const okStatus = f.status === 'all' || w.reviewStatus === f.status
    const okDate = (!fromTs || w.addedAt >= fromTs) && (!toTs || w.addedAt <= toTs)
    const okDomain = !f.domain || f.domain === 'all' || (w.domain || '').trim() === f.domain
    const okExample = !f.requireExample || !!(w.example && w.example.trim())
    const okPhonetic = !f.requirePhonetic || !!(w.phonetic && w.phonetic.trim())
    return okQuery && okStatus && okDate && okDomain && okExample && okPhonetic
  })
}


