-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_KanjiChar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kanji" TEXT NOT NULL,
    "onyomi" TEXT NOT NULL,
    "kunyomi" TEXT,
    "position" INTEGER NOT NULL,
    "wordId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KanjiChar_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "KanjiWord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_KanjiChar" ("createdAt", "id", "kanji", "kunyomi", "onyomi", "position", "wordId") SELECT "createdAt", "id", "kanji", "kunyomi", "onyomi", "position", "wordId" FROM "KanjiChar";
DROP TABLE "KanjiChar";
ALTER TABLE "new_KanjiChar" RENAME TO "KanjiChar";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
