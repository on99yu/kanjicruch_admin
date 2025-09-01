import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { prisma } from "../lib/prisma"; // Prisma Client 경로 확인
import { SQLiteKanjiWord, SQLiteKanjiChar } from "../types/type";

async function migrate() {
  // 1️⃣ SQLite dev.db 열기
  const db = await open({ filename: "./prisma/dev.db", driver: sqlite3.Database });

  // 2️⃣ KanjiWord 읽기
  const words: SQLiteKanjiWord[] = await db.all("SELECT * FROM KanjiWord");
  console.log(`총 ${words.length}개의 KanjiWord 레코드 발견`);

  for (const w of words) {
    // 3️⃣ KanjiChar 읽기
    const kanjiList: SQLiteKanjiChar[] = await db.all(
      "SELECT * FROM KanjiChar WHERE wordId = ? ORDER BY position",
      [w.id]
    );

    // 4️⃣ Neon DB에 삽입 (upsert)
    await prisma.kanjiWord.upsert({
      where: { word: w.word },
      update: {
        reading: w.reading,
        meaning: w.meaning,
        kanjiList: {
          deleteMany: {},
          create: kanjiList.map((k) => ({
            kanji: k.kanji,
            onyomi: k.onyomi,
            kunyomi: k.kunyomi || "",
            position: k.position,
          })),
        },
      },
      create: {
        word: w.word,
        reading: w.reading,
        meaning: w.meaning,
        kanjiList: {
          create: kanjiList.map((k) => ({
            kanji: k.kanji,
            onyomi: k.onyomi,
            kunyomi: k.kunyomi || "",
            position: k.position,
          })),
        },
      },
    });
  }

  console.log("SQLite → Neon 마이그레이션 완료!");
  await db.close();
}

migrate().catch((err) => {
  console.error("마이그레이션 중 오류:", err);
});
