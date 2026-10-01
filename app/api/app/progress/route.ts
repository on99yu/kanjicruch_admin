import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/app-auth";
import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS_PER_SYNC = 500;

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

type AttemptInput = {
  clientEventId: string;
  wordId: number;
  isCorrect: boolean;
  answeredAt: Date;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const serializeProgress = (progress: {
  wordId: number;
  correctCount: number;
  wrongCount: number;
  lastResult: boolean | null;
  lastAnsweredAt: Date | null;
}) => ({
  wordId: progress.wordId,
  correctCount: progress.correctCount,
  wrongCount: progress.wrongCount,
  lastResult: progress.lastResult,
  lastAnsweredAt: progress.lastAnsweredAt?.getTime() ?? null,
});

function parseAttempts(value: unknown): AttemptInput[] | null {
  if (!isRecord(value) || !Array.isArray(value.attempts)) return null;
  if (value.attempts.length > MAX_ATTEMPTS_PER_SYNC) return null;

  const parsed: AttemptInput[] = [];
  for (const item of value.attempts) {
    if (
      !isRecord(item) ||
      typeof item.clientEventId !== "string" ||
      item.clientEventId.length < 8 ||
      item.clientEventId.length > 100 ||
      !Number.isSafeInteger(item.wordId) ||
      (item.wordId as number) <= 0 ||
      typeof item.isCorrect !== "boolean" ||
      typeof item.answeredAt !== "string"
    ) {
      return null;
    }

    const answeredAt = new Date(item.answeredAt);
    if (Number.isNaN(answeredAt.getTime())) return null;

    parsed.push({
      clientEventId: item.clientEventId,
      wordId: item.wordId as number,
      isCorrect: item.isCorrect,
      answeredAt,
    });
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  const session = await getAppSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progress = await prisma.userWordProgress.findMany({
    where: { userId: session.userId },
    orderBy: { wordId: "asc" },
  });

  return NextResponse.json({ progress: progress.map(serializeProgress) });
}

export async function POST(request: NextRequest) {
  const session = await getAppSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const attempts = parseAttempts(body);
  if (!attempts) {
    return NextResponse.json(
      { error: `학습 기록 형식이 올바르지 않거나 ${MAX_ATTEMPTS_PER_SYNC}개를 초과했습니다.` },
      { status: 400 }
    );
  }

  const affectedWordIds = [...new Set(attempts.map((item) => item.wordId))];
  if (affectedWordIds.length > 0) {
    const existingWords = await prisma.kanjiWord.count({
      where: { id: { in: affectedWordIds } },
    });
    if (existingWords !== affectedWordIds.length) {
      return NextResponse.json({ error: "존재하지 않는 단어가 포함되어 있습니다." }, { status: 400 });
    }
  }

  const progress = await prisma.$transaction(async (tx) => {
    if (attempts.length > 0) {
      await tx.studyAttempt.createMany({
        data: attempts.map((attempt) => ({
          ...attempt,
          userId: session.userId,
        })),
        skipDuplicates: true,
      });

      const counts = await tx.studyAttempt.groupBy({
        by: ["wordId", "isCorrect"],
        where: {
          userId: session.userId,
          wordId: { in: affectedWordIds },
        },
        _count: { _all: true },
      });

      const latest = await tx.studyAttempt.findMany({
        where: {
          userId: session.userId,
          wordId: { in: affectedWordIds },
        },
        orderBy: { answeredAt: "desc" },
        distinct: ["wordId"],
      });

      const countByWord = new Map<number, { correct: number; wrong: number }>();
      for (const count of counts) {
        const current = countByWord.get(count.wordId) ?? { correct: 0, wrong: 0 };
        if (count.isCorrect) current.correct = count._count._all;
        else current.wrong = count._count._all;
        countByWord.set(count.wordId, current);
      }

      for (const item of latest) {
        const count = countByWord.get(item.wordId) ?? { correct: 0, wrong: 0 };
        await tx.userWordProgress.upsert({
          where: {
            userId_wordId: { userId: session.userId, wordId: item.wordId },
          },
          create: {
            userId: session.userId,
            wordId: item.wordId,
            correctCount: count.correct,
            wrongCount: count.wrong,
            lastResult: item.isCorrect,
            lastAnsweredAt: item.answeredAt,
          },
          update: {
            correctCount: count.correct,
            wrongCount: count.wrong,
            lastResult: item.isCorrect,
            lastAnsweredAt: item.answeredAt,
          },
        });
      }
    }

    return tx.userWordProgress.findMany({
      where: { userId: session.userId },
      orderBy: { wordId: "asc" },
    });
  });

  return NextResponse.json({ progress: progress.map(serializeProgress) });
}
