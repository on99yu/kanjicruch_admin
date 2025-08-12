import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req : NextRequest) {

    const {email, password} = await req.json();

    const user = await prisma.user.findUnique({ where : {email} });

    if(!user) {
        return NextResponse.json({ error : "사용자를 찾을 수 없습니다." }, { status : 404 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if(!passwordMatch) {
        return NextResponse.json({ error : "비밀번호가 일치하지 않습니다." }, { status : 401 });
    }

    return NextResponse.json({ message : "로그인 성공", user: {name:user.name, email:user.email} } , { status : 200 });
}
