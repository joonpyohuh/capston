/**
 * db.mjs - 단순 JSON 파일 기반 로컬 데이터베이스
 * 분석 세션(대화 내역, 답장, 전략, 거리점수 등)을 저장합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'db.json');

function loadDb() {
  try {
    if (!fs.existsSync(DB_PATH)) return { records: [] };
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data.records)) return { records: [] };
    return data;
  } catch {
    return { records: [] };
  }
}

function saveDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 분석 결과를 DB에 저장합니다.
 * @param {object} params
 * @param {string} params.me - 내 이름
 * @param {string} params.them - 상대방 이름
 * @param {string} params.relationType - 동성/이성
 * @param {string} params.purpose - 목적 (distance/gauge/closer)
 * @param {string} params.situation - 상황 설명
 * @param {string} params.dialogue - 대화 내용 발췌
 * @param {string} params.userInstruction - 사용자 커스텀 지시
 * @param {object} params.metrics - { affinity, closeness, burden, distanceWill }
 * @param {string} params.brief - 핵심 요약
 * @param {string} params.selectionSynthesis - 선택 종합
 * @param {Array}  params.deepAngles - 심층 분석 각도 (전략)
 * @param {Array}  params.replySuggestions - 답장 추천 목록
 * @param {object} params.replyTiming - 답장 타이밍
 * @param {string} params.lastThemMessage - 상대방 마지막 메시지
 * @param {string} params.relationshipDetail - 관계 상세 분석
 * @returns {string} 생성된 레코드 ID
 */
export function saveRecord(params) {
  const db = loadDb();
  const id = crypto.randomUUID();
  const record = {
    id,
    createdAt: new Date().toISOString(),
    me: params.me || '',
    them: params.them || '',
    relationType: params.relationType || '',
    purpose: params.purpose || 'distance',
    situation: (params.situation || '').slice(0, 500),
    dialogueExcerpt: (params.dialogue || '').slice(0, 3000),
    userInstruction: (params.userInstruction || '').slice(0, 500),
    metrics: {
      affinity: params.metrics?.affinity ?? 50,
      closeness: params.metrics?.closeness ?? 50,
      burden: params.metrics?.burden ?? 50,
      distanceWill: params.metrics?.distanceWill ?? 50,
    },
    brief: params.brief || '',
    selectionSynthesis: params.selectionSynthesis || '',
    deepAngles: Array.isArray(params.deepAngles) ? params.deepAngles : [],
    replySuggestions: Array.isArray(params.replySuggestions) ? params.replySuggestions : [],
    replyTiming: params.replyTiming || {},
    lastThemMessage: params.lastThemMessage || '',
    relationshipDetail: params.relationshipDetail || '',
    selectedReplyIndex: null,
  };
  db.records.unshift(record);
  // 최대 200건 유지
  if (db.records.length > 200) db.records = db.records.slice(0, 200);
  saveDb(db);
  return id;
}

/**
 * 전체 히스토리를 반환합니다 (최신순).
 * @param {number} limit - 최대 반환 건수 (기본 50)
 */
export function getHistory(limit = 50) {
  const db = loadDb();
  return db.records.slice(0, limit);
}

/**
 * 특정 레코드를 삭제합니다.
 * @param {string} id
 * @returns {boolean} 삭제 성공 여부
 */
export function deleteRecord(id) {
  const db = loadDb();
  const before = db.records.length;
  db.records = db.records.filter(r => r.id !== id);
  if (db.records.length === before) return false;
  saveDb(db);
  return true;
}

/**
 * 선택한 답장 인덱스를 업데이트합니다.
 * @param {string} id - 레코드 ID
 * @param {number} replyIndex - 선택한 답장 인덱스
 * @returns {boolean} 업데이트 성공 여부
 */
export function selectReply(id, replyIndex) {
  const db = loadDb();
  const record = db.records.find(r => r.id === id);
  if (!record) return false;
  record.selectedReplyIndex = replyIndex;
  saveDb(db);
  return true;
}
