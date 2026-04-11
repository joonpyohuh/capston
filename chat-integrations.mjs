/**
 * Instagram (Meta) Webhook 수신만 담당합니다.
 * — 비즈니스/크리에이터 계정, Facebook Page 연결, Meta 앱·권한·검수 정책이 필요합니다.
 */

import crypto from "crypto";

const MAX = 150;
const inbox = { instagram: [] };

async function readBuffer(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

function pushIg(payload) {
  inbox.instagram.push({ at: Date.now(), payload });
  while (inbox.instagram.length > MAX) inbox.instagram.shift();
}

function verifyMetaSignature256(rawBuffer, sigHeader) {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return true;
  if (!sigHeader || typeof sigHeader !== "string" || !sigHeader.startsWith("sha256=")) return false;
  const expectedHex = crypto.createHmac("sha256", secret).update(rawBuffer).digest("hex");
  const gotHex = sigHeader.slice(7);
  try {
    const a = Buffer.from(expectedHex, "hex");
    const b = Buffer.from(gotHex, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function sendJson(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

/** Meta Webhook 구독 확인 + 이벤트 수신 */
export async function handleInstagramWebhook(req, res, u) {
  if (req.method === "GET") {
    const mode = u.searchParams.get("hub.mode");
    const token = u.searchParams.get("hub.verify_token");
    const challenge = u.searchParams.get("hub.challenge");
    if (mode === "subscribe" && challenge) {
      const want = process.env.META_VERIFY_TOKEN;
      if (want && token !== want) {
        res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("verify_token mismatch");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(challenge);
      return;
    }
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("bad request");
    return;
  }

  if (req.method === "POST") {
    const raw = await readBuffer(req);
    const sig = req.headers["x-hub-signature-256"];
    if (!verifyMetaSignature256(raw, sig)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("invalid signature");
      return;
    }
    let payload;
    try {
      payload = JSON.parse(raw.toString("utf8") || "{}");
    } catch {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("invalid json");
      return;
    }
    pushIg(payload);
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("EVENT_RECEIVED");
    return;
  }

  res.writeHead(405);
  res.end();
}

export function handleIntegrationsInbox(req, res, u) {
  if (req.method !== "GET") {
    res.writeHead(405);
    res.end();
    return;
  }
  const n = Math.min(50, Math.max(1, Number(u.searchParams.get("limit")) || 20));
  sendJson(res, 200, {
    instagram: inbox.instagram.slice(-n),
    note: "Meta Webhook 페이로드 원문입니다. DM/메시징은 Meta 정책·권한·앱 모드에 따라 다릅니다.",
  });
}
