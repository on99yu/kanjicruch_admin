-- Neon(PostgreSQL) SQL Editor에서 사용자가 한 번만 실행하는 수동 마이그레이션입니다.
-- 기존 사용자는 관리자, 이후 새 사용자는 학습자로 생성됩니다.

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'LEARNER');

ALTER TABLE "User"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'ADMIN';

ALTER TABLE "User"
ALTER COLUMN "role" SET DEFAULT 'LEARNER';

CREATE TABLE "AppSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudyAttempt" (
    "id" TEXT NOT NULL,
    "clientEventId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "wordId" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserWordProgress" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "wordId" INTEGER NOT NULL,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "lastResult" BOOLEAN,
    "lastAnsweredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserWordProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppSession_tokenHash_key" ON "AppSession"("tokenHash");
CREATE INDEX "AppSession_userId_idx" ON "AppSession"("userId");
CREATE INDEX "AppSession_expiresAt_idx" ON "AppSession"("expiresAt");
CREATE UNIQUE INDEX "StudyAttempt_clientEventId_key" ON "StudyAttempt"("clientEventId");
CREATE INDEX "StudyAttempt_userId_answeredAt_idx" ON "StudyAttempt"("userId", "answeredAt");
CREATE INDEX "StudyAttempt_userId_wordId_idx" ON "StudyAttempt"("userId", "wordId");
CREATE UNIQUE INDEX "UserWordProgress_userId_wordId_key" ON "UserWordProgress"("userId", "wordId");
CREATE INDEX "UserWordProgress_userId_lastAnsweredAt_idx" ON "UserWordProgress"("userId", "lastAnsweredAt");

ALTER TABLE "AppSession"
ADD CONSTRAINT "AppSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudyAttempt"
ADD CONSTRAINT "StudyAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudyAttempt"
ADD CONSTRAINT "StudyAttempt_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "KanjiWord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserWordProgress"
ADD CONSTRAINT "UserWordProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserWordProgress"
ADD CONSTRAINT "UserWordProgress_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "KanjiWord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
