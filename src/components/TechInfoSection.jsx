import React, { useState } from 'react'

const PROMPT_TEMPLATE = `[시스템 프롬프트 구조]

당신은 DistanceReply — 한국어 관계 커뮤니케이션 보조 AI입니다.

■ 사용자 목적 (userPurpose)
  - "거리두기": 자연스럽게 멀어지기, 에너지 보호
  - "관계 파악": 관계 거리 객관적 분석
  - "가까워지기": 연결 강화, 어색함 감소

■ 입력 데이터
  - me / them: 발화 주체와 상대방 이름
  - relationshipType: 동성 | 이성
  - situation: 관계·상황 설명
  - dialogueExcerpt: 대화 원문 (최근 12,000자)
  - meVoiceSamples: 나의 말투 샘플 (최근 8,000자)
  - currentMetrics: 호감·친밀도·부담·거리두기의지 (0~100)
  - userInstruction: 사용자 추가 지시사항 (최대 500자)
  - replyTone: "formal"(존댓말) | "informal"(반말)

■ 답장 말투 규칙 (CRITICAL)
  반말 선택 시 → replySuggestions의 모든 text에
    ~야, ~어, ~지, ~거든, ~잖아, ~네, ~해, ~할게 사용
  존댓말 선택 시 → replySuggestions의 모든 text에
    ~요, ~습니다, ~세요, ~ㄹ게요, ~네요, ~죠 사용

■ AI 응답 JSON 스키마
  {
    affinity: 0~100,          // 호감·신뢰
    closeness: 0~100,         // 대화 친밀도
    burden: 0~100,            // 부담·소모
    distanceWill: 0~100,      // 거리두기 의지
    brief: "핵심 요약 (3~5문장)",
    selectionSynthesis: "선택·지표 종합 (6~10문장)",
    replyTiming: {
      suggestedDelay: "바로 답장 | 1~2시간 후 | 반나절 뒤 | ...",
      reason: "타이밍 근거 (2~3문장)"
    },
    deepAngles: [             // 5개 다각적 분석
      { title: "분석 관점", body: "5~9문장 심층 분석" },
      ...
    ],
    lastThemMessage: "상대 마지막 메시지 인용",
    relationshipDetail: "관계 해설 (14~22문장)",
    replySuggestions: [       // 3개 답변 추천
      {
        text: "추천 답장 문장",
        reason: "추천 이유 (2~4문장)",
        closenessAfter: 0~100
      },
      ...
    ]
  }

■ 모델: gpt-4o-mini (기본) / gpt-4o (설정 가능)
■ temperature: 0.38 | max_tokens: 5,500`

const DB_SCHEMA = `[데이터베이스 저장 형식 — db.json]

{
  "records": [
    {
      "id": "rec_1713000000000_abc123",   // 고유 ID
      "createdAt": "2026-04-13T12:00:00.000Z",
      "me": "민지",
      "them": "태연",
      "userPurpose": "distance",          // distance | gauge | closer
      "replyTone": "formal",              // formal | informal
      "situation": "상황 설명 텍스트",
      "dialogueLength": 4231,             // 대화 원문 글자 수
      "metrics": {
        "affinity": 62,
        "closeness": 55,
        "burden": 71,
        "distanceWill": 68
      },
      "brief": "AI가 생성한 핵심 요약",
      "replySuggestions": [
        { "text": "추천 답장 1", "reason": "이유", "closenessAfter": 45 },
        { "text": "추천 답장 2", "reason": "이유", "closenessAfter": 52 },
        { "text": "추천 답장 3", "reason": "이유", "closenessAfter": 38 }
      ],
      "selectedReplyIndex": null          // 사용자가 선택한 답장 인덱스
    }
  ]
}

■ 저장 시점: 분석 완료 시 server.mjs의 saveRecord() 자동 호출
■ 저장 위치: 서버 로컬 파일 db.json (Vercel 환경에서는 미저장)
■ 조회: GET /api/history?limit=50
■ 삭제: DELETE /api/history/:id
■ 답장 선택: POST /api/history/:id/select-reply`

export default function TechInfoSection() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('prompt')
  const [copied, setCopied] = useState(false)

  const content = activeTab === 'prompt' ? PROMPT_TEMPLATE : DB_SCHEMA

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(h => !h)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-toss-gray-200 rounded-2xl text-sm font-semibold text-toss-gray-700 hover:bg-toss-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>🔍</span>
          기술 정보 (프롬프트 · DB 구조)
          <span className="text-[10px] font-normal text-toss-gray-400 bg-toss-gray-100 px-1.5 py-0.5 rounded-md">발표용</span>
        </span>
        <svg
          className={`w-4 h-4 text-toss-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 bg-white border border-toss-gray-200 rounded-2xl overflow-hidden">
          {/* 탭 */}
          <div className="flex border-b border-toss-gray-100">
            <button
              onClick={() => setActiveTab('prompt')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'prompt'
                  ? 'text-toss-blue border-b-2 border-toss-blue bg-toss-blue-light'
                  : 'text-toss-gray-500 hover:text-toss-gray-700'
              }`}
            >
              📋 시스템 프롬프트
            </button>
            <button
              onClick={() => setActiveTab('db')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'db'
                  ? 'text-toss-blue border-b-2 border-toss-blue bg-toss-blue-light'
                  : 'text-toss-gray-500 hover:text-toss-gray-700'
              }`}
            >
              🗄️ DB 저장 구조
            </button>
          </div>

          {/* 설명 배너 */}
          <div className="px-4 pt-3 pb-1">
            <p className="text-[11px] text-toss-gray-400">
              {activeTab === 'prompt'
                ? 'OpenAI GPT에 전달되는 시스템 프롬프트 구조입니다. 분석 시 실제로 사용되는 지시사항이며, 사용자 입력값에 따라 동적으로 조합됩니다.'
                : '로컬 서버(server.mjs) 사용 시 db.json 파일에 저장되는 분석 기록의 형식입니다. 분석 완료마다 한 건씩 누적됩니다.'}
            </p>
          </div>

          {/* 코드 블록 */}
          <div className="relative mx-4 mb-4 mt-2">
            <pre className="bg-gray-950 text-green-300 text-[11px] leading-relaxed rounded-xl p-4 overflow-x-auto overflow-y-auto max-h-96 font-mono whitespace-pre">
              {content}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 px-2 py-1 text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
            >
              {copied ? '✓ 복사됨' : '복사'}
            </button>
          </div>

          {activeTab === 'db' && (
            <div className="mx-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-[11px] text-amber-700 font-medium">
                ⚠️ Vercel 배포 환경에서는 DB 저장이 비활성화됩니다. 히스토리 기능은 <code className="bg-amber-100 px-1 rounded">node server.mjs</code> 로컬 서버 실행 시에만 동작합니다.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
