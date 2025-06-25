import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { books } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getBookRecommendation } from "@/lib/openai";

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const inputBooks = body.books;
  const previousIsbn = body.previousIsbn;

  if (!Array.isArray(inputBooks) || inputBooks.filter((b) => b.isbn).length < 2) {
    return NextResponse.json({ error: "At least 2 books required" }, { status: 400 });
  }

  if (!previousIsbn) {
    return NextResponse.json({ error: "Missing previous recommendation ISBN" }, { status: 400 });
  }

  // Get book details
  const bookDetails = await db
    .select()
    .from(books)
    .where(inArray(books.isbn, inputBooks.map(b => b.isbn)));

  const [previousBook] = await db
    .select()
    .from(books)
    .where(eq(books.isbn, previousIsbn));

  const { recommendedBook, explanation } = await getBookRecommendation(bookDetails, previousBook);

  // Clean and insert the new recommendation if needed
  const cleaned = {
    title: recommendedBook.title?.slice(0, 255) ?? "Untitled",
    author: recommendedBook.author?.slice(0, 255) ?? "Unknown",
    isbn: recommendedBook.isbn?.slice(0, 255) ?? "UNKNOWN-" + crypto.randomUUID().slice(0, 6),
    coverUrl: recommendedBook.coverUrl?.slice(0, 255) ?? null,
    description: recommendedBook.description?.slice(0, 2000) ?? null,
  };

  const [existing] = await db.select().from(books).where(eq(books.isbn, cleaned.isbn));
  const finalBook = existing ?? (await db.insert(books).values(cleaned).returning())[0];

  return NextResponse.json({
    recommendedBook: finalBook,
    explanation,
  });
}
