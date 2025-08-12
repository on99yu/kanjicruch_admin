"use client";
import React, { useState,useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { KanjiTableRow } from "@/types/type";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAdd : (newWord: KanjiTableRow) => void;
};

export default function AddKanjiModal({ isOpen, onClose, onAdd }: Props) {
  const [newWord, setNewWord] = useState("");
  const [newReading, setNewReading] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [newKanjiList, setNewKanjiList] = useState([
    { kanji: "", onyomi: "", kunyomi: "" },
  ]);

  const handleSave = async () => {
   try{
    const res = await fetch("/api/kanji",{
      method: "POST",
      headers:{ "Content-Type": "application/json" },
      body: JSON.stringify({
        word: newWord,
        reading: newReading,
        meaning: newMeaning,
        kanjiList: newKanjiList,
      }),
    })
    if (!res.ok){
      const errorData = await res.json();
      alert(`저장 실패: ${errorData.error || "알 수 없는 오류"}`);
      return;
    }
    const createdWord = await res.json();
    onAdd(createdWord)
    alert("단어 추가 성공")
    onClose(); // 모달 닫기
   }catch(error){
    console.error("저장 중 오류 발생:", error);
    alert("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
   }
  };

  useEffect(()=>{
    const kanjiCount = newWord.length;
    setNewKanjiList((prev) =>{
        if(kanjiCount == prev.length) return prev;
        const newList = Array.from({length:kanjiCount},(_,i)=>{
            return prev[i] || {kanji:newWord[i] || "", onyomi: "", kunyomi: ""};
        });
        return newList;
    })
  },[newWord])
  
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-md p-6 w-[600px] max-w-full space-y-4">
          <Dialog.Title className="text-lg font-bold">단어 추가</Dialog.Title>

          <div className="space-y-2">
            <label className="block text-sm font-medium">단어</label>
            <input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              className="w-full border rounded px-3 py-1"
            />

            <label className="block text-sm font-medium">발음</label>
            <input
              value={newReading}
              onChange={(e) => setNewReading(e.target.value)}
              className="w-full border rounded px-3 py-1"
            />

            <label className="block text-sm font-medium">의미</label>
            <input
              value={newMeaning}
              onChange={(e) => setNewMeaning(e.target.value)}
              className="w-full border rounded px-3 py-1"
            />

            <label className="block text-sm font-medium">한자 목록</label>
            <div className="space-y-2">
              {newKanjiList.map((kanji, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    value={kanji.kanji}
                    onChange={(e) =>

                      setNewKanjiList((prev) =>
                        prev.map((k, i) =>
                          i === index ? { ...k, kanji: e.target.value } : k
                        )
                      )
                    }
                    className="w-12 border rounded px-2 py-1 text-center"
                    placeholder={newWord[index] || "漢"}
                  />
                  <input
                    value={kanji.onyomi}
                    onChange={(e) =>
                      setNewKanjiList((prev) =>
                        prev.map((k, i) =>
                          i === index ? { ...k, onyomi: e.target.value } : k
                        )
                      )
                    }
                    className="flex-1 border rounded px-2 py-1"
                    placeholder="온독"
                  />
                  <input
                    value={kanji.kunyomi}
                    onChange={(e) =>
                      setNewKanjiList((prev) =>
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

          <div className="flex justify-end gap-2 pt-4">
            <button onClick={onClose} className="px-4 py-2 rounded border">
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded bg-green-600 text-white"
            >
              저장
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
