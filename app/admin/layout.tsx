// app/admin/layout.tsx
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gray-100 p-4 shadow">
        <nav className="flex justify-start pl-8 space-x-10">
          <Link href="/admin" className="hover:text-blue-500">관리자 홈</Link>
          <Link href="/admin/kanji" className="hover:text-blue-500" >한자 관리</Link>
        </nav>
      </header>
      <div className="flex-1 overflow-x-auto p-4">
        <main className="min-w-max">{children}</main>
      </div>
    </div>
  );
}