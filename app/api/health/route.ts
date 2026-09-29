import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      { status: "ok", database: "ok" },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("GET /api/health error:", error);

    return NextResponse.json(
      { status: "error", database: "unavailable" },
      { status: 503, headers }
    );
  }
}
