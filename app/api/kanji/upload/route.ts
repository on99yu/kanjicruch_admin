import { KanjiCSVRow } from "@/types/type";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 업로드된 단어 입력 API
export async function POST(req: NextRequest) {
  try {
    const data: KanjiCSVRow[] = await req.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "빈 데이터입니다" }, { status: 400 });
    }
    // 전처리: 빈 값 제거 및 필수 값 확인
    const cleanedRows = data
      .map((row) => {
        const kanjiList = [
          row.한자1
            ? {
                kanji: row.한자1.trim(),
                onyomi: row.음독1?.trim() || "",
                kunyomi: row.훈독1?.trim() || "",
                position: 1,
              }
            : null,
          row.한자2
            ? {
                kanji: row.한자2.trim(),
                onyomi: row.음독2?.trim() || "",
                kunyomi: row.훈독2?.trim() || "",
                position: 2,
              }
            : null,
          row.한자3
            ? {
                kanji: row.한자3.trim(),
                onyomi: row.음독3?.trim() || "",
                kunyomi: row.훈독3?.trim() || "",
                position: 3,
              }
            : null,
          row.한자4
            ? {
                kanji: row.한자4.trim(),
                onyomi: row.음독4?.trim() || "",
                kunyomi: row.훈독4?.trim() || "",
                position: 4,
              }
            : null,
        ].filter(
          (
            item
          ): item is {
            kanji: string;
            onyomi: string;
            kunyomi: string;
            position: number;
          } => item !== null
        );

        return {
          word: row.단어?.trim(),
          reading: row.발음?.trim(),
          meaning: row.의미?.trim(),
          kanjiList,
        };
      })
      .filter((row) => row.word && row.reading && row.meaning);

    await prisma.$transaction(
      cleanedRows.map((row) =>
        prisma.kanjiWord.upsert({
          where: { word: row.word },
          update: {
            reading: row.reading,
            meaning: row.meaning,
            kanjiList: {
              deleteMany: {}, // 기존 한자들 삭제
              create: row.kanjiList,
            },
          },
          create: {
            word: row.word,
            reading: row.reading,
            meaning: row.meaning,
            kanjiList: {
              create: row.kanjiList,
            },
          },
        })
      )
    );

    return NextResponse.json({
      message: `저장 완료 (${cleanedRows.length}개)`,
    });
  } catch (error) {
    console.error("DB 저장 오류:", error);
    return NextResponse.json({ error: "서버 에러" }, { status: 500 });
  }
}
