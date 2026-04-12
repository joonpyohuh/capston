import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { handleInstagramWebhook, handleIntegrationsInbox } from "./chat-integrations.mjs";
import { saveRecord, getHistory, deleteRecord, selectReply } from "./db.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8080;

function loadDotEnv() {
  const p = path.join(__dirname, ".env");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (k) process.env[k] = v;
  }
}
loadDotEnv();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".bat": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
};

function sendJson(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

function clampInt(x) {
  const n = Math.round(Number(x));
  if (Number.isNaN(n)) return 50;
  return Math.max(0, Math.min(100, n));
}

function safeFileForUrl(pathname) {
  const base = path.resolve(__dirname);
  const raw = pathname === "/" || pathname === "" ? "index.html" : pathname.slice(1).split("?")[0];
  const decoded = decodeURIComponent(raw);
  if (decoded.includes("..")) return null;
  const full = path.resolve(base, decoded);
  const rel = path.relative(base, full);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return full;
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
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

  // userPurpose: "distance" | "gauge" | "closer"
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

Interpret using: payload.me, payload.them, payload.situation, payload.dialogueExcerpt, payload.userSelections, payload.userPurpose.${
    payload.userInstruction
      ? `\n\n[사용자 추가 지시사항 - 반드시 반영할 것]\n${payload.userInstruction.slice(0, 500)}`
      : ""
  }`;

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

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url || "/", "http://127.0.0.1");

  if (req.method === "GET" && u.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, service: "distance-reply" });
    return;
  }

  if (req.method === "POST" && u.pathname === "/api/analyze") {
    try {
      const body = await readBody(req);
      const payload = JSON.parse(body || "{}");
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
      const responseData = {
        metrics,
        brief: String(out.brief || "").trim(),
        selectionSynthesis: String(out.selectionSynthesis || "").trim(),
        deepAngles,
        lastThemMessage: String(out.lastThemMessage || "").trim(),
        relationshipDetail: String(out.relationshipDetail || "").trim(),
        replySuggestions,
        replyTiming,
      };

      // DB에 분석 결과 저장
      try {
        const recordId = saveRecord({
          me: payload.me,
          them: payload.them,
          relationType: payload.relationshipType,
          purpose: payload.userPurpose,
          situation: payload.situation,
          dialogue: payload.dialogue,
          userInstruction: payload.userInstruction,
          metrics,
          brief: responseData.brief,
          selectionSynthesis: responseData.selectionSynthesis,
          deepAngles,
          replySuggestions,
          replyTiming,
          lastThemMessage: responseData.lastThemMessage,
          relationshipDetail: responseData.relationshipDetail,
        });
        responseData.recordId = recordId;
      } catch (dbErr) {
        console.error("DB 저장 실패 (무시):", dbErr.message);
      }

      sendJson(res, 200, responseData);
    } catch (e) {
      if (e.message === "NO_KEY")
        sendJson(res, 503, { error: "OPENAI_API_KEY가 없습니다. proto 폴더의 .env 파일 또는 환경 변수를 설정하세요." });
      else sendJson(res, 500, { error: e.message || "분석 실패" });
    }
    return;
  }

  // 히스토리 목록 조회
  if (req.method === "GET" && u.pathname === "/api/history") {
    try {
      const limit = parseInt(u.searchParams.get("limit") || "50", 10);
      const records = getHistory(Math.min(limit, 200));
      sendJson(res, 200, { records });
    } catch (e) {
      sendJson(res, 500, { error: e.message || "히스토리 조회 실패" });
    }
    return;
  }

  // 히스토리 레코드 삭제
  if (req.method === "DELETE" && u.pathname.startsWith("/api/history/")) {
    const id = u.pathname.slice("/api/history/".length);
    if (!id) { sendJson(res, 400, { error: "id 필요" }); return; }
    try {
      const ok = deleteRecord(id);
      sendJson(res, ok ? 200 : 404, { ok });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return;
  }

  // 선택한 답장 저장
  if (req.method === "POST" && u.pathname.startsWith("/api/history/") && u.pathname.endsWith("/select-reply")) {
    const parts = u.pathname.split("/");
    const id = parts[parts.length - 2];
    try {
      const body = await readBody(req);
      const { replyIndex } = JSON.parse(body || "{}");
      const ok = selectReply(id, replyIndex);
      sendJson(res, ok ? 200 : 404, { ok });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return;
  }

  if (u.pathname === "/api/webhooks/instagram") {
    await handleInstagramWebhook(req, res, u);
    return;
  }

  if (u.pathname === "/api/integrations/inbox") {
    handleIntegrationsInbox(req, res, u);
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    return res.end();
  }

  const filePath = safeFileForUrl(u.pathname);
  if (!filePath) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404);
      return res.end("Not found");
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`포트 ${PORT}가 이미 다른 프로그램이 쓰고 있습니다. 해당 프로그램을 종료하거나 PORT=8081 환경 변수로 다른 포트를 쓰세요.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`DistanceReply 서버 실행 중`);
  console.log(`  http://127.0.0.1:${PORT}/`);
  console.log(`  http://localhost:${PORT}/`);
  console.log(`  연결 확인: http://127.0.0.1:${PORT}/api/health`);
  console.log(`  Instagram Webhook: GET/POST /api/webhooks/instagram`);
  console.log(`  수신함: GET /api/integrations/inbox`);
  if (!process.env.OPENAI_API_KEY) console.log("(알림) OPENAI_API_KEY 미설정 — 분석 API는 503을 반환합니다.");
});
