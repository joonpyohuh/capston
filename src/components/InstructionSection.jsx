import React from 'react'
import { useSpeech } from '../context/SpeechContext.jsx'

export default function InstructionSection({ instruction, setInstruction }) {
  const { t } = useSpeech()

  const handlePreset = (preset) => {
    setInstruction(preset)
  }

  const handleClear = () => {
    setInstruction('')
  }

  return (
    <div className="toss-card">
      <div className="flex items-center justify-between mb-3">
        <p className="toss-section-title mb-0">{t.instructionTitle}</p>
        {instruction && (
          <button
            onClick={handleClear}
            className="text-xs text-toss-gray-400 hover:text-red-400 transition-colors"
          >
            초기화
          </button>
        )}
      </div>

      {/* 프리셋 버튼 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {t.instructionPresets.map((preset, i) => (
          <button
            key={i}
            onClick={() => handlePreset(preset)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-150 text-left leading-relaxed ${
              instruction === preset
                ? 'bg-toss-blue text-white border-toss-blue font-medium'
                : 'bg-white text-toss-gray-600 border-toss-gray-200 hover:border-toss-blue hover:text-toss-blue'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* 직접 입력 */}
      <div>
        <label className="toss-label">{t.instructionLabel}</label>
        <textarea
          className="toss-textarea h-24"
          placeholder={t.instructionPh}
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          maxLength={500}
        />
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${instruction.length > 450 ? 'text-orange-400' : 'text-toss-gray-400'}`}>
            {instruction.length}/500
          </span>
        </div>
      </div>

      {instruction && (
        <div className="mt-2 px-3 py-2 bg-toss-blue-light rounded-xl border border-toss-blue/20">
          <p className="text-xs text-toss-blue font-medium">
            ✓ 이 지시사항이 AI 분석에 반영됩니다
          </p>
        </div>
      )}
    </div>
  )
}
