import React, { useState } from 'react'
import { useSpeech } from '../context/SpeechContext.jsx'

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-toss-gray-200 rounded-2xl overflow-hidden mb-3">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-toss-gray-50 hover:bg-toss-gray-100 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-sm font-semibold text-toss-gray-800">{title}</span>
        <svg
          className={`w-4 h-4 text-toss-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 py-4">{children}</div>}
    </div>
  )
}

function ClosenessBar({ value }) {
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[11px] text-toss-gray-400 mb-1">
        <span>관계 거리감</span>
        <span className="font-semibold text-toss-blue">{value}/100</span>
      </div>
      <div className="h-1.5 bg-toss-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-toss-blue rounded-full transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export default function AnalysisSection({ result }) {
  const { t } = useSpeech()

  if (!result) {
    return (
      <div className="toss-card">
        <p className="toss-section-title">{t.analysisTitle}</p>
        <div className="text-center py-8">
          <div className="text-3xl mb-3">🔮</div>
          <p className="text-sm text-toss-gray-400">{t.analysisPlaceholder}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="toss-card">
      <p className="toss-section-title mb-4">{t.analysisTitle}</p>

      {/* Reply timing */}
      {result.replyTiming && result.replyTiming.suggestedDelay !== '미정' && (
        <div className="mb-4 p-4 bg-gradient-to-br from-toss-blue-light to-purple-50 rounded-2xl border border-toss-blue/20">
          <p className="text-xs font-semibold text-toss-blue uppercase tracking-wider mb-1">{t.timingTitle}</p>
          <p className="text-xl font-bold text-toss-gray-900">{result.replyTiming.suggestedDelay}</p>
          {result.replyTiming.reason && (
            <p className="text-sm text-toss-gray-600 mt-1.5 leading-relaxed">{result.replyTiming.reason}</p>
          )}
        </div>
      )}

      {/* Last them message */}
      {result.lastThemMessage && (
        <div className="mb-4 flex gap-3">
          <div className="w-8 h-8 rounded-full bg-toss-gray-200 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
            💬
          </div>
          <div>
            <p className="text-xs font-semibold text-toss-gray-500 mb-1">{t.lastThemLabel}</p>
            <p className="text-sm text-toss-gray-800 leading-relaxed bg-toss-gray-50 px-3 py-2 rounded-xl">
              {result.lastThemMessage}
            </p>
          </div>
        </div>
      )}

      {/* Reply suggestions */}
      {result.replySuggestions?.length > 0 && (
        <Section title={t.suggestionsTitle}>
          <div className="space-y-3">
            {result.replySuggestions.map((s, i) => (
              <div key={i} className="p-4 bg-white border border-toss-gray-200 rounded-xl hover:border-toss-blue/30 transition-colors">
                <div className="flex items-start gap-2 mb-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-toss-blue text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium text-toss-gray-900 leading-relaxed">{s.text}</p>
                </div>
                {typeof s.closenessAfter === 'number' && (
                  <ClosenessBar value={s.closenessAfter} />
                )}
                {s.reason && (
                  <p className="text-xs text-toss-gray-500 mt-2 leading-relaxed">
                    {t.reasonLabel}: {s.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Core brief */}
      {result.brief && (
        <Section title={t.coreTitle}>
          <p className="text-sm text-toss-gray-700 leading-relaxed whitespace-pre-wrap">{result.brief}</p>
        </Section>
      )}

      {/* Selection synthesis */}
      {result.selectionSynthesis && (
        <Section title={t.synthesisTitle} defaultOpen={false}>
          <p className="text-sm text-toss-gray-700 leading-relaxed whitespace-pre-wrap">{result.selectionSynthesis}</p>
        </Section>
      )}

      {/* Deep angles */}
      {result.deepAngles?.length > 0 && (
        <Section title={t.deepTitle} defaultOpen={false}>
          <div className="space-y-4">
            {result.deepAngles.map((a, i) => (
              <div key={i}>
                <h4 className="text-sm font-semibold text-toss-gray-800 mb-1.5">{a.title}</h4>
                <p className="text-sm text-toss-gray-600 leading-relaxed whitespace-pre-wrap">{a.body}</p>
                {i < result.deepAngles.length - 1 && (
                  <div className="mt-3 border-t border-toss-gray-100" />
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Relationship detail */}
      {result.relationshipDetail && (
        <Section title={t.relationDetailTitle} defaultOpen={false}>
          <p className="text-sm text-toss-gray-700 leading-relaxed whitespace-pre-wrap">{result.relationshipDetail}</p>
        </Section>
      )}
    </div>
  )
}
