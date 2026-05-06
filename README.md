# 오늘의 식탁

민사고 급식표를 참고해 집에서 만들 수 있는 월간 집밥 식단 캘린더를 제공하는 React + Vite 모바일 웹앱입니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 보통 `http://localhost:5173` 또는 `http://127.0.0.1:5173`으로 열립니다.

## 수정 위치

- 앱 이름, 문구, 버튼명, 탭 이름: `src/config/appConfig.js`
- 색상과 폰트: `src/styles.css`
- 기본 식단: `src/data/mealPlans.js`
- 기본 장보기 리스트: `src/data/shoppingLists.js`
- 월간 내장 식단: `src/data/monthlyMealPlans.js`
- 월간 장보기 확장 구조: `src/data/monthlyShoppingLists.js`
- 식단 제목: `meal.shortTitle`을 수정하면 홈, 캘린더, 식단표에 공통 반영됩니다.

## 민사고 급식 API 연동

1. 나이스 교육정보 개방포털에서 API 키를 발급받습니다.
2. 프로젝트 루트에 `.env.local` 파일을 만듭니다.
3. 아래 값을 입력합니다.

```env
VITE_NEIS_API_KEY=발급받은_키
```

4. 로컬에서 다시 실행합니다.

```bash
npm run dev
```

Vercel 배포 시에는 Vercel Project Settings의 Environment Variables에 `VITE_NEIS_API_KEY`를 추가한 뒤 Redeploy 하면 됩니다.

API 키가 없거나 호출이 실패하면 앱은 내장된 월간 식단 데이터와 기존 기본 식단으로 자동 fallback 됩니다. 프론트엔드 환경변수는 완전한 비밀키 보관용이 아니므로, 추후 정식 서비스에서는 Vercel Serverless Function으로 프록시 처리하는 것을 권장합니다.

## 배포 방법

Vercel 프로젝트가 GitHub 저장소와 연결되어 있다면 아래 순서로 배포됩니다.

```bash
git add .
git commit -m "update"
git push
```

푸시 후 Vercel에서 자동 배포가 진행됩니다.
