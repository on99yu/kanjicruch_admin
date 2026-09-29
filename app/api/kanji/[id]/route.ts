import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateKanjiInput } from "@/lib/kanji-validation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 수정 API
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const params = await context.params;
    const id = Number(params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 }); //400 Bad Request
    }

    const result = validateKanjiInput(await request.json());
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    const { word, reading, meaning, kanjiList } = result.data;
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
      if (kanjiList.length > 0) {
        await tx.kanjiChar.createMany({
          data: kanjiList.map((kanji, index) => ({
            ...kanji,
            position: index + 1,
            wordId: id,
          })),
        });
      }

      return tx.kanjiWord.findUniqueOrThrow({
        where: { id: updated.id },
        include: { kanjiList: { orderBy: { position: "asc" } } },
      });
    });

    return NextResponse.json(updatedWord);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "JSON 형식이 올바르지 않습니다." }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "이미 등록된 단어입니다." }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "단어를 찾을 수 없습니다." }, { status: 404 });
      }
    }
    console.error("PUT /api/kanjiWord/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 삭제 API
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
 const session = await getServerSession(authOptions);
 if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const params = await context.params;
 const id = Number(params.id);
 if (!Number.isSafeInteger(id) || id <= 0) {
  return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
 }
 try{
  await prisma.kanjiWord.delete({
    where: {id},
  })
  return new NextResponse(null, {status: 204});
 }catch(error){
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return NextResponse.json({error: "단어를 찾을 수 없습니다."}, {status: 404});
  }
  console.error("DELETE /api/kanjiWord/[id] error:", error);
  return NextResponse.json({error: "Internal Server Error"}, {status: 500} );
 }
}
