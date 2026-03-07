# FE Server - CLAUDE.md

## 기술 스택
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui (컴포넌트 라이브러리)
- Bun (패키지 매니저)

## 개발 서버 실행
```bash
bun dev
```

## 빌드 & 배포
```bash
docker-compose up -d --build
```

## 환경 변수
- `NEXT_PUBLIC_API_BASE_URL`: API 서버 주소 (예: http://localhost:8080)
- `.env.local` 파일에 정의 (`.env.local.example` 참고)

## API 호출 규칙
- 모든 API 호출은 `lib/api.ts`를 통해 중앙화
- fetch 사용, axios 사용 금지
- 에러 핸들링은 각 호출부에서 처리

## 컴포넌트 규칙
- UI 컴포넌트는 shadcn/ui 우선 사용 (`bunx shadcn@latest add [component]`)
- 커스텀 컴포넌트는 `components/` 하위에 작성
- 스타일은 Tailwind CSS 클래스 사용, 별도 CSS 파일 작성 금지

## 파일 구조 규칙
- 새 페이지: `app/[feature]/page.tsx`
- 공통 레이아웃: `app/layout.tsx`
- 서버 컴포넌트를 기본으로 사용, 클라이언트 상태가 필요한 경우에만 `"use client"` 추가
