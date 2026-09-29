export type KanjiInput = {
  word: string;
  reading: string;
  meaning: string;
  kanjiList: {
    kanji: string;
    onyomi: string;
    kunyomi: string;
  }[];
};

type ValidationResult =
  | { ok: true; data: KanjiInput }
  | { ok: false; error: string };

const LIMITS = {
  word: 100,
  reading: 200,
  meaning: 1_000,
  kanji: 16,
  pronunciation: 200,
  kanjiList: 32,
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requiredString = (
  value: unknown,
  label: string,
  maxLength: number
): { ok: true; value: string } | { ok: false; error: string } => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, error: `${label}은(는) 필수입니다.` };
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    return { ok: false, error: `${label}은(는) ${maxLength}자 이하여야 합니다.` };
  }

  return { ok: true, value: trimmed };
};

const optionalString = (
  value: unknown,
  label: string,
  maxLength: number
): { ok: true; value: string } | { ok: false; error: string } => {
  if (value === undefined || value === null) {
    return { ok: true, value: "" };
  }
  if (typeof value !== "string") {
    return { ok: false, error: `${label} 형식이 올바르지 않습니다.` };
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    return { ok: false, error: `${label}은(는) ${maxLength}자 이하여야 합니다.` };
  }

  return { ok: true, value: trimmed };
};

export const validateKanjiInput = (value: unknown): ValidationResult => {
  if (!isRecord(value)) {
    return { ok: false, error: "요청 본문 형식이 올바르지 않습니다." };
  }

  const word = requiredString(value.word, "단어", LIMITS.word);
  if (!word.ok) return word;
  const reading = requiredString(value.reading, "발음", LIMITS.reading);
  if (!reading.ok) return reading;
  const meaning = requiredString(value.meaning, "의미", LIMITS.meaning);
  if (!meaning.ok) return meaning;

  if (!Array.isArray(value.kanjiList)) {
    return { ok: false, error: "한자 목록 형식이 올바르지 않습니다." };
  }
  if (value.kanjiList.length > LIMITS.kanjiList) {
    return {
      ok: false,
      error: `한자는 최대 ${LIMITS.kanjiList}개까지 저장할 수 있습니다.`,
    };
  }

  const kanjiList: KanjiInput["kanjiList"] = [];
  for (let index = 0; index < value.kanjiList.length; index += 1) {
    const item = value.kanjiList[index];
    if (!isRecord(item)) {
      return { ok: false, error: `${index + 1}번째 한자 형식이 올바르지 않습니다.` };
    }

    const kanji = requiredString(item.kanji, "한자", LIMITS.kanji);
    if (!kanji.ok) return { ok: false, error: `${index + 1}번째 ${kanji.error}` };
    const onyomi = optionalString(item.onyomi, "음독", LIMITS.pronunciation);
    if (!onyomi.ok) return { ok: false, error: `${index + 1}번째 ${onyomi.error}` };
    const kunyomi = optionalString(item.kunyomi, "훈독", LIMITS.pronunciation);
    if (!kunyomi.ok) return { ok: false, error: `${index + 1}번째 ${kunyomi.error}` };

    kanjiList.push({
      kanji: kanji.value,
      onyomi: onyomi.value,
      kunyomi: kunyomi.value,
    });
  }

  return {
    ok: true,
    data: {
      word: word.value,
      reading: reading.value,
      meaning: meaning.value,
      kanjiList,
    },
  };
};
