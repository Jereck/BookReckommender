import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, books, recommendations, userBooks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId));

  if (!user) {
    return NextResponse.json({ recommendations: [] });
  }

  // Get recommendations + their input books
  const recs = await db
    .select({
      id: recommendations.id,
      explanation: recommendations.explanation,
      createdAt: recommendations.createdAt,
      resultBook: books,
    })
    .from(recommendations)
    .where(eq(recommendations.userId, user.id))
    .leftJoin(books, eq(recommendations.resultBookId, books.id));

  const inputBooksMap: Record<number, any[]> = {};

  const inputBookJoins = await db
    .select({
      recommendationId: userBooks.recommendationId,
      book: books,
    })
    .from(userBooks)
    .leftJoin(books, eq(userBooks.bookId, books.id));

  for (const entry of inputBookJoins) {
    const recId = entry.recommendationId;
    if (!inputBooksMap[recId]) inputBooksMap[recId] = [];
    inputBooksMap[recId].push(entry.book);
  }

  const fullRecs = recs.map((rec) => ({
    ...rec,
    inputBooks: inputBooksMap[rec.id] ?? [],
  }));

  return NextResponse.json({ recommendations: fullRecs });
}
