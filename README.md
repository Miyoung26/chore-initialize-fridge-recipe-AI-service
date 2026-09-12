# 냉장고 한끼 🥕

냉장고 속 재료와 조리 조건을 입력하면 AI가 맞춤 가정식 레시피를 제안하는 반응형 웹 서비스입니다.

## 주요 기능
- 재료, 조리 시간, 난이도, 도구, 제외 재료, 인분 입력
- AI가 메뉴, 재료 분량, 조리 순서, 대체 재료, 남은 재료 활용 팁 생성
- 빈 입력, API 오류, 30초 타임아웃 안내
- 모바일·태블릿·데스크톱 반응형 UI
- 다크 모드와 결과 복사 기능

## 기술 스택
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Vercel Python Serverless Function
- AI: OpenAI Responses API
- Deployment: GitHub + Vercel

## 프로젝트 구조
```text
fridge-chef-ai/
├── api/generate.py
├── css/style.css
├── js/app.js
├── docs/
├── images/
├── index.html
├── requirements.txt
├── vercel.json
└── .env.example
```

## 로컬 실행
정적 화면만 확인하려면 프로젝트 루트에서 다음을 실행합니다.
```bash
python -m http.server 8000
```
정적 서버만 실행하면 `/api/generate`는 동작하지 않습니다. 전체 기능은 Vercel CLI 또는 배포 환경에서 확인하세요.

```bash
npm install -g vercel
vercel dev
```
로컬 환경 변수는 `.env.local`에 설정합니다.
```env
OPENAI_API_KEY=실제_API_키
OPENAI_MODEL=gpt-5-mini
```

## Vercel 배포
1. 이 폴더를 GitHub 저장소에 push합니다.
2. Vercel에서 **Add New > Project**로 저장소를 연결합니다.
3. Project Settings > Environment Variables에 `OPENAI_API_KEY`를 등록합니다.
4. 필요하면 `OPENAI_MODEL`을 등록합니다.
5. 배포 후 `/api/generate`와 전체 UI를 점검합니다.

> API 키는 코드, README, 스크린샷, Git 기록에 절대로 입력하지 마세요. 노출됐다면 즉시 폐기하고 재발급하세요.

## 배포 URL
- 제출 전 아래 주소를 실제 URL로 교체하세요.
- `https://YOUR-PROJECT.vercel.app`

## 테스트
| 번호 | 시나리오 | 입력 | 기대 결과 |
|---|---|---|---|
| TC-01 | 정상 입력 | 달걀 2개, 토마토, 밥 | 레시피 카드 표시 |
| TC-02 | 빈 입력 | 재료 없음 | 필수 입력 안내 |
| TC-03 | 제외 재료 | 우유 제외 | 결과에 우유 미포함 |
| TC-04 | 긴 입력 | 200자 이상 | 30초 내 결과 또는 지연 안내 |
| TC-05 | API 키 없음 | 서버 환경 변수 제거 | 설정 오류 안내 |
| TC-06 | 모바일 | 375px 너비 | 가로 스크롤 없이 1열 표시 |

## 커밋 이력 예시
```text
chore: initialize project structure
feat: build responsive landing sections
feat: add recipe input form and validation
feat: connect Python AI recipe API
feat: add loading timeout and error states
feat: add dark mode and copy action
docs: add plan test cases and deployment guide
```

## 제한 및 안전 안내
AI 결과는 참고용입니다. 사용자는 알레르기 유발 식품, 교차 오염, 식재료 상태, 충분한 가열 여부를 직접 확인해야 합니다. 이 서비스는 의료 또는 영양 진단을 제공하지 않습니다.
