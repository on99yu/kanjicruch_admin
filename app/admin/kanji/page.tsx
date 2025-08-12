// app/admin/kanji/page.tsx
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import KanjiTable from "../../components/KanjiTable";

export default async function KanjiPage() {

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const words = await prisma.kanjiWord.findMany({
    include: {
      kanjiList: {
        orderBy: {
          position: "asc", // 1~4 순서대로 보장
        },
      },
    },
  });

  const safeWords = words.map((word)=>({
    ...word,
    kanjiList: word.kanjiList.map((k)=>({
      ...k,
      kunyomi: k.kunyomi ?? "",
    })),
  }));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center space-x-16">
        <h1 className="text-2xl font-bold mb-4">한자 관리 페이지</h1>
        <button className="mb-4 px-4 py-2  text-white rounded hover:bg-blue-700 bg-blue-500">
          <Link href="/admin/kanji/upload">한자 업로드 하러가기</Link>
        </button>
      </div>
      <KanjiTable words={safeWords} />
    </div>
  );
}
