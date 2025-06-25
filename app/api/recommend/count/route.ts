import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, recommendations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ count: 0 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId));

  const recs = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.userId, user.id));

  return NextResponse.json({ count: recs.length });
}