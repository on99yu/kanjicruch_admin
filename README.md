# KanjiCrush Admin & API

KanjiCrush 모바일 앱이 사용하는 단어 API와 관리자 화면을 함께 제공하는 Next.js 프로젝트입니다.

## 구성

- Next.js App Router 관리자 화면
- NextAuth Credentials 로그인
- Prisma + PostgreSQL
- 공개 읽기 API: `GET /api/kanji`
- 서버·DB 상태 확인: `GET /api/health`
- 로그인 필요: 단어 추가, 수정, 삭제, CSV 업로드

## 로컬 실행

Node.js 22 LTS를 사용합니다. `nvm`을 사용한다면 프로젝트 루트에서 `nvm use`로 맞춥니다.

```bash
npm ci
cp .env.example .env.local
npx prisma generate
npm run dev
```

브라우저에서 <http://localhost:3000>에 접속합니다.

`.env.local`의 `DATABASE_URL`에는 운영 DB 대신 별도의 개발용 PostgreSQL/Neon 브랜치를 사용하세요. 관리자 로그인을 하려면 개발 DB의 `User` 테이블에 bcrypt로 해시한 비밀번호가 저장된 사용자가 필요합니다.

비밀번호 해시는 평문을 소스에 적지 않고 다음처럼 생성합니다.

```bash
ADMIN_PASSWORD='새 비밀번호' node scripts/generate-hash.js
```

## 검증

```bash
npm run lint
npm run build
```

## 배포

운영 환경은 Vercel의 `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` 환경변수를 사용합니다. 운영 DB의 `DATABASE_URL`은 Production에만 연결하고, Preview와 Development에는 별도의 Neon 브랜치를 사용하세요. 로컬에서 운영 환경변수를 내려받았다면 관리자 변경 작업을 실행하지 않도록 주의하세요.

배포 후에는 단어 전체를 다운로드하지 않고 헬스체크로 서버와 DB 연결을 먼저 확인합니다.

```bash
curl --fail --show-error https://kanjicruch-admin.vercel.app/api/health
```

정상이면 `{"status":"ok","database":"ok"}`가 반환됩니다. 그다음 로그인, 관리자 페이지, 공개 단어 API 순서로 확인합니다.
