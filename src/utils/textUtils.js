export function isLikelyDateOrTime(s) {
  const t = String(s || '').trim()
  if (t.length === 0) return true
  if (t.length <= 2 && /^\d+$/.test(t)) return true
  if (/^\d{4}\s*년/.test(t)) return true
  if (/\d{1,2}\s*월\s*\d{1,2}\s*일/.test(t)) return true
  if (/오전|오후/.test(t) && /\d/.test(t)) return true
  if (/^\d{4}[.\-/]\s*\d{1,2}[.\-/]\s*\d{1,2}/.test(t)) return true
  if (/^\d{1,2}:\d{2}/.test(t)) return true
  if (/^\d{4}\.\s*\d{1,2}\.\s*\d{1,2}/.test(t)) return true
  if (/월\s*\d{1,2}\s*일/.test(t)) return true
  if (/^[월화수목금토일]/.test(t)) return true
  if (/^[\d\s.\-:\/월오전후분초]+$/u.test(t)) return true
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return true
  return false
}

function extractNamesFromLines(lines, s) {
  const reSms = /^(?:From|To|발신|수신)\s*[:：]\s*([^\n]+)/i
  for (const line of lines) {
    // 카카오톡 PC: "오전 HH:MM, 이름 : 메시지"
    const sep = line.indexOf(' : ')
    if (sep > 0) {
      const left = line.slice(0, sep)
      const c = left.lastIndexOf(',')
      if (c >= 0) {
        const name = left.slice(c + 1).trim()
        if (name && !isLikelyDateOrTime(name)) s.add(name.slice(0, 40))
      }
    }
    const m = line.match(reSms)
    if (m) {
      const n = m[1].trim().slice(0, 40)
      if (!isLikelyDateOrTime(n)) s.add(n)
    }
    // 카카오톡 모바일: "[이름] [오전...]" 또는 "[이름] 메시지"
    for (const bm of line.matchAll(/\[([^\]\n]{1,40})\]/g)) {
      const n = bm[1].trim()
      if (!isLikelyDateOrTime(n)) s.add(n)
    }
  }
}

export function extractParticipants(text) {
  const s = new Set()
  const allLines = text.split(/\r?\n/)
  const total = allLines.length

  // 최근 대화 우선: 마지막 6000줄 + 앞 500줄(헤더·초반) 모두 스캔
  const tailLines = total > 6000 ? allLines.slice(-6000) : allLines
  const headLines = total > 6000 ? allLines.slice(0, 500) : []

  extractNamesFromLines(tailLines, s)
  extractNamesFromLines(headLines, s)

  return Array.from(s)
    .filter(x => x.length > 0 && x.length <= 40 && !isLikelyDateOrTime(x))
    .slice(0, 32)
}

export function extractMeUtterances(dialogue, meLabel) {
  const me = (meLabel || '').trim()
  if (!me) return []
  const lines = dialogue.split(/\r?\n/)
  const out = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const sep = trimmed.indexOf(' : ')
    if (sep > 0) {
      const left = trimmed.slice(0, sep)
      const c = left.lastIndexOf(',')
      if (c >= 0) {
        const name = left.slice(c + 1).trim()
        if (!isLikelyDateOrTime(name) && name === me) {
          const body = trimmed.slice(sep + 3).trim()
          if (body) out.push(body)
        }
      }
      continue
    }
    const br = trimmed.match(/^\[([^\]]+)\]\s*(.+)$/)
    if (br) {
      const name = br[1].trim()
      if (!isLikelyDateOrTime(name) && name === me) out.push(br[2].trim())
      continue
    }
    const col = trimmed.match(/^([^:\n]{1,40})\s*:\s*(.+)$/)
    if (col && !/^https?:/i.test(trimmed)) {
      const name = col[1].trim()
      if (!isLikelyDateOrTime(name) && name === me) out.push(col[2].trim())
    }
  }
  return out
}

export function buildMeVoiceExcerpt(dialogue, meLabel) {
  // 전체 파일을 순회하지 않고 최근 60000자에서만 내 발화를 추출 (성능 + 최신 말투 반영)
  const recent = dialogue.length > 60000 ? dialogue.slice(-60000) : dialogue
  const msgs = extractMeUtterances(recent, meLabel)
  let blob = msgs.join('\n')
  if (blob.length > 8000) blob = blob.slice(-8000)
  return blob
}

export function readFileAsText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result || ''))
    r.onerror = () => rej(r.error)
    r.readAsText(file, 'UTF-8')
  })
}

export function clamp(n) {
  return Math.max(0, Math.min(100, n))
}
