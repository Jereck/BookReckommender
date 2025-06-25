import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const body = await req.json();

  if (body.type !== "user.created") {
    return NextResponse.json({ status: "ignored" });
  }

  const userId = body.data.id;

  const existing = await db.select().from(users).where(eq(users.clerkUserId, userId));
  if (existing.length === 0) {
    await db.insert(users).values({ clerkUserId: userId });
  }

  return NextResponse.json({ status: "ok" });
}
