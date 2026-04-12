import React, { useState } from 'react'
import { useSpeech } from '../context/SpeechContext.jsx'

const PURPOSE_LABELS = {
  distance: '거리두기',
  gauge: '관계 파악',
  closer: '가까워지기',
}

const PURPOSE_COLORS = {
  distance: 'bg-blue-50 text-blue-600 border-blue-200',
  gauge: 'bg-purple-50 text-purple-600 border-purple-200',
  closer: 'bg-green-50 text-green-600 border-green-200',
}

function MetricBar({ label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-toss-gray-500 w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-toss-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-toss-blue rounded-full"
          style={{ width: `${value ?? 50}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-toss-blue w-7 text-right">{value ?? 50}</span>
    </div>
  )
}

function HistoryCard({ record, onDelete, onSelectReply }) {
  const { t } = useSpeech()
  const [expanded, setExpanded] = useState(false)

  const dateStr = record.createdAt
    ? new Date(record.createdAt).toLocaleString('ko-KR', {
        month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    : ''

  const purposeColor = PURPOSE_COLORS[record.purpose] || PURPOSE_COLORS.distance
  const purposeLabel = PURPOSE_LABELS[record.purpose] || record.purpose

  const handleDelete = () => {
    if (window.confirm(t.historyDeleteConfirm)) {
      onDelete(record.id)
    }
  }

  return (
    <div className="border border-toss-gray-200 rounded-2xl overflow-hidden bg-white">
      {/* 헤더 */}
      <div className="flex items-start justify-between px-4 py-3 bg-toss-gray-50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-toss-gray-900">
              {record.me || '나'} → {record.them || '상대'}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${purposeColor}`}>
              {purposeLabel}
            </span>
          </div>
          <p className="text-[11px] text-toss-gray-400 mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-toss-blue hover:underline"
          >
            {expanded ? t.historyCollapse : t.historyExpand}
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-toss-gray-400 hover:text-red-400 transition-colors"
          >
            {t.historyDelete}
          </button>
        </div>
      </div>

      {/* 간단 요약 (항상 표시) */}
      <div className="px-4 py-3 space-y-2">
        {/* 지표 */}
        <div className="space-y-1.5">
          <MetricBar label="호감·친밀" value={record.metrics?.affinity} />
          <MetricBar label="대화 친밀도" value={record.metrics?.closeness} />
          <MetricBar label="부담·소모" value={record.metrics?.burden} />
          <MetricBar label="거리두기 의지" value={record.metrics?.distanceWill} />
        </div>

        {/* 핵심 요약 */}
        {record.brief && (
          <p className="text-xs text-toss-gray-600 leading-relaxed border-t border-toss-gray-100 pt-2 mt-2 line-clamp-3">
            {record.brief}
          </p>
        )}
      </div>

      {/* 펼쳤을 때 상세 */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-toss-gray-100">

          {/* 지시사항 */}
          {record.userInstruction && (
            <div className="pt-3">
              <p className="text-xs font-semibold text-toss-gray-500 mb-1">{t.historyInstructionLabel}</p>
              <p className="text-xs text-toss-blue bg-toss-blue-light px-3 py-2 rounded-xl leading-relaxed">
                {record.userInstruction}
              </p>
            </div>
          )}

          {/* 답장 타이밍 */}
          {record.replyTiming?.suggestedDelay && record.replyTiming.suggestedDelay !== '미정' && (
            <div>
              <p className="text-xs font-semibold text-toss-gray-500 mb-1">답장 타이밍</p>
              <p className="text-sm font-bold text-toss-gray-900">{record.replyTiming.suggestedDelay}</p>
              {record.replyTiming.reason && (
                <p className="text-xs text-toss-gray-500 mt-1 leading-relaxed">{record.replyTiming.reason}</p>
              )}
            </div>
          )}

          {/* 추천 답장 */}
          {record.replySuggestions?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-toss-gray-500 mb-2">{t.historyReplyLabel}</p>
              <div className="space-y-2">
                {record.replySuggestions.map((s, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                      record.selectedReplyIndex === i
                        ? 'border-toss-blue bg-toss-blue-light'
                        : 'border-toss-gray-200 bg-white hover:border-toss-blue/40'
                    }`}
                    onClick={() => onSelectReply(record.id, i)}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                        record.selectedReplyIndex === i
                          ? 'bg-toss-blue text-white'
                          : 'bg-toss-gray-200 text-toss-gray-600'
                      }`}>
                        {i + 1}
                      </span>
                      <p className="text-xs font-medium text-toss-gray-900 leading-relaxed">{s.text}</p>
                    </div>
                    {s.reason && (
                      <p className="text-[11px] text-toss-gray-500 mt-1.5 ml-7 leading-relaxed">{s.reason}</p>
                    )}
                    {record.selectedReplyIndex === i && (
                      <p className="text-[11px] text-toss-blue font-semibold mt-1.5 ml-7">
                        ✓ {t.historySelectedReply}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 전략 (deepAngles) */}
          {record.deepAngles?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-toss-gray-500 mb-2">{t.historyStrategyLabel}</p>
              <div className="space-y-2">
                {record.deepAngles.map((a, i) => (
                  <div key={i} className="p-3 bg-toss-gray-50 rounded-xl">
                    <p className="text-xs font-semibold text-toss-gray-800 mb-1">{a.title}</p>
                    <p className="text-[11px] text-toss-gray-600 leading-relaxed line-clamp-4">{a.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 상황 설명 */}
          {record.situation && (
            <div>
              <p className="text-xs font-semibold text-toss-gray-500 mb-1">상황 설명</p>
              <p className="text-xs text-toss-gray-600 leading-relaxed bg-toss-gray-50 px-3 py-2 rounded-xl">
                {record.situation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function HistorySection({ records, onDelete, onSelectReply, loading }) {
  const { t } = useSpeech()

  if (loading) {
    return (
      <div className="toss-card">
        <p className="toss-section-title">{t.historyTitle}</p>
        <div className="text-center py-8">
          <div className="inline-block w-6 h-6 border-2 border-toss-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="toss-card">
      <div className="flex items-center justify-between mb-4">
        <p className="toss-section-title mb-0">{t.historyTitle}</p>
        {records.length > 0 && (
          <span className="text-xs text-toss-gray-400">{records.length}건</span>
        )}
      </div>

      {records.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-3">🗂️</div>
          <p className="text-sm text-toss-gray-400">{t.historyEmpty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(record => (
            <HistoryCard
              key={record.id}
              record={record}
              onDelete={onDelete}
              onSelectReply={onSelectReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}
