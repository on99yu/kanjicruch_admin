import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

        return NextResponse.json(words, {status: 200}); //200 OK
    }catch(error){
        console.error("GET /api/kanjiWord/ 요청 에러:", error);
        return NextResponse.json({error: "Internal Server Error"}, {status: 500});
    }

}

export async function POST(request: Request){
  console.log("POST /api/kanjiWord/ 요청 받음");
  try{
    const data = await request.json();
    const { word, reading, meaning, kanjiList} = data;
    if(!word || !reading || !meaning || !Array.isArray(kanjiList)){
      return NextResponse.json({error: "Missing or invalid fields"}, {status: 400}); //400 Bad Request
    }
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
    console.error("POST /api/kanjiWord/[id] error:", error);
    return NextResponse.json({error: "Internal Server Error"}, {status: 500} );
  }
}