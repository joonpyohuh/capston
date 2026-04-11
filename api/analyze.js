function clampInt(x) {
  const n = Math.round(Number(x));
  if (Number.isNaN(n)) return 50;
  return Math.max(0, Math.min(100, n));
}

function normalizeReplySuggestions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 3)
    .map((x) => ({
      text: String(x?.text ?? x?.reply ?? "").trim(),
      reason: String(x?.reason ?? x?.why ?? "").trim(),
      closenessAfter: clampInt(x?.closenessAfter ?? x?.closenessHint),
    }))
    .filter((x) => x.text.length > 0);
}

function normalizeDeepAngles(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 6)
    .map((x) => ({
      title: String(x?.title ?? x?.angle ?? "").trim(),
      body: String(x?.body ?? x?.content ?? "").trim(),
    }))
    .filter((x) => x.title.length > 0 || x.body.length > 0);
}

function normalizeReplyTiming(raw) {
  if (!raw || typeof raw !== "object") return { suggestedDelay: "미정", reason: "" };
  return {
    suggestedDelay: String(raw.suggestedDelay ?? raw.delay ?? "").trim() || "미정",
    reason: String(raw.reason ?? raw.why ?? "").trim(),
  };
}

async function callOpenAI(payload) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("NO_KEY");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const purposeMap = {
    distance: "거리두기 (상대와 자연스럽게 멀어지고 싶음)",
    gauge: "관계 파악 (현재 관계 거리와 상태를 파악하고 싶음)",
    closer: "가까워지기 (상대와 더 친해지고 싶음)",
  };
  const purposeLabel = purposeMap[payload.userPurpose] || purposeMap["distance"];

  const system = `You are DistanceReply, a Korean relationship communication assistant.
The user's goal (userPurpose) is: "${purposeLabel}"

Adapt ALL your analysis, strategy, and suggestions to this goal:
- "거리두기": focus on natural distancing, reducing warmth gradually, protecting user's energy
- "관계 파악": provide objective analysis of relationship dynamics without pushing toward either direction
- "가까워지기": focus on approaches to deepen connection, reduce awkwardness, build trust

Reply with ONLY one JSON object (no markdown code fences), UTF-8, all user-facing strings in Korean.

Required keys:
- affinity, closeness, burden, distanceWill: integers 0-100. Infer from dialogue + situation + payload.userSelections.metrics.

- brief: Korean, 3-5 sentences. Executive summary tailored to the userPurpose: relationship flow, key tension points, and recommended direction.

- selectionSynthesis: Korean, ONE cohesive block, 6-10 sentences. Synthesize: (1) dialogue + situation, (2) relationshipType, (3) userSelections including all metrics (nameKo, value, directLockManual, aiResultMayAdjust). Explain alignments and tensions between user's inputs and what the text suggests.

- replyTiming: { "suggestedDelay": string, "reason": string }.
  Recommend how long "me" should wait before replying, calibrated to the userPurpose and relationship context.
  suggestedDelay options: "바로 답장", "1~2시간 후", "반나절 뒤", "하루 뒤", "2~3일 후", "일주일 이상", or a similar natural Korean phrase.
  For "거리두기": longer delays signal less urgency. For "가까워지기": shorter delays show interest. For "관계 파악": neutral timing.
  reason: 2~3 Korean sentences explaining why this timing fits the relationship context, burden level, and userPurpose.

- deepAngles: array of EXACTLY 5 objects: { "title": string, "body": string }. Each "title" is a short Korean heading. Each "body" is 5-9 sentences, a distinct analytical lens aligned with userPurpose:
  (1) 대화 패턴·상대·말투 온도·부담("me" 입장 심층)
  (2) 사용자가 선택한 지표와 잠금/AI반영 설정이 내포하는 심리적 신호
  (3) 감정 소비, 권력·의존, 경계감·자아보호
  (4) 리스크 관리 및 다음 행동/말투 전략 (userPurpose 기반)
  (5) 관계 시나리오 — 가까워짐/유지/이탈 가능성과 조건

- lastThemMessage: string. Identify the counterpart's last message in the dialogue. Quote or closely paraphrase in Korean.

- relationshipDetail: string, Korean, 14-22 sentences. Deep narrative covering power balance, emotional tone, reciprocity, pressure points, attachment, and how the metrics interact. Ground every claim in dialogue or situation. Align conclusions with userPurpose.

- replySuggestions: array of EXACTLY 3 objects: { "text": string, "reason": string, "closenessAfter": integer 0-100 }.
  Each "text" is a candidate reply "me" could send NEXT, responding specifically to lastThemMessage and aligned with userPurpose.
  For "거리두기": options ranging from soft-distancing to firmer boundary.
  For "가까워지기": options ranging from warm engagement to deeper connection.
  For "관계 파악": options ranging from neutral to slightly warmer.
  Each "reason" explains in 2-4 Korean sentences why this reply fits the goal, tone, and relationship.
  "closenessAfter" = predicted closeness change (0=very distant, 100=very close). Vary the three options.

Voice / style: If payload.meVoiceSamples is non-empty, learn diction from these samples (honorific level, sentence length, endings, emoji, abbreviations). Each replySuggestions[].text must sound like the same person wrote it.

Relationship framing: payload.relationshipType is "동성" or "이성". Use this to calibrate social expectations and wording.

Interpret using: payload.me, payload.them, payload.situation, payload.dialogueExcerpt, payload.userSelections, payload.userPurpose.`;

  const user = JSON.stringify({
    me: payload.me,
    them: payload.them,
    relationshipType: String(payload.relationshipType || "").trim(),
    userPurpose: payload.userPurpose || "distance",
    situation: payload.situation,
    dialogueExcerpt: String(payload.dialogue || "").slice(0, 12000),
    meVoiceSamples: String(payload.meVoiceExcerpt || payload.meVoiceSamples || "").slice(0, 8000),
    currentMetricsHint: payload.currentMetrics || {},
    userSelections: payload.userSelections || null,
  });

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.38,
      max_tokens: 5500,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!r.ok) {
    const t = await r.text();
    throw new Error(`OpenAI HTTP ${r.status}: ${t.slice(0, 280)}`);
  }

  const data = await r.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || "";
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("모델 응답을 JSON으로 파싱하지 못했습니다.");
    parsed = JSON.parse(m[0]);
  }
  return parsed;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const payload = req.body || {};
    const out = await callOpenAI(payload);
    const metrics = {
      affinity: clampInt(out.affinity),
      closeness: clampInt(out.closeness),
      burden: clampInt(out.burden),
      distanceWill: clampInt(out.distanceWill),
    };
    const replySuggestions = normalizeReplySuggestions(out.replySuggestions);
    const deepAngles = normalizeDeepAngles(out.deepAngles);
    const replyTiming = normalizeReplyTiming(out.replyTiming);
    res.status(200).json({
      metrics,
      brief: String(out.brief || "").trim(),
      selectionSynthesis: String(out.selectionSynthesis || "").trim(),
      deepAngles,
      lastThemMessage: String(out.lastThemMessage || "").trim(),
      relationshipDetail: String(out.relationshipDetail || "").trim(),
      replySuggestions,
      replyTiming,
    });
  } catch (e) {
    if (e.message === "NO_KEY") {
      res.status(503).json({ error: "OPENAI_API_KEY가 Vercel 환경 변수에 설정되지 않았습니다." });
    } else {
      res.status(500).json({ error: e.message || "분석 실패" });
    }
  }
}
