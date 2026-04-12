import React, { useState, useCallback, useEffect } from 'react'
import { SpeechProvider, useSpeech } from './context/SpeechContext.jsx'
import Header from './components/Header.jsx'
import InputSection from './components/InputSection.jsx'
import PurposeSection from './components/PurposeSection.jsx'
import UserSection from './components/UserSection.jsx'
import MetricsSection from './components/MetricsSection.jsx'
import SummarySection from './components/SummarySection.jsx'
import AnalysisSection from './components/AnalysisSection.jsx'
import InstructionSection from './components/InstructionSection.jsx'
import HistorySection from './components/HistorySection.jsx'
import {
  extractParticipants,
  buildMeVoiceExcerpt,
  clamp,
} from './utils/textUtils.js'

const METRICS = [
  { id: 'affinity', name: '호감·신뢰 (관계도)', desc: '상대에 대한 긍정적 친밀·신뢰 정도' },
  { id: 'closeness', name: '대화 친밀도', desc: '대화 빈도·깊이로 본 가까움' },
  { id: 'burden', name: '부담·소모', desc: '답장·관계 유지에 느끼는 피로' },
  { id: 'distanceWill', name: '거리두기 의지', desc: '지금보다 더 거리를 두려는 강도' },
]

const LS_PROFILES = 'distanceReplyProfiles_v1'

function loadProfiles() {
  try {
    const j = localStorage.getItem(LS_PROFILES)
    const a = j ? JSON.parse(j) : []
    return Array.isArray(a) ? a : []
  } catch {
    return []
  }
}

// SpeechProvider 안에서 렌더되어 useSpeech()에 접근 가능
function AppContent() {
  const { t, mode } = useSpeech()

  const [uploadedFiles, setUploadedFiles] = useState([])
  const [smsPaste, setSmsPaste] = useState('')
  const [rawSmsSingle, setRawSmsSingle] = useState('')
  const [ctx, setCtx] = useState('')
  const [participants, setParticipants] = useState([])
  const [purpose, setPurpose] = useState('distance')
  const [userMode, setUserMode] = useState('direct')
  const [directMe, setDirectMe] = useState('')
  const [directThem, setDirectThem] = useState('')
  const [relationType, setRelationType] = useState('')
  const [savedProfiles, setSavedProfiles] = useState(loadProfiles)

  const [metricValues, setMetricValues] = useState(
    Object.fromEntries(METRICS.map(m => [m.id, 50]))
  )
  const [metricLocked, setMetricLocked] = useState(
    Object.fromEntries(METRICS.map(m => [m.id, false]))
  )
  const [metricAiAllow, setMetricAiAllow] = useState(
    Object.fromEntries(METRICS.map(m => [m.id, true]))
  )

  const [userInstruction, setUserInstruction] = useState('')

  const [analyzeStatus, setAnalyzeStatus] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)

  const [historyRecords, setHistoryRecords] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const buildCombinedText = useCallback(() => {
    const parts = []
    for (const f of uploadedFiles) { if (f.text) parts.push(f.text) }
    if (rawSmsSingle) parts.push(rawSmsSingle)
    if (smsPaste) parts.push(smsPaste)
    return parts.join('\n\n---\n\n')
  }, [uploadedFiles, rawSmsSingle, smsPaste])

  const refreshParticipants = useCallback((files, single, paste) => {
    const parts = []
    for (const f of files) { if (f.text) parts.push(f.text) }
    if (single) parts.push(single)
    if (paste) parts.push(paste)
    const combined = parts.join('\n\n---\n\n')
    setParticipants(extractParticipants(combined))
  }, [])

  const handleMetricChange = useCallback((id, val) => {
    if (metricLocked[id]) return
    setMetricValues(prev => ({ ...prev, [id]: clamp(val) }))
  }, [metricLocked])

  const applyAiMetric = useCallback((id, val) => {
    if (!metricAiAllow[id]) return
    setMetricValues(prev => ({ ...prev, [id]: clamp(val) }))
  }, [metricAiAllow])

  const getEffectiveNames = () => {
    if (userMode === 'direct') {
      return { me: directMe.trim(), them: directThem.trim() }
    }
    const sel = savedProfiles.find(p => p._selected)
    if (sel) return { me: sel.me, them: sel.them }
    return { me: '', them: '' }
  }

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const r = await fetch('/api/history?limit=50')
      if (r.ok) {
        const data = await r.json()
        setHistoryRecords(data.records || [])
      }
    } catch {
      // 로컬 서버가 아닌 환경(Vercel 등)에서는 히스토리 없음
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleDeleteHistory = useCallback(async (id) => {
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' })
      setHistoryRecords(prev => prev.filter(r => r.id !== id))
    } catch { /* ignore */ }
  }, [])

  const handleSelectReply = useCallback(async (id, replyIndex) => {
    try {
      await fetch(`/api/history/${id}/select-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyIndex }),
      })
      setHistoryRecords(prev =>
        prev.map(r => r.id === id ? { ...r, selectedReplyIndex: replyIndex } : r)
      )
    } catch { /* ignore */ }
  }, [])

  const handleAnalyze = async (tParam) => {
    const lang = tParam || t
    const { me, them } = getEffectiveNames()
    if (!relationType) { setAnalyzeStatus(lang.analyzeErrorRel); return }
    if (!me || !them) { setAnalyzeStatus(lang.analyzeErrorNames); return }
    const dialogue = buildCombinedText()
    if (dialogue.length < 30 && ctx.trim().length < 20) {
      setAnalyzeStatus(lang.analyzeErrorData); return
    }
    setAnalyzing(true)
    setAnalyzeStatus(lang.analyzing)
    try {
      const meVoiceExcerpt = buildMeVoiceExcerpt(dialogue, me)
      // mode: 'formal' → 존댓말 답장 / 'informal' → 반말 답장
      const body = JSON.stringify({
        me,
        them,
        relationshipType: relationType === 'same' ? '동성' : '이성',
        userPurpose: purpose,
        situation: ctx.trim(),
        dialogue: dialogue.slice(0, 12000),
        meVoiceExcerpt,
        userInstruction: userInstruction.trim(),
        replyTone: mode,
        currentMetrics: { ...metricValues },
        userSelections: {
          userMode,
          userPurpose: purpose,
          metrics: METRICS.map(m => ({
            id: m.id,
            nameKo: m.name,
            value: metricValues[m.id],
            directLockManual: metricLocked[m.id],
            aiResultMayAdjust: metricAiAllow[m.id],
          })),
        },
      })
      const r = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      let data
      try { data = await r.json() } catch { throw new Error('서버 응답을 읽을 수 없습니다.') }
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`)

      const m = data.metrics || {}
      for (const id of ['affinity', 'closeness', 'burden', 'distanceWill']) {
        if (typeof m[id] === 'number') applyAiMetric(id, m[id])
      }
      setAnalysisResult(data)
      setAnalyzeStatus(lang.analyzeSuccess)

      // 분석 완료 후 히스토리 갱신
      if (data.recordId) {
        loadHistory()
      }
    } catch (e) {
      setAnalyzeStatus(e?.message || '분석에 실패했습니다. OPENAI_API_KEY를 확인해 주세요.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-toss-gray-100">
      <Header />
      <main className="max-w-2xl mx-auto px-4 pb-20 pt-4">
        <InputSection
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          smsPaste={smsPaste}
          setSmsPaste={setSmsPaste}
          rawSmsSingle={rawSmsSingle}
          setRawSmsSingle={setRawSmsSingle}
          ctx={ctx}
          setCtx={setCtx}
          participants={participants}
          refreshParticipants={refreshParticipants}
        />
        <PurposeSection purpose={purpose} setPurpose={setPurpose} />
        <InstructionSection
          instruction={userInstruction}
          setInstruction={setUserInstruction}
        />
        <UserSection
          userMode={userMode}
          setUserMode={setUserMode}
          directMe={directMe}
          setDirectMe={setDirectMe}
          directThem={directThem}
          setDirectThem={setDirectThem}
          relationType={relationType}
          setRelationType={setRelationType}
          savedProfiles={savedProfiles}
          setSavedProfiles={setSavedProfiles}
          participants={participants}
          analyzing={analyzing}
          analyzeStatus={analyzeStatus}
          onAnalyze={handleAnalyze}
        />
        <MetricsSection
          metrics={METRICS}
          values={metricValues}
          locked={metricLocked}
          aiAllow={metricAiAllow}
          onChange={handleMetricChange}
          onLockChange={(id, v) => setMetricLocked(prev => ({ ...prev, [id]: v }))}
          onAiAllowChange={(id, v) => setMetricAiAllow(prev => ({ ...prev, [id]: v }))}
          directMe={directMe}
          directThem={directThem}
          userMode={userMode}
          savedProfiles={savedProfiles}
        />
        <SummarySection
          metricValues={metricValues}
          metricLocked={metricLocked}
          metricAiAllow={metricAiAllow}
          metrics={METRICS}
          userMode={userMode}
          purpose={purpose}
          relationType={relationType}
          directMe={directMe}
          directThem={directThem}
          savedProfiles={savedProfiles}
          uploadedFiles={uploadedFiles}
          ctx={ctx}
          analysisResult={analysisResult}
          buildCombinedText={buildCombinedText}
        />
        <AnalysisSection result={analysisResult} />

        {/* 히스토리 토글 버튼 */}
        <div className="mt-4">
          <button
            onClick={() => setShowHistory(h => !h)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-toss-gray-200 rounded-2xl text-sm font-semibold text-toss-gray-700 hover:bg-toss-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span>🗂️</span>
              분석 히스토리
              {historyRecords.length > 0 && (
                <span className="text-xs font-normal text-toss-gray-400">({historyRecords.length}건)</span>
              )}
            </span>
            <svg
              className={`w-4 h-4 text-toss-gray-400 transition-transform duration-200 ${showHistory ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {showHistory && (
          <HistorySection
            records={historyRecords}
            onDelete={handleDeleteHistory}
            onSelectReply={handleSelectReply}
            loading={historyLoading}
          />
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <SpeechProvider>
      <AppContent />
    </SpeechProvider>
  )
}
