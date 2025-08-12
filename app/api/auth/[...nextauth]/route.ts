// 대괄호는 동적경로를 의미
// ...는 모든 하위 경로를 의미
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export {handler as GET, handler as POST};
