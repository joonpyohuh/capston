# DistanceReply — 작동 방법

## 1. 준비물

- **Windows PC**
- **OpenAI API 키** ([OpenAI API 키](https://platform.openai.com/api-keys)에서 발급)

---

## 2. Node.js 설치 (최초 1회)

1. `proto` 폴더에서 **`install-node.bat`** 을 더블클릭합니다.
2. 안내에 따라 **Node.js LTS** 가 설치됩니다. (winget 이 없으면 브라우저로 다운로드 페이지가 열립니다.)
3. 설치가 끝나면 **명령 프롬프트·PowerShell·Cursor 터미널을 모두 닫았다가 새로 엽니다.**  
   (그래야 `node`, `npm` 명령이 인식됩니다.)

설치 확인:

```text
node -v
```

버전 앞 숫자가 **18 이상**이면 됩니다.

---

## 3. API 키 설정 (최초 1회)

1. `proto` 폴더에 **`.env`** 라는 이름의 파일을 만듭니다.  
   (`.env.example` 파일을 복사한 뒤 이름만 `.env` 로 바꿔도 됩니다.)
2. 메모장으로 열고 아래처럼 적습니다. `sk-` 뒤는 본인 키로 바꿉니다.

```env
OPENAI_API_KEY=sk-여기에_실제_키
```

3. 저장합니다.  
   **이 파일은 다른 사람에게 보내거나 Git 에 올리지 마세요.**

---

## 4. 서버 켜기

1. `proto` 폴더에서 **`start-localhost.bat`** 을 더블클릭합니다.
2. **검은 창을 닫지 마세요.** 서버는 이 창이 열려 있는 동안만 동작합니다.
3. 창에 아래와 비슷한 줄이 보이면 정상입니다.

```text
DistanceReply 서버 실행 중
  http://127.0.0.1:8080/
  http://localhost:8080/
```

4. 브라우저 주소창에는 반드시 **`http://` 로 시작**하는 주소를 넣습니다.  
   **`https://` 가 아닙니다.** (직접 `https://localhost:8080` 을 치면 연결 실패·Failed 가 날 수 있습니다.)

```text
http://127.0.0.1:8080/
```

`localhost` 가 안 되면 위 **`127.0.0.1`** 주소를 써 보세요.

5. 서버가 살아 있는지 빠르게 보려면:

```text
http://127.0.0.1:8080/api/health
```

화면에 `{"ok":true,...}` 비슷한 JSON 이 보이면 연결은 된 것입니다.

6. 끌 때는 그 검은 창을 선택한 뒤 **Ctrl+C** 를 누릅니다.

---

## 5. 웹에서 쓰는 순서

1. **입력**  
   - 대화 **`.txt`** 를 올리거나, **안드로이드 문자** 탭에서 내용을 붙여 넣습니다.  
   - **관계·상황 서술**에 지금 상황을 적습니다.

2. **사용자 지정**  
   - **직접 입력**: 나, 상대 이름(또는 표시명)을 적습니다.  
   - 또는 **저장 프로필**: 카테고리별로 나·상대를 저장해 두고 불러옵니다.

3. **분석 시작**  
   - 사용자 지정 블록 **맨 아래**의 **분석 시작** 버튼을 누릅니다.  
   - 서버가 OpenAI 를 호출하고, **「AI 분석 반영 허용」** 이 켜진 지표만 0–100 값이 바뀝니다.  
   - 한 줄 요약은 아래 **맥락 요약**의 `AI 분석 요약` 에 붙습니다.

4. **관계 지표**  
   - **직접 조작 잠금**: 본인이 슬라이더·버튼을 잘못 건드리지 않게 막습니다.  
   - **AI 분석 반영 허용**: 분석 결과로 그 지표를 바꿀지 여부입니다. (직접 잠금과 별개입니다.)

---

## 6. 자주 있는 문제

| 증상 | 확인할 것 |
|------|-----------|
| 브라우저에 **Failed** / **연결할 수 없음** / **ERR_CONNECTION_REFUSED** | `start-localhost.bat` 창이 **켜져 있는지**, 창에 오류 없이 서버가 떠 있는지. **주소가 `https` 가 아니라 `http://127.0.0.1:8080/` 인지.** |
| 창이 바로 닫힌다 | Node 미설치·오류로 종료된 것. `install-node.bat` 후 **새 CMD**에서 `start-localhost.bat` 다시 실행. |
| `포트 8080 을 이미…` | 다른 프로그램이 8080 사용 중. 그 프로그램 종료 후 재시도하거나, CMD에서 `set PORT=8081` 후 `npm start` 하고 브라우저는 `http://127.0.0.1:8081/` |
| `Node.js 없음` | `install-node.bat` 실행 후 **새 터미널**에서 다시 `start-localhost.bat` |
| 분석 버튼이 실패 / 네트워크 오류 | **`http://127.0.0.1:8080`** 으로 연 뒤 분석 (`file://` 로 연 `index.html` 에서는 API 없음) |
| `OPENAI_API_KEY 없음` | `proto` 폴더에 **`.env`** 파일 이름인지 (`env.example` 만 있으면 안 됨), 키 철자·앞뒤 공백 |
| Node 18 이상 필요 | [nodejs.org](https://nodejs.org/) 에서 LTS 재설치 |

---

## 7. 터미널에서만 실행할 때

```text
cd proto폴더경로
npm start
```

브라우저에서 `http://localhost:8080/` 을 열면 동일합니다.

---

## 8. 참고

- 문자·카카오 대화를 폰과 **실시간 연동**하는 방법은 **`LIBRARIES.md`** 를 참고하세요.  
- 프론트에서 쓰는 지표 ID: `affinity`, `closeness`, `burden`, `distanceWill` (개발자용).

---

## 9. Instagram 연동 (Meta 절차 요약)

이 서버는 **`/api/webhooks/instagram`** 으로 Meta Webhook 이벤트를 받습니다.  
**개인 일반 계정**만으로는 DM API가 제한되고, **Instagram 프로페셔널(비즈니스/크리에이터) + Facebook 페이지 연결 + Meta 개발자 앱**이 필요합니다.  
정확한 메뉴 이름은 수시로 바뀌므로, **[Meta 개발자 문서](https://developers.facebook.com/docs/instagram-api)** / **[Instagram Messaging](https://developers.facebook.com/docs/messenger-platform/instagram)** 를 최종 기준으로 보세요.

### 9.1 서버 쪽 준비

| 항목 | 설명 |
|------|------|
| `.env` | `META_VERIFY_TOKEN`, `META_APP_SECRET` (앱 대시보드의 앱 시크릿과 동일) |
| 공개 HTTPS URL | Meta는 `localhost` 를 Webhook 콜백으로 등록할 수 없습니다. **ngrok, Cloudflare Tunnel, 실제 서버** 등으로 `https://.../api/webhooks/instagram` 이 외부에서 열려야 합니다. |
| 수신 확인 | `GET /api/integrations/inbox` 로 최근 수신 페이로드(디버그) 확인 가능 |

### 9.2 Meta 개발자 콘솔 (대략 절차)

1. **[Meta for Developers](https://developers.facebook.com/)** 에서 **앱 생성** (유형은 Meta 안내에 따라 선택).
2. 앱에 **Instagram** 관련 제품을 추가하고, **Instagram Messaging / Messenger** 등 문서에서 요구하는 **권한(permissions)** 을 추가합니다. (DM·메시지는 **고급 검수(Advanced Access)** 가 필요할 수 있습니다.)
3. **Facebook 페이지**를 만들고, **Instagram 프로페셔널 계정**을 해당 페이지에 **연결**합니다.
4. **Instagram 비즈니스 로그인** 또는 **액세스 토큰** 발급 절차를 문서대로 진행합니다. (테스트 사용자/페이지 역할 권한 필요)
5. **Webhooks** 메뉴에서:
   - **Callback URL**: `https://(공개도메인)/api/webhooks/instagram`
   - **Verify Token**: `.env` 의 `META_VERIFY_TOKEN` 과 **완전히 동일**한 문자열
   - 구독할 **필드(fields)** 는 메시징·DM에 맞게 문서에서 선택 (예: `messages` 등)
6. **구독 검증**이 성공하면, Meta가 `POST` 로 이벤트를 보냅니다. 본 서버는 **`X-Hub-Signature-256`** 으로 `META_APP_SECRET` 검증을 시도합니다. (개발 중 `META_APP_SECRET` 미설정 시 검증 생략)

### 9.3 로컬에서 테스트할 때

1. `npm start` 로 서버 실행.
2. **ngrok** 등: `ngrok http 8080` → 나온 `https://xxxx.ngrok.io` 로 공개.
3. Webhook Callback 을 `https://xxxx.ngrok.io/api/webhooks/instagram` 로 등록.
4. Meta에서 **테스트 이벤트**를 보내거나, 권한이 허용된 계정으로 DM을 보내 **이벤트가 수신되는지** 확인합니다.

### 9.4 API 엔드포인트

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/webhooks/instagram` | GET | Meta 구독 검증 (`hub.verify_token` = `META_VERIFY_TOKEN`) |
| `/api/webhooks/instagram` | POST | Meta 이벤트 수신 (`X-Hub-Signature-256` + `META_APP_SECRET`) |
| `/api/integrations/inbox` | GET | 최근 수신 이벤트 조회(디버그). `?limit=20` |

**카카오톡 채팅 연동 API**는 코드베이스에서 제거했습니다. 카카오톡은 **대화 내보내기(.txt)** 로 웹 화면에 넣는 방식을 사용하세요.
