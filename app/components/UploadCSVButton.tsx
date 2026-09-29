'use client';
import React, {useRef, useState} from "react";
import Papa from 'papaparse';
import { KanjiCSVRow } from "@/types/type";

export default function UploadCSVButton() {
    const [loading, setLoading] = useState(false);
    const maxFileBytes = 5 * 1024 * 1024;

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick=()=>{
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file =event.target.files?.[0];
        
        if (!file) return;
        if (file.size > maxFileBytes) {
            alert("CSV 파일은 5MB 이하여야 합니다.");
            event.target.value = "";
            return;
        }
        setLoading(true);
        Papa.parse<KanjiCSVRow>(file, {
            header:true,
            skipEmptyLines:true,
            complete: async (result)=>{

                try{
                    if (result.errors.length > 0) {
                        const firstError = result.errors[0];
                        alert(`CSV 파싱 실패: ${firstError.message}`);
                        return;
                    }

                    const res = await fetch('/api/kanji/upload', {
                        method:'POST',
                        headers:{
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(result.data),
                    })
                    const json = await res.json();

                    if(res.ok){
                        alert(`${json.count}개의 단어를 저장했습니다.`);
                        window.location.reload();
                    }else{
                        const details = Array.isArray(json.details)
                            ? `\n\n${json.details.join("\n")}`
                            : "";
                        alert(`저장 실패: ${json.error}${details}`);
                    }
                }catch(error) {
                    alert("서버 통신 실패");
                    console.error("서버 통신 실패:", error);
                }finally{
                    setLoading(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }
            },
            error:(error)=>{
                alert("CSV 파싱 실패");
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
                console.error("CSV 파싱 오류:", error);
            }
        })

    }

    return (
        <div className="mb-4">
            <button type="button"
                className={`px-4 py-2  text-white rounded hover:bg-blue-700 ${loading ? "bg-gray-400": "bg-blue-500" } `}
                onClick={handleClick}
                disabled={loading}>
                {loading ? '업로드중...' : 'CSV 업로드'}
            </button>
            <input
                type="file"
                accept=".csv,text/csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"/>
        </div>
    )
}
