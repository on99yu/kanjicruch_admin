import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">관리자 페이지</h1>
      <div className="bg-gray-100 p-4 rounded">
        <p><strong>이름:</strong> {session.user?.name}</p>
        <p><strong>이메일:</strong> {session.user?.email}</p>
      </div>
    </div>
  );
}
