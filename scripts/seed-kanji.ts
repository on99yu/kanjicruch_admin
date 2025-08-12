// scripts/seed-kanji.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const word = await prisma.kanjiWord.create({
    data: {
      word: "貴重",
      reading: "きちょう",
      meaning: "귀중함, 소중함",
      kanjiList: {
        create: [
          {
            kanji: "貴",
            onyomi: "キ",
            kunyomi: "とうとい（귀중하다）",
            position: 1,
          },
          {
            kanji: "重",
            onyomi: "チョウ",
            kunyomi: "おもい（무겁다）",
            position: 2,
          },
        ],
      },
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());