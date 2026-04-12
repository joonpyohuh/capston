import React, { useRef, useState } from 'react'
import { useSpeech } from '../context/SpeechContext.jsx'
import { readFileAsText } from '../utils/textUtils.js'

export default function InputSection({
  uploadedFiles,
  setUploadedFiles,
  smsPaste,
  setSmsPaste,
  rawSmsSingle,
  setRawSmsSingle,
  ctx,
  setCtx,
  participants,
  refreshParticipants,
}) {
  const { t } = useSpeech()
  const [activeTab, setActiveTab] = useState('file')
  const fileRef = useRef(null)
  const smsFileRef = useRef(null)

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || [])
    const newFiles = []
    for (const f of files) {
      const text = await readFileAsText(f)
      newFiles.push({ name: f.name, text })
    }
    e.target.value = ''
    const updated = [...uploadedFiles, ...newFiles]
    setUploadedFiles(updated)
    refreshParticipants(updated, rawSmsSingle, smsPaste)
  }

  const handleRemoveFile = (idx) => {
    const updated = uploadedFiles.filter((_, i) => i !== idx)
    setUploadedFiles(updated)
    refreshParticipants(updated, rawSmsSingle, smsPaste)
  }

  const handleSmsFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const text = await readFileAsText(f)
    setRawSmsSingle(text)
    refreshParticipants(uploadedFiles, text, smsPaste)
  }

  const handleSmsPaste = (val) => {
    setSmsPaste(val)
    refreshParticipants(uploadedFiles, rawSmsSingle, val)
  }

  return (
    <div className="toss-card">
      <p className="toss-section-title">{t.inputTitle}</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-toss-gray-100 p-1 rounded-xl">
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
            activeTab === 'file'
              ? 'bg-white text-toss-blue shadow-sm font-semibold'
              : 'text-toss-gray-500 hover:text-toss-gray-700'
          }`}
          onClick={() => setActiveTab('file')}
        >
          {t.fileTabLabel}
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
            activeTab === 'sms'
              ? 'bg-white text-toss-blue shadow-sm font-semibold'
              : 'text-toss-gray-500 hover:text-toss-gray-700'
          }`}
          onClick={() => setActiveTab('sms')}
        >
          {t.smsTabLabel}
        </button>
      </div>

      {activeTab === 'file' && (
        <div className="space-y-3">
          <p className="toss-hint">{t.fileHint}</p>

          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-toss-blue-light text-toss-blue text-xs font-medium rounded-full max-w-[200px]"
                >
                  <span className="truncate">{f.name}</span>
                  <button
                    onClick={() => handleRemoveFile(i)}
                    className="text-toss-blue hover:text-red-400 transition-colors ml-0.5 flex-shrink-0"
                    title="파일 제거"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-toss-gray-300 rounded-xl text-sm text-toss-gray-500 hover:border-toss-blue hover:text-toss-blue transition-colors w-full justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            파일 선택
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,text/plain"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="toss-hint">{t.fileAddHint}</p>
        </div>
      )}

      {activeTab === 'sms' && (
        <div className="space-y-3">
          <div>
            <label className="toss-label">{t.smsLabel}</label>
            <textarea
              className="toss-textarea h-36"
              placeholder={t.smsPh}
              value={smsPaste}
              onChange={e => handleSmsPaste(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => smsFileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-toss-gray-300 rounded-xl text-sm text-toss-gray-500 hover:border-toss-blue hover:text-toss-blue transition-colors w-full justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {rawSmsSingle ? '파일 교체' : 'SMS 파일 선택 (선택)'}
          </button>
          {rawSmsSingle && (
            <p className="text-xs text-toss-blue">SMS 파일 로드됨 ({rawSmsSingle.length}자)</p>
          )}
          <input
            ref={smsFileRef}
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={handleSmsFile}
          />
        </div>
      )}

      {/* Context */}
      <div className="mt-4 pt-4 border-t border-toss-gray-100">
        <label className="toss-label">{t.ctxLabel}</label>
        <textarea
          className="toss-textarea h-28"
          placeholder={t.ctxPh}
          value={ctx}
          onChange={e => setCtx(e.target.value)}
        />
      </div>

      {/* Participants hint */}
      {participants.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-xs text-toss-gray-500">추출된 이름:</span>
          {participants.slice(0, 8).map(p => (
            <span key={p} className="text-xs px-2 py-0.5 bg-toss-gray-100 rounded-full text-toss-gray-600">
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
