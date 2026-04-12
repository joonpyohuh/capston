import React from 'react'
import { useSpeech } from '../context/SpeechContext.jsx'

export default function Header() {
  const { t, mode, toggle } = useSpeech()

  return (
    <header className="bg-white border-b border-toss-gray-200 sticky top-0 z-40">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-toss-blue rounded-xl flex items-center justify-center">
            <span className="text-white text-sm font-bold">DR</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-toss-gray-900 leading-none">DistanceReply</h1>
            <p className="text-[11px] text-toss-gray-500 mt-0.5">관계 맥락 보조</p>
          </div>
        </div>

        <button
          onClick={toggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-toss-gray-100 hover:bg-toss-gray-200 transition-colors duration-150"
        >
          <span className="text-xs font-semibold text-toss-gray-700">
            {mode === 'formal' ? '존댓말' : '반말'}
          </span>
          <span className="text-toss-gray-400">|</span>
          <span className="text-xs text-toss-blue font-medium">
            {t.altModeLabel}
          </span>
        </button>
      </div>
    </header>
  )
}
