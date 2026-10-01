import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createAppSession } from "@/lib/app-auth";
import { prisma } from "@/lib/prisma";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (
    !isRecord(body) ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json({ error: "이메일과 비밀번호를 입력해 주세요." }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  if (!email || body.password.length === 0 || body.password.length > 200) {
    return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!user || !(await bcrypt.compare(body.password, user.password))) {
    return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  await prisma.appSession.deleteMany({
    where: { userId: user.id, expiresAt: { lte: new Date() } },
  });

  const session = await createAppSession(user.id);

  return NextResponse.json({
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
    user: { id: user.id, email: user.email, name: user.name },
  });
}
