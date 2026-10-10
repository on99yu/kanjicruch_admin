import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/app-auth";
import { prisma } from "@/lib/prisma";

export function OPTIONS() { return new NextResponse(null, { status: 204 }); }

export async function GET(request: NextRequest) {
  const session = await getAppSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const offset = Number(request.nextUrl.searchParams.get("offset") ?? "-540");
  if (!Number.isInteger(offset) || Math.abs(offset) > 840) {
    return NextResponse.json({ error: "Invalid timezone offset" }, { status: 400 });
  }
  const offsetMs = offset * 60_000;
  const now = new Date(Date.now() - offsetMs);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const firstDay = today - 29 * 86_400_000;
  const attempts = await prisma.studyAttempt.findMany({
    where: { userId: session.userId, answeredAt: { gte: new Date(firstDay + offsetMs), lt: new Date(today + 86_400_000 + offsetMs) } },
    select: { wordId: true, isCorrect: true, answeredAt: true },
  });
  const buckets = Array.from({ length: 30 }, (_, index) => ({
    date: new Date(firstDay + index * 86_400_000).toISOString().slice(0, 10),
    words: new Set<number>(), answers: 0, correct: 0,
  }));
  const byDate = new Map(buckets.map((bucket) => [bucket.date, bucket]));
  for (const attempt of attempts) {
    const key = new Date(attempt.answeredAt.getTime() - offsetMs).toISOString().slice(0, 10);
    const bucket = byDate.get(key);
    if (!bucket) continue;
    bucket.words.add(attempt.wordId);
    bucket.answers += 1;
    if (attempt.isCorrect) bucket.correct += 1;
  }
  return NextResponse.json({
    days: buckets.map(({ date, words, answers, correct }) => ({ date, wordCount: words.size, answers, correct })),
  }, { headers: { "Cache-Control": "no-store" } });
}
