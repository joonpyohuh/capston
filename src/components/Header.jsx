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
          title="AI가 추천하는 답장 말투를 바꿉니다"
        >
          <span className="text-[10px] text-toss-gray-400">답장 말투</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-lg ${
            mode === 'formal'
              ? 'bg-toss-blue text-white'
              : 'bg-orange-400 text-white'
          }`}>
            {mode === 'formal' ? '존댓말' : '반말'}
          </span>
          <svg className="w-3.5 h-3.5 text-toss-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
      </div>
    </header>
  )
}
