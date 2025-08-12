"use client";
import React, { useState } from "react";
import { KanjiTableRow } from "@/types/type";
import EditModal from "./EditModal";
import AddModal from "./AddModal";

export default function KanjiTable({words: initialWords}: { words: KanjiTableRow[] }) {
  const [words, setWords] = useState<KanjiTableRow[]>(initialWords);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [modalWord, setModalWord] = useState<KanjiTableRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleRowClick = (id: number) => {
    setSelectedRowId(id === selectedRowId ? null : id);
  };
  return (
    <div className="overflow-auto">
      <div className="flex justify-start mb-4">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-2 py-2 bg-green-500 text-white text-sm rounded"
        >
          직접 추가
        </button>
      </div>
      <table className="table-auto w-full text-sm border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-1 whitespace-nowrap"></th>
            <th className="border px-2 py-1 whitespace-nowrap">번호</th>
            <th className="border px-2 py-1 whitespace-nowrap">단어</th>
            <th className="border px-2 py-1 whitespace-nowrap">발음</th>
            <th className="border px-2 py-1 whitespace-nowrap">의미</th>
            {[1, 2, 3, 4].map((i) => (
              <React.Fragment key={i}>
                <th
                  key={`kanji-${i}`}
                  className="border px-2 py-1 whitespace-nowrap"
                >
                  한자{i}
                </th>
                <th
                  key={`onyomi-${i}`}
                  className="border px-2 py-1 whitespace-nowrap "
                >
                  음독{i}
                </th>
                <th
                  key={`kunyomi-${i}`}
                  className="border px-2 py-1 whitespace-nowrap"
                >
                  훈독{i}
                </th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {words.map((word, index) => {
            const isSelected = selectedRowId === word.id;
            return (
              <tr
                key={word.id}
                className={isSelected ? "bg-blue-100" : ""}
                onClick={() => handleRowClick(word.id)}
              >
                <td className="w-8  justify-center text-center whitespace-nowrap">
                  {isSelected && (
                    <button
                      className="w-[80%] border-2 border-white rounded-md bg-blue-400 text-white hover:text-blue-800 hover:border-blue-800 "
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalWord(word);
                        setIsModalOpen(true);
                      }}
                    >
                      +
                    </button>
                  )}
                </td>
                <td className="border px-2 py-1 whitespace-nowrap">
                  {index + 1}
                </td>
                <td className="border px-2 py-1 whitespace-nowrap">
                  {word.word}
                </td>
                <td className="border px-2 py-1 whitespace-nowrap">
                  {word.reading}
                </td>
                <td className="border px-2 py-1 whitespace-nowrap">
                  {word.meaning}
                </td>
                {[0, 1, 2, 3].map((i) => {
                  const k = word.kanjiList[i];
                  return (
                    <React.Fragment key={`frag-${word.id}-${i}`}>
                      <td className="border px-2 py-1 whitespace-nowrap">
                        {k?.kanji || ""}
                      </td>
                      <td className="border px-2 py-1 whitespace-nowrap">
                        {k?.onyomi || ""}
                      </td>
                      <td className="border px-2 py-1 whitespace-nowrap">
                        {k?.kunyomi || ""}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {modalWord && (
        <EditModal
          isOpen={isModalOpen}
          word={modalWord}
          onClose={() => setModalWord(null)}
          onUpdate={(updateWord) =>{
             setWords((prevWords) => prevWords.map((w) => (w.id === updateWord.id ? updateWord :w))
            );
            setModalWord(null);
          }}
        />
      )}
      {isAddModalOpen && (
        <AddModal isOpen={isAddModalOpen} onClose={()=> setIsAddModalOpen(false)}/>
        )}
    </div>
  );
}
