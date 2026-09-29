// app/admin/kanji/page.tsx
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import KanjiTable from "../../components/KanjiTable";

type KanjiPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

const PAGE_SIZE = 100;

export default async function KanjiPage({ searchParams }: KanjiPageProps) {

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const where: Prisma.KanjiWordWhereInput = query
    ? {
        OR: [
          { word: { contains: query, mode: "insensitive" } },
          { reading: { contains: query, mode: "insensitive" } },
          { meaning: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  const total = await prisma.kanjiWord.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(
    totalPages,
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1
  );

  const words = await prisma.kanjiWord.findMany({
    where,
    include: {
      kanjiList: {
        orderBy: {
          position: "asc", // 1~4 순서대로 보장
        },
      },
    },
    orderBy: { id: "asc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const pageHref = (targetPage: number) => {
    const nextParams = new URLSearchParams();
    if (query) nextParams.set("q", query);
    nextParams.set("page", String(targetPage));
    return `/admin/kanji?${nextParams.toString()}`;
  };

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
        <Link
          className="mb-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-700"
          href="/admin/kanji/upload"
        >
          CSV 업로드
        </Link>
      </div>
      <form method="get" className="flex max-w-2xl gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="단어, 발음, 의미 검색"
          className="flex-1 rounded border px-3 py-2"
        />
        <button className="rounded bg-slate-800 px-4 py-2 text-white" type="submit">
          검색
        </button>
        {query && (
          <Link className="rounded border px-4 py-2" href="/admin/kanji">
            초기화
          </Link>
        )}
      </form>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          총 {total.toLocaleString()}개 · {page} / {totalPages} 페이지
        </p>
        <div className="flex gap-2">
          {page > 1 && (
            <Link className="rounded border px-3 py-1" href={pageHref(page - 1)}>
              이전
            </Link>
          )}
          {page < totalPages && (
            <Link className="rounded border px-3 py-1" href={pageHref(page + 1)}>
              다음
            </Link>
          )}
        </div>
      </div>
      <KanjiTable words={safeWords} startIndex={(page - 1) * PAGE_SIZE} />
    </div>
  );
}
