"use client";
import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { KanjiTableRow } from "@/types/type";

type Props = {
  word: KanjiTableRow;
  onClose: () => void;
  isOpen: boolean;
  onUpdate: (updateWord: KanjiTableRow) => void;
  onDelete: (id: number) => void;
};

export default function EditModal({ word, onClose, isOpen,onUpdate, onDelete }: Props) {
  const [editedWord, setEditedWord] = useState(word.word);
  const [editedReading, setEditedReading] = useState(word.reading);
  const [editedMeaning, setEditedMeaning] = useState(word.meaning);
  const [editedKanjiList, setEditedKanjiList] = useState(word.kanjiList);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/kanji/${word.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: editedWord,
          reading: editedReading,
          meaning: editedMeaning,
          kanjiList: editedKanjiList,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`저장 실패: ${errorData.error || "알 수 없는 오류"}`);
        return;
      }
      onUpdate({
        ...word,
        word: editedWord,
        reading: editedReading,
        meaning: editedMeaning,
        kanjiList: editedKanjiList,
      });
      alert("수정 성공");
      onClose(); // 닫기
    } catch (error) {
      console.error("API 호출 에러:", error);
      alert("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말로 삭제하시겠습니까?")) return;
    try{
      const response = await fetch(`/api/kanji/${id}`,{
        method: "DELETE",
      })

      if(!response.ok){
        const errorData = await response.json();
        alert(`삭제 실패: ${errorData.error || "알 수 없는 오류"}`);
        return;
      }
      onDelete(id);
      alert("삭제 성공");
      onClose(); // 모달 닫기
    }catch(error){
      console.error("삭제 요청 중 오류 발생:", error);
      alert("삭제 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-md p-6 w-[600px] max-w-full space-y-4">
          <Dialog.Title className="text-lg font-bold">단어 수정</Dialog.Title>

          <div className="space-y-2">
            <label className="block text-sm font-medium">단어</label>
            <input
              value={editedWord}
              onChange={(e) => setEditedWord(e.target.value)}
              className="w-full border rounded px-3 py-1"
            />

            <label className="block text-sm font-medium">발음</label>
            <input
              value={editedReading}
              onChange={(e) => setEditedReading(e.target.value)}
              className="w-full border rounded px-3 py-1"
            />

            <label className="block text-sm font-medium">의미</label>
            <input
              value={editedMeaning}
              onChange={(e) => setEditedMeaning(e.target.value)}
              className="w-full border rounded px-3 py-1"
            />

            <label className="block text-sm font-medium">한자 목록</label>
            <div className="space-y-2">
              {editedKanjiList.map((kanji, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    value={kanji.kanji}
                    className="w-12 border rounded px-2 py-1 text-center"
                    readOnly
                  />
                  <input
                    value={kanji.onyomi}
                    onChange={(e) =>
                      setEditedKanjiList((prev) =>
                        prev.map((k, i) =>
                          i === index ? { ...k, onyomi: e.target.value } : k
                        )
                      )
                    }
                    className="flex-1 border rounded px-2 py-1"
                  />
                  <input
                    value={kanji.kunyomi || ""}
                    onChange={(e) =>
                      setEditedKanjiList((prev) =>
                        prev.map((k, i) =>
                          i === index ? { ...k, kunyomi: e.target.value } : k
                        )
                      )
                    }
                    className="flex-1 border rounded px-2 py-1"
                    placeholder="훈독"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => handleDelete(word.id)}
              className="px-4 py-2 rounded border border-red-500 text-red-500 hover:bg-red-50"
            >
              삭제
            </button>
            <button onClick={onClose} className="px-4 py-2 rounded border">
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded bg-blue-500 text-white"
            >
              저장
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
