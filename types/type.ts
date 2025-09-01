export type KanjiCSVRow = {
  단어: string;
  발음: string;
  의미: string;
  한자1: string;
  음독1: string;
  훈독1: string;
  한자2?: string;
  음독2?: string;
  훈독2?: string;
  한자3?: string;
  음독3?: string;
  훈독3?: string;
  한자4?: string;
  음독4?: string;
  훈독4?: string;
};

export type KanjiTableRow ={
  id: number;
  word: string;
  reading: string;
  meaning: string;
  kanjiList: {
    kanji: string;
    onyomi: string;
    kunyomi: string;
    position: number;
  }[];
}

export type SQLiteKanjiWord = {
  id: number;
  word: string;
  reading: string;
  meaning: string;
};

// SQLite에서 읽어오는 KanjiChar
export type SQLiteKanjiChar = {
  id: number;
  kanji: string;
  onyomi: string;
  kunyomi: string | null;
  position: number;
  wordId: number;
};