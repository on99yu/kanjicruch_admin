'use client';
import React, {useRef, useState} from "react";
import Papa from 'papaparse';
import { KanjiCSVRow } from "@/types/type";

export default function UploadCSVButton() {
    const [loading, setLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick=()=>{
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file =event.target.files?.[0];
        
        if (!file) return;
        setLoading(true);
        Papa.parse<KanjiCSVRow>(file, {
            header:true,
            skipEmptyLines:true,
            complete: async (result)=>{

                console.log("파싱된 CSV:",result.data);

                try{
                    const res = await fetch('/api/kanji/upload', {
                        method:'POST',
                        headers:{
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(result.data),
                    })
                    const json = await res.json();

                    if(res.ok){
                        alert("DB 저장 성공!");
                    }else{
                        alert("저장 실패:" + json.error);
                    }
                }catch(error) {
                    alert("서버 통신 실패");
                    console.error("서버 통신 실패:", error);
                }finally{
                    setLoading(false);
                }
            },
            error:(error)=>{
                alert("CSV 파싱 실패");
                setLoading(false);
                console.error("CSV 파싱 오류:", error);
            }
        })

    }

    return (
        <div className="mb-4">
            <button type="button"
                className={`px-4 py-2  text-white rounded hover:bg-blue-700 ${loading ? "bg-gray-400": "bg-blue-500" } `}
                onClick={handleClick}>
                {loading ? '업로드중...' : 'CSV 업로드'}
            </button>
            <input
                type="file"
                accept=".csv, .xlsx"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"/>
        </div>
    )
}