import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = Number(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 }); //400 Bad Request
    }

    const body = await request.json();
    const { word, reading, meaning, kanjiList } = body;
    if (!word || !reading || !meaning || !Array.isArray(kanjiList)) {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
        { status: 400 }
      ); //400 Bad Request
    }
    // 트랜잭션 처리
    const updatedWord = await prisma.$transaction(async (tx) => {
      // 1. KanjiWord 업데이트
      const updated = await tx.kanjiWord.update({
        where: { id },
        data: { word, reading, meaning },
      });

      // 2. 기존 KanjiChar 전부 삭제
      await tx.kanjiChar.deleteMany({
        where: { wordId: id },
      });

      // 3. 새로운 KanjiChar들 생성
      for (let i = 0; i < kanjiList.length; i++) {
        const { kanji, onyomi, kunyomi } = kanjiList[i];
        await tx.kanjiChar.create({
          data: {
            kanji,
            onyomi,
            kunyomi,
            position: i + 1,
            wordId: id,
          },
        });
      }

      return updated;
    });

    return NextResponse.json(updatedWord);
  } catch (error) {
    console.error("PUT /api/kanjiWord/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
