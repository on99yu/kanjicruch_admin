import { createHash, randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const APP_SESSION_DAYS = 30;

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function createAppSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(
    Date.now() + APP_SESSION_DAYS * 24 * 60 * 60 * 1000
  );

  await prisma.appSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function getAppSession(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;

  const session = await prisma.appSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.appSession.delete({ where: { id: session.id } });
    return null;
  }

  return session;
}

export async function deleteAppSession(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return;

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return;

  await prisma.appSession.deleteMany({
    where: { tokenHash: hashToken(token) },
  });
}
