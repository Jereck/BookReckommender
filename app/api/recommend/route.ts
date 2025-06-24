import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { books, recommendations, userBooks, users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { fetchBookFromIsbndb } from "@/lib/isbndb";
import { getBookRecommendation } from "@/lib/openai";

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const inputBooks = body.books;
  if (!Array.isArray(inputBooks) || inputBooks.filter(b => b.isbn).length < 2) {
    return NextResponse.json({ error: "At least 2 books required" }, { status: 400 });
  }

  // Ensure the user exists in our DB
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId));
  const user = existingUser ?? (await db.insert(users).values({ clerkUserId }).returning())[0];

  // Upsert input books and collect their IDs
  const bookIds: number[] = [];
  for (const book of inputBooks) {
    const isbn = book.isbn;
    let [existingBook] = await db.select().from(books).where(eq(books.isbn, isbn));

    if (!existingBook) {
      const metadata = await fetchBookFromIsbndb(isbn);
      const inserted = await db.insert(books).values(metadata).returning();
      existingBook = inserted[0];
    }

    bookIds.push(existingBook.id);
  }

  // Fetch book details for OpenAI
  const bookDetails = await db
    .select()
    .from(books)
    .where(inArray(books.id, bookIds));

  const { recommendedBook, explanation } = await getBookRecommendation(bookDetails);

  // Upsert recommended book into DB
  const [existingRecommendedBook] = await db
    .select()
    .from(books)
    .where(eq(books.isbn, recommendedBook.isbn));

  const finalBook = existingRecommendedBook
    ?? (await db.insert(books).values(recommendedBook).returning())[0];

  // Create recommendation entry
  const [rec] = await db
    .insert(recommendations)
    .values({
      userId: user.id,
      resultBookId: finalBook.id,
      explanation,
    })
    .returning();

  // Link input books to the recommendation
  await db.insert(userBooks).values(
    bookIds.map((bookId) => ({
      recommendationId: rec.id,
      bookId,
    }))
  );

  return NextResponse.json({
    recommendedBook: finalBook,
    explanation,
  });
}
