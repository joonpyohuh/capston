import React, { useState, useCallback } from 'react'
import { SpeechProvider } from './context/SpeechContext.jsx'
import Header from './components/Header.jsx'
import InputSection from './components/InputSection.jsx'
import PurposeSection from './components/PurposeSection.jsx'
import UserSection from './components/UserSection.jsx'
import MetricsSection from './components/MetricsSection.jsx'
import SummarySection from './components/SummarySection.jsx'
import AnalysisSection from './components/AnalysisSection.jsx'
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

export default function App() {
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

  const [analyzeStatus, setAnalyzeStatus] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)

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

  const handleAnalyze = async (t) => {
    const { me, them } = getEffectiveNames()
    if (!relationType) { setAnalyzeStatus(t.analyzeErrorRel); return }
    if (!me || !them) { setAnalyzeStatus(t.analyzeErrorNames); return }
    const dialogue = buildCombinedText()
    if (dialogue.length < 30 && ctx.trim().length < 20) {
      setAnalyzeStatus(t.analyzeErrorData); return
    }
    setAnalyzing(true)
    setAnalyzeStatus(t.analyzing)
    try {
      const meVoiceExcerpt = buildMeVoiceExcerpt(dialogue, me)
      const body = JSON.stringify({
        me,
        them,
        relationshipType: relationType === 'same' ? '동성' : '이성',
        userPurpose: purpose,
        situation: ctx.trim(),
        dialogue: dialogue.slice(0, 12000),
        meVoiceExcerpt,
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
      setAnalyzeStatus(t.analyzeSuccess)
    } catch (e) {
      setAnalyzeStatus(e?.message || '분석에 실패했습니다. OPENAI_API_KEY를 확인해 주세요.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <SpeechProvider>
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
        </main>
      </div>
    </SpeechProvider>
  )
}
