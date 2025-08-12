// app/admin/kanji/upload/page.tsx
"use client";

import React, { useRef, useState } from "react";
import Papa from "papaparse";
import { KanjiCSVRow } from "@/types/type";

export default function KanjiUploadPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState<KanjiCSVRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFileName(file.name);
    Papa.parse<KanjiCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        console.log("파싱된 CSV:", result.data);
        setPreviewData(result.data as KanjiCSVRow[]);
        setLoading(false);
      },
      error: (error) => {
        alert("CSV 파싱 실패");
        console.error("CSV 파싱 오류:", error);
        setLoading(false);
      },
    });
  };

  const handleSaveToDB = async () => {
    setSaving(true);
    console.log("DB 저장 요청됨");
    try {
      const res = await fetch("/api/kanji/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(previewData),
      });

      if (!res.ok) {
        throw new Error("서버 응답 오류");
      }

      const result = await res.json();
      setSaving(false);
      alert("DB 저장 성공: " + result.count + "개 항목 저장됨");
    } catch (err) {
      console.error("DB 저장 실패:", err);
      setSaving(false);
      alert("DB 저장 실패: 콘솔 확인");
    }
  }

    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-16">
          <h1 className="text-2xl font-bold mb-4">CSV 업로드 페이지</h1>
          <button
            type="button"
            className={`px-4 py-2 mb-4 text-white rounded hover:bg-blue-700 ${
              loading ? "bg-gray-400" : "bg-blue-500"
            }`}
            onClick={handleClick}
          >
            {loading ? "업로드중..." : "CSV 업로드"}
          </button>
          <input
            type="file"
            accept=".csv, .xlsx"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          {previewData.length > 0 && (
            <button
              type="button"
              onClick={handleSaveToDB}
              className={`px-4 py-2 mb-4 text-white rounded hover:bg-red-700 
                ${saving ? "bg-gray-400" : "bg-red-600"}`}
            >
              {saving ? "저장 중": "DB 저장하기"}
            </button>
          )}
        </div>
        {fileName && (
          <div className="text-sm text-gray-700">
            <p>
              <strong>파일 이름:</strong> {fileName}
            </p>
            <p>
              <strong>단어 개수:</strong> {previewData.length}개
            </p>
          </div>
        )}
        {previewData.length > 0 && (
          <div className="overflow-auto">
            <table className="table-auto w-full text-sm border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1 whitespace-nowrap">단어</th>
                  <th className="border px-2 py-1 whitespace-nowrap">발음</th>
                  <th className="border px-2 py-1 whitespace-nowrap">의미</th>
                  {[1, 2, 3, 4].map((i) => (
                    <React.Fragment key={i}>
                      <th className="border px-2 py-1 whitespace-nowrap">
                        한자{i}
                      </th>
                      <th className="border px-2 py-1 whitespace-nowrap">
                        음독{i}
                      </th>
                      <th className="border px-2 py-1 whitespace-nowrap">
                        훈독{i}
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((word, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1 whitespace-nowrap">
                      {word.단어 || ""}
                    </td>
                    <td className="border px-2 py-1 whitespace-nowrap">
                      {word.발음 || ""}
                    </td>
                    <td className="border px-2 py-1 whitespace-nowrap">
                      {word.의미 || ""}
                    </td>
                    {[1, 2, 3, 4].map((i) => (
                      <React.Fragment key={i}>
                        <td className="border px-2 py-1 whitespace-nowrap">
                          {word[`한자${i}` as keyof KanjiCSVRow] || ""}
                        </td>
                        <td className="border px-2 py-1 whitespace-nowrap">
                          {word[`음독${i}` as keyof KanjiCSVRow] || ""}
                        </td>
                        <td className="border px-2 py-1 whitespace-nowrap">
                          {word[`훈독${i}` as keyof KanjiCSVRow] || ""}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
