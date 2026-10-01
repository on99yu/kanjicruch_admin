import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateKanjiInput } from "@/lib/kanji-validation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const publicApiHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: publicApiHeaders });
}

// 전체 단어 목록 조회 API
export async function GET(){
    try{
        const words = await prisma.kanjiWord.findMany({
            include:{
                kanjiList:{
                    orderBy: { position: "asc" },
                }
            },
            orderBy: { id: "asc" },
        })

        return NextResponse.json(words, {
          status: 200,
          headers: publicApiHeaders,
        });
    }catch(error){
        console.error("GET /api/kanjiWord/ 요청 에러:", error);
        return NextResponse.json({error: "Internal Server Error"}, {status: 500});
    }

}

// 단어 추가 API
export async function POST(request: Request){
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try{
    const result = validateKanjiInput(await request.json());
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const { word, reading, meaning, kanjiList } = result.data;
    const createdWord = await prisma.kanjiWord.create({
      data: {
        word,
        reading,
        meaning,
        kanjiList: {
          create: kanjiList.map((k, i) => ({
            kanji: k.kanji,
            onyomi: k.onyomi,
            kunyomi: k.kunyomi,
            position: i + 1,
          })),
        },
      },
      include: { kanjiList: true },
    });

    return NextResponse.json(createdWord, {status: 201}); //201 Created
  }catch(error){
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "JSON 형식이 올바르지 않습니다." }, { status: 400 });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "이미 등록된 단어입니다." }, { status: 409 });
    }
    console.error("POST /api/kanjiWord/[id] error:", error);
    return NextResponse.json({error: "Internal Server Error"}, {status: 500} );
  }
}
