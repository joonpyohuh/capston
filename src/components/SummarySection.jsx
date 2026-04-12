import React, { useMemo } from 'react'
import { useSpeech } from '../context/SpeechContext.jsx'

const PURPOSE_LABEL = { distance: '거리두기', gauge: '관계 파악', closer: '가까워지기' }
const REL_LABEL = { same: '동성 관계', opposite: '이성 관계' }

export default function SummarySection({
  metricValues, metricLocked, metricAiAllow, metrics,
  userMode, purpose, relationType, directMe, directThem,
  savedProfiles, uploadedFiles, ctx, analysisResult, buildCombinedText,
}) {
  const { t } = useSpeech()

  const me = userMode === 'direct' ? directMe : (savedProfiles.find(p => p._selected)?.me || '')
  const them = userMode === 'direct' ? directThem : (savedProfiles.find(p => p._selected)?.them || '')

  const summary = useMemo(() => {
    const combined = buildCombinedText()
    const lines = [
      `[지정 방식] ${userMode === 'direct' ? '직접 입력' : '저장 프로필'}`,
      `[사용 목적] ${PURPOSE_LABEL[purpose] || purpose}`,
      `[관계 유형] ${REL_LABEL[relationType] || '(미선택)'}`,
      `[나] ${me || '(미설정)'}`,
      `[상대] ${them || '(미설정)'}`,
      '',
      '--- 관계 지표 (0–100) ---',
      ...metrics.map(m => {
        const man = metricLocked[m.id] ? '직접잠금' : '직접조작가능'
        const ai = metricAiAllow[m.id] ? 'AI반영허용' : 'AI반영끄기'
        return `${m.name}: ${metricValues[m.id]} (${man}, ${ai})`
      }),
      '',
      '--- 상황 설명 ---',
      ctx.trim() || '(없음)',
      '',
      '--- 업로드 파일 ---',
      uploadedFiles.length > 0
        ? uploadedFiles.map(f => `• ${f.name} (${f.text.length}자)`).join('\n')
        : '(없음)',
      `전체 대화 텍스트: ${combined.length}자`,
    ]

    if (analysisResult) {
      lines.push('', '--- AI 분석 요약 (최근) ---', analysisResult.brief || '(없음)')
      if (analysisResult.replyTiming) {
        lines.push('', '--- 답장 타이밍 (AI) ---', `${analysisResult.replyTiming.suggestedDelay} — ${analysisResult.replyTiming.reason || ''}`)
      }
    }

    return lines.join('\n')
  }, [metricValues, metricLocked, metricAiAllow, metrics, userMode, purpose, relationType, directMe, directThem, savedProfiles, uploadedFiles, ctx, analysisResult, buildCombinedText, me, them])

  return (
    <div className="toss-card">
      <p className="toss-section-title">{t.summaryTitle}</p>
      <pre className="text-xs text-toss-gray-600 bg-toss-gray-50 rounded-xl p-4 whitespace-pre-wrap leading-relaxed font-sans overflow-x-auto max-h-64 overflow-y-auto">
        {summary}
      </pre>
    </div>
  )
}
