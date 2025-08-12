"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";


export default function Loginpage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setisLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setisLoading(true);
    await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (res.ok) {
      // 로그인 성공
      router.push("/admin");
      setisLoading(false);
    } else {
      setError(data.error || "로그인 실패");
    }
    setisLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-semibold mb-4">관리자 로그인</h2>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          {isLoading ? "로그인 중..." :"로그인"}
        </button>
      </form>
    </div>
  );
}
