import React from 'react'
import { useSpeech } from '../context/SpeechContext.jsx'

const PURPOSES = [
  { id: 'distance', icon: '🌊', titleKey: 'purposeDistanceTitle', descKey: 'purposeDistanceDesc' },
  { id: 'gauge', icon: '🔍', titleKey: 'purposeGaugeTitle', descKey: 'purposeGaugeDesc' },
  { id: 'closer', icon: '🌱', titleKey: 'purposeCloserTitle', descKey: 'purposeCloserDesc' },
]

export default function PurposeSection({ purpose, setPurpose }) {
  const { t } = useSpeech()

  return (
    <div className="toss-card">
      <p className="toss-section-title">{t.purposeTitle}</p>
      <p className="toss-hint mb-4">{t.purposeHint}</p>

      <div className="grid grid-cols-3 gap-3">
        {PURPOSES.map(p => {
          const isSelected = purpose === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPurpose(p.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-150 text-left ${
                isSelected
                  ? 'border-toss-blue bg-toss-blue-light'
                  : 'border-toss-gray-200 bg-white hover:border-toss-gray-300'
              }`}
            >
              <span className="text-2xl">{p.icon}</span>
              <span className={`text-sm font-semibold ${isSelected ? 'text-toss-blue' : 'text-toss-gray-800'}`}>
                {t[p.titleKey]}
              </span>
              <span className="text-[11px] text-toss-gray-500 text-center leading-relaxed">
                {t[p.descKey]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
