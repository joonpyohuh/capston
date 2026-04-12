import React from 'react'
import { useSpeech } from '../context/SpeechContext.jsx'
import RelationshipViz from './RelationshipViz.jsx'

function MetricCard({ metric, value, locked, aiAllow, onChange, onLockChange, onAiAllowChange }) {
  const { t } = useSpeech()

  const handleStep = (delta) => {
    if (!locked) onChange(metric.id, value + delta)
  }

  const pct = value
  const gradientStyle = {
    background: `linear-gradient(90deg, #3182F6 ${pct}%, #E5E8EB ${pct}%)`,
  }

  return (
    <div className={`p-4 rounded-xl border transition-all duration-150 ${locked ? 'bg-toss-gray-50 border-toss-gray-200' : 'bg-white border-toss-gray-200 hover:border-toss-blue/30'}`}>
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-sm font-semibold text-toss-gray-800">{metric.name}</p>
          <p className="text-xs text-toss-gray-400 mt-0.5">{metric.desc}</p>
        </div>
        <span className="text-xl font-bold text-toss-blue tabular-nums ml-3">{value}</span>
      </div>

      {/* Slider */}
      <div className="mt-3 mb-3">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          disabled={locked}
          style={gradientStyle}
          className="w-full"
          onChange={e => onChange(metric.id, Number(e.target.value))}
        />
      </div>

      {/* Step buttons */}
      <div className="flex items-center gap-1.5 mb-3">
        {[-5, -1, 1, 5].map(delta => (
          <button
            key={delta}
            onClick={() => handleStep(delta)}
            disabled={locked}
            className="flex-1 py-1 text-xs font-medium bg-toss-gray-100 text-toss-gray-600 rounded-lg hover:bg-toss-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {delta > 0 ? `+${delta}` : delta}
          </button>
        ))}
      </div>

      {/* Toggles */}
      <div className="flex gap-3">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <div
            onClick={() => onLockChange(metric.id, !locked)}
            className={`relative w-8 h-4.5 rounded-full transition-colors duration-200 flex items-center cursor-pointer ${locked ? 'bg-amber-400' : 'bg-toss-gray-300'}`}
            style={{ height: '18px', width: '32px' }}
          >
            <div className={`absolute w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200 ${locked ? 'translate-x-[15px]' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-xs text-toss-gray-500">{t.lockLabel}</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer">
          <div
            onClick={() => onAiAllowChange(metric.id, !aiAllow)}
            className={`relative rounded-full transition-colors duration-200 flex items-center cursor-pointer ${aiAllow ? 'bg-toss-blue' : 'bg-toss-gray-300'}`}
            style={{ height: '18px', width: '32px' }}
          >
            <div className={`absolute w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200 ${aiAllow ? 'translate-x-[15px]' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-xs text-toss-gray-500">{t.aiAllowLabel}</span>
        </label>
      </div>
    </div>
  )
}

export default function MetricsSection({
  metrics, values, locked, aiAllow, onChange, onLockChange, onAiAllowChange,
  directMe, directThem, userMode, savedProfiles,
}) {
  const { t } = useSpeech()

  const me = userMode === 'direct' ? directMe : (savedProfiles.find(p => p._selected)?.me || '')
  const them = userMode === 'direct' ? directThem : (savedProfiles.find(p => p._selected)?.them || '')

  return (
    <div className="toss-card">
      <p className="toss-section-title">{t.metricsTitle} (0–100)</p>
      <p className="toss-hint mb-4">{t.metricsHint}</p>

      <div className="space-y-3">
        {metrics.map(m => (
          <MetricCard
            key={m.id}
            metric={m}
            value={values[m.id]}
            locked={locked[m.id]}
            aiAllow={aiAllow[m.id]}
            onChange={onChange}
            onLockChange={onLockChange}
            onAiAllowChange={onAiAllowChange}
          />
        ))}
      </div>

      <RelationshipViz values={values} me={me} them={them} />
    </div>
  )
}
