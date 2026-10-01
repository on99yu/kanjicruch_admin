import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isRecord, validateKanjiInput } from "@/lib/kanji-validation";
import { prisma } from "@/lib/prisma";

const MAX_UPLOAD_ROWS = 5_000;
const MAX_BODY_BYTES = 5 * 1024 * 1024;

// 업로드된 단어 입력 API
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentLength = Number(req.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "업로드 파일은 5MB 이하여야 합니다." },
        { status: 413 }
      );
    }

    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "업로드 파일은 5MB 이하여야 합니다." },
        { status: 413 }
      );
    }

    const data: unknown = JSON.parse(rawBody);

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "빈 데이터입니다" }, { status: 400 });
    }
    if (data.length > MAX_UPLOAD_ROWS) {
      return NextResponse.json(
        { error: `한 번에 최대 ${MAX_UPLOAD_ROWS}개까지 업로드할 수 있습니다.` },
        { status: 413 }
      );
    }

    const cleanedRows = [];
    const invalidRows: string[] = [];
    const seenWords = new Map<string, number>();

    for (let index = 0; index < data.length; index += 1) {
      const row = data[index];
      if (!isRecord(row)) {
        invalidRows.push(`${index + 2}행: 행 형식이 올바르지 않습니다.`);
        continue;
      }

        const kanjiList = [
          row.한자1
            ? {
                kanji: row.한자1,
                onyomi: row.음독1,
                kunyomi: row.훈독1,
              }
            : null,
          row.한자2
            ? {
                kanji: row.한자2,
                onyomi: row.음독2,
                kunyomi: row.훈독2,
              }
            : null,
          row.한자3
            ? {
                kanji: row.한자3,
                onyomi: row.음독3,
                kunyomi: row.훈독3,
              }
            : null,
          row.한자4
            ? {
                kanji: row.한자4,
                onyomi: row.음독4,
                kunyomi: row.훈독4,
              }
            : null,
        ].filter((item) => item !== null);

      const result = validateKanjiInput({
          word: row.단어,
          reading: row.발음,
          meaning: row.의미,
          kanjiList,
      });

      if (!result.ok) {
        invalidRows.push(`${index + 2}행: ${result.error}`);
        continue;
      }

      const previousRow = seenWords.get(result.data.word);
      if (previousRow !== undefined) {
        invalidRows.push(
          `${index + 2}행: ${previousRow}행과 중복된 단어입니다 (${result.data.word}).`
        );
        continue;
      }

      seenWords.set(result.data.word, index + 2);
      cleanedRows.push(result.data);
    }

    if (invalidRows.length > 0) {
      return NextResponse.json(
        {
          error: `올바르지 않은 행이 ${invalidRows.length}개 있습니다.`,
          details: invalidRows.slice(0, 10),
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      cleanedRows.map((row) =>
        prisma.kanjiWord.upsert({
          where: { word: row.word },
          update: {
            reading: row.reading,
            meaning: row.meaning,
            kanjiList: {
              deleteMany: {}, // 기존 한자들 삭제
              create: row.kanjiList.map((kanji, index) => ({
                ...kanji,
                position: index + 1,
              })),
            },
          },
          create: {
            word: row.word,
            reading: row.reading,
            meaning: row.meaning,
            kanjiList: {
              create: row.kanjiList.map((kanji, index) => ({
                ...kanji,
                position: index + 1,
              })),
            },
          },
        })
      )
    );

    return NextResponse.json({
      message: `저장 완료 (${cleanedRows.length}개)`,
      count: cleanedRows.length,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "JSON 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }
    console.error("DB 저장 오류:", error);
    return NextResponse.json({ error: "서버 에러" }, { status: 500 });
  }
}
