import React from 'react'
import { useSpeech } from '../context/SpeechContext.jsx'

export default function RelationshipViz({ values, me, them }) {
  const { t } = useSpeech()
  const affinity = values.affinity || 0
  const closeness = values.closeness || 0
  const burden = values.burden || 0
  const distanceWill = values.distanceWill || 0

  const warmth = Math.round((affinity * 0.55) + (closeness * 0.45))
  const relationDistance = Math.round((100 - closeness) * 0.55 + distanceWill * 0.45)

  const left = 18
  const right = 82
  const span = right - left
  // 거리(relationDistance)가 클수록 두 노드가 양 끝에 위치 (시각적으로 멀어짐)
  // 거리(relationDistance)가 작을수록 두 노드가 가운데로 모임 (시각적으로 가까워짐)
  const proximity = (100 - relationDistance) / 100
  const mePos = left + proximity * (span * 0.4)
  const themPos = right - proximity * (span * 0.4)

  const meFace = burden >= 70 ? '😩' : distanceWill >= 70 ? '🙂' : warmth >= 70 ? '😊' : '😶'
  const themFace = warmth >= 75 ? '😊' : warmth >= 45 ? '🙂' : '😐'
  const toneKey = warmth >= 70 ? 'high' : warmth >= 45 ? 'mid' : 'low'

  return (
    <div className="mt-5 pt-4 border-t border-toss-gray-100">
      <div className="relative h-24 bg-toss-gray-50 rounded-2xl overflow-hidden">
        {/* Link bar */}
        <div
          className="absolute top-[46px] h-1 rounded-full transition-all duration-300"
          style={{
            left: `${mePos}%`,
            width: `${Math.max(8, themPos - mePos)}%`,
            background: `linear-gradient(90deg, rgba(49,130,246,0.3), rgba(255,166,204,0.5))`,
            opacity: 0.4 + (warmth / 100) * 0.55,
          }}
        />
        {/* Me node */}
        <div
          className="absolute flex flex-col items-center gap-1 -translate-x-1/2 transition-all duration-300"
          style={{ left: `${mePos}%`, top: '12px' }}
        >
          <div className="w-10 h-10 rounded-full bg-white border border-toss-gray-200 flex items-center justify-center text-lg shadow-sm">
            {meFace}
          </div>
          <span className="text-[11px] text-toss-gray-500 max-w-[70px] text-center truncate">
            {me || '나'}
          </span>
        </div>
        {/* Them node */}
        <div
          className="absolute flex flex-col items-center gap-1 -translate-x-1/2 transition-all duration-300"
          style={{ left: `${themPos}%`, top: '12px' }}
        >
          <div className="w-10 h-10 rounded-full bg-white border border-toss-gray-200 flex items-center justify-center text-lg shadow-sm">
            {themFace}
          </div>
          <span className="text-[11px] text-toss-gray-500 max-w-[70px] text-center truncate">
            {them || '상대'}
          </span>
        </div>
      </div>

      <div className="flex justify-between mt-2.5 text-xs text-toss-gray-500">
        <span>{t.distanceLabel}: {Math.round(relationDistance)}/100</span>
        <span>{t.toneLabel}: {t.warmth[toneKey]} ({t.burdenLabel} {Math.round(burden)}/100)</span>
      </div>
    </div>
  )
}
