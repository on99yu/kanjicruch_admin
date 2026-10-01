import { NextRequest, NextResponse } from "next/server";
import { deleteAppSession } from "@/lib/app-auth";

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  await deleteAppSession(request);
  return NextResponse.json({ ok: true });
}
