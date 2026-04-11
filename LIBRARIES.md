# 선택용 라이브러리 · 연동 안내

웹 브라우저만으로는 안드로이드 문자함에 직접 접근할 수 없습니다. 아래 중 필요한 방식을 골라 적용하세요.

## 1. 대화·문자를 `.txt`로 넣기 (추가 코드 없음)

- **카카오톡**: 대화방 → 설정 → 대화 내용보내기 → `.txt` 저장 후 이 앱에서 업로드.
- **문자**: Play 스토어의 `SMS Backup & Restore` 등으로 백업 파일을 텍스트 형태로보낸 뒤, 같은 방식으로 업로드하거나 내용을 붙여넣기.

## 2. 분석·답변 생성 API (택일)

서비스 기획안의 “통합 분석·답변 컨설팅”을 자동화하려면 서버 또는 클라이언트에서 아래 중 하나를 선택해 호출하면 됩니다.

| 선택 | 용도 | 패키지 / 문서 |
|------|------|----------------|
| OpenAI | 텍스트 분류·요약·답안 초안 | npm: `openai` — [OpenAI API](https://platform.openai.com/docs) |
| Anthropic | 긴 맥락 처리에 유리한 경우 | npm: `@anthropic-ai/sdk` — [Anthropic API](https://docs.anthropic.com/) |
| Google Gemini | 다국어·비용 정책에 맞출 때 | npm: `@google/generative-ai` — [Gemini API](https://ai.google.dev/docs) |

**주의:** API 키는 브라우저에 두지 말고, 백엔드(예: Node `express`, Python `fastapi`)에서만 사용하는 것이 안전합니다.

### 예시: Node에서 OpenAI로 요약 요청 (참고용)

```bash
npm install openai
```

```javascript
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: "너는 관계 맥락과 거리두기 전략을 짧게 조언하는 보조다." },
    { role: "user", content: "상황:\n...\n대화:\n..." },
  ],
});
```

원하시면 위 스택 중 하나를 정해 주시면, `proto`에 맞는 최소 API 라우트만 추가하는 형태로 이어서 작성할 수 있습니다.

## 3. 안드로이드와 “실시간”에 가깝게 연동 (고급, 택일)

| 방식 | 설명 |
|------|------|
| Tasker + HTTP | 새 문자 수신 시 Tasker가 로컬/서버 URL로 POST. 앱 쪽에 작은 수신 API 필요. |
| FCM + 앱 | 별도 안드로이드 앱이 문자를 읽어(권한 필요) 서버로 전송. |
| Twilio 등 SMS API | 실제 발신·수신은 통신사/중계 서비스 경유. |

이 단계는 정책·보안 검토가 필요하므로, 위 표에서 방식을 정한 뒤에만 구현하는 것을 권장합니다.
