import React, { useState } from 'react'
import { useSpeech } from '../context/SpeechContext.jsx'

const LS_PROFILES = 'distanceReplyProfiles_v1'

function persistProfiles(profiles) {
  localStorage.setItem(LS_PROFILES, JSON.stringify(profiles))
}

export default function UserSection({
  userMode, setUserMode,
  directMe, setDirectMe,
  directThem, setDirectThem,
  relationType, setRelationType,
  savedProfiles, setSavedProfiles,
  participants,
  analyzing, analyzeStatus, onAnalyze,
}) {
  const { t } = useSpeech()
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [catName, setCatName] = useState('')
  const [savedMe, setSavedMe] = useState('')
  const [savedThem, setSavedThem] = useState('')

  const syncFromProfile = (id) => {
    const p = savedProfiles.find(x => x.id === id)
    if (p) {
      setCatName(p.category)
      setSavedMe(p.me)
      setSavedThem(p.them)
      setRelationType(p.relationType || '')
    } else {
      setCatName('')
      setSavedMe('')
      setSavedThem('')
    }
  }

  const handleSelectProfile = (id) => {
    setSelectedProfileId(id)
    syncFromProfile(id)
  }

  const handleSaveNew = () => {
    if (!relationType) { alert(t.alertRelType); return }
    if (!catName.trim()) { alert(t.alertCatName); return }
    const id = String(Date.now())
    const newProfiles = [...savedProfiles, { id, category: catName.trim(), me: savedMe.trim(), them: savedThem.trim(), relationType }]
    setSavedProfiles(newProfiles)
    persistProfiles(newProfiles)
    setSelectedProfileId(id)
  }

  const handleUpdate = () => {
    if (!selectedProfileId) { alert(t.alertSelectProfile); return }
    if (!relationType) { alert(t.alertRelType); return }
    const newProfiles = savedProfiles.map(p =>
      p.id === selectedProfileId
        ? { ...p, category: catName.trim(), me: savedMe.trim(), them: savedThem.trim(), relationType }
        : p
    )
    setSavedProfiles(newProfiles)
    persistProfiles(newProfiles)
  }

  const handleDelete = () => {
    if (!selectedProfileId) { alert(t.alertSelectProfile); return }
    if (!window.confirm(t.profileDeleteConfirm)) return
    const newProfiles = savedProfiles.filter(p => p.id !== selectedProfileId)
    setSavedProfiles(newProfiles)
    persistProfiles(newProfiles)
    setSelectedProfileId('')
    setCatName('')
    setSavedMe('')
    setSavedThem('')
  }

  return (
    <div className="toss-card">
      <p className="toss-section-title">{t.userTitle}</p>

      {/* Relation type */}
      <div className="mb-4">
        <p className="toss-label">{t.relTypeLabel}</p>
        <div className="flex gap-2">
          {[
            { val: 'same', label: t.relTypeSame },
            { val: 'opposite', label: t.relTypeOpposite },
          ].map(({ val, label }) => (
            <button
              key={val}
              type="button"
              onClick={() => setRelationType(val)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl border-2 transition-all duration-150 ${
                relationType === val
                  ? 'border-toss-blue bg-toss-blue-light text-toss-blue font-semibold'
                  : 'border-toss-gray-200 text-toss-gray-600 hover:border-toss-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {!relationType && (
          <p className="toss-hint mt-1.5 text-amber-500">{t.relTypeHint}</p>
        )}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 mb-4 bg-toss-gray-100 p-1 rounded-xl">
        {[
          { id: 'direct', label: t.directTabLabel },
          { id: 'saved', label: t.savedTabLabel },
        ].map(tab => (
          <button
            key={tab.id}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
              userMode === tab.id
                ? 'bg-white text-toss-blue shadow-sm font-semibold'
                : 'text-toss-gray-500 hover:text-toss-gray-700'
            }`}
            onClick={() => setUserMode(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {userMode === 'direct' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="toss-label">{t.meLabel}</label>
            <input
              list="participant-list"
              className="toss-input"
              placeholder={t.mePh}
              value={directMe}
              onChange={e => setDirectMe(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div>
            <label className="toss-label">{t.themLabel}</label>
            <input
              list="participant-list"
              className="toss-input"
              placeholder={t.themPh}
              value={directThem}
              onChange={e => setDirectThem(e.target.value)}
              autoComplete="off"
            />
          </div>
          <datalist id="participant-list">
            {participants.map(p => <option key={p} value={p} />)}
          </datalist>
        </div>
      )}

      {userMode === 'saved' && (
        <div className="space-y-3">
          <div>
            <label className="toss-label">저장된 프로필</label>
            <select
              className="toss-input"
              value={selectedProfileId}
              onChange={e => handleSelectProfile(e.target.value)}
            >
              <option value="">{t.selectProfile}</option>
              {savedProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.category || '(이름 없음)'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="toss-label">{t.catLabel}</label>
            <input className="toss-input" placeholder={t.catPh} value={catName} onChange={e => setCatName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="toss-label">{t.meLabel}</label>
              <input list="participant-list" className="toss-input" placeholder={t.mePh} value={savedMe} onChange={e => setSavedMe(e.target.value)} autoComplete="off" />
            </div>
            <div>
              <label className="toss-label">{t.themLabel}</label>
              <input list="participant-list" className="toss-input" placeholder={t.themPh} value={savedThem} onChange={e => setSavedThem(e.target.value)} autoComplete="off" />
            </div>
          </div>

          <div className="flex gap-2">
            <button className="toss-btn-secondary flex-1" onClick={handleSaveNew}>{t.btnSaveNew}</button>
            <button className="toss-btn-secondary flex-1" onClick={handleUpdate}>{t.btnSaveUpdate}</button>
            <button className="toss-btn-secondary flex-1 text-red-400 hover:text-red-500" onClick={handleDelete}>{t.btnSaveDelete}</button>
          </div>
        </div>
      )}

      {/* Analyze button */}
      <div className="mt-5 pt-4 border-t border-toss-gray-100">
        <button
          className="toss-btn-primary flex items-center justify-center gap-2"
          disabled={analyzing}
          onClick={() => onAnalyze(t)}
        >
          {analyzing ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t.analyzing}
            </>
          ) : (
            t.btnAnalyze
          )}
        </button>
        {analyzeStatus && (
          <p className={`text-sm mt-2.5 leading-relaxed ${
            analyzeStatus.includes('완료') || analyzeStatus.includes('완료!')
              ? 'text-green-600'
              : analyzeStatus.includes('중') || analyzeStatus.includes('중이야')
              ? 'text-toss-blue'
              : 'text-red-500'
          }`}>
            {analyzeStatus}
          </p>
        )}
      </div>
    </div>
  )
}
