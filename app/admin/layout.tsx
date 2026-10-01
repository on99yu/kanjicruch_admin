// app/admin/layout.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LogoutButton from "../components/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gray-100 p-4 shadow">
        <nav className="flex items-center justify-between gap-6 px-4 sm:px-8">
          <div className="flex gap-6 sm:gap-10">
            <Link href="/admin" className="hover:text-blue-500">관리자 홈</Link>
            <Link href="/admin/kanji" className="hover:text-blue-500" >한자 관리</Link>
          </div>
          <LogoutButton />
        </nav>
      </header>
      <div className="flex-1 overflow-x-auto p-4">
        <main className="min-w-max">{children}</main>
      </div>
    </div>
  );
}
