import { db } from "@/db";
import { books, recommendations, userBooks, users } from "@/db/schema";
import { eq, inArray, and, gte } from "drizzle-orm";
import { fetchBookFromIsbndb } from "@/lib/isbndb";
import { getBookRecommendation } from "@/lib/openai";

export async function getOrCreateUser(clerkUserId: string) {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId));
  return (
    existingUser ?? (await db.insert(users).values({ clerkUserId }).returning())[0]
  );
}

export async function hasRemainingQuota(userId: number, maxRecommendations = 5): Promise<boolean> {
  const result = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.userId, userId));

  return result.length < maxRecommendations;
}

export async function upsertInputBooks(inputBooks: { isbn: string }[]) {
  const bookIds: number[] = [];

  for (const { isbn } of inputBooks) {
    if (!isbn) continue;

    let [existingBook] = await db.select().from(books).where(eq(books.isbn, isbn));
    if (!existingBook) {
      const metadata = await fetchBookFromIsbndb(isbn);
      const inserted = await db.insert(books).values(metadata).returning();
      existingBook = inserted[0];
    }

    bookIds.push(existingBook.id);
  }

  return bookIds;
}

export async function generateRecommendation(bookIds: number[], userId: number) {
  const bookDetails = await db
    .select()
    .from(books)
    .where(inArray(books.id, bookIds));

  const { recommendedBook, explanation } = await getBookRecommendation(bookDetails);

  // Always re-fetch metadata using ISBNdb if ISBN is available
  let metadata = recommendedBook;
  if (recommendedBook.isbn) {
    try {
      metadata = await fetchBookFromIsbndb(recommendedBook.isbn);
    } catch (err) {
      console.warn("Failed to fetch recommended book from ISBNdb. Using fallback OpenAI data.");
    }
  }

  const cleaned = {
    title: metadata.title?.slice(0, 255) ?? "Untitled",
    author: metadata.author?.slice(0, 255) ?? "Unknown",
    isbn: metadata.isbn?.slice(0, 255) ?? "UNKNOWN-" + crypto.randomUUID().slice(0, 6),
    coverUrl: metadata.coverUrl?.slice(0, 255) ?? null,
    description: recommendedBook.description?.slice(0, 2000) ?? null,
  };

  // Ensure it's not already in the DB
  const [existing] = await db.select().from(books).where(eq(books.isbn, cleaned.isbn));
  const finalBook = existing ?? (await db.insert(books).values(cleaned).returning())[0];

  const [rec] = await db
    .insert(recommendations)
    .values({
      userId,
      resultBookId: finalBook.id,
      explanation: explanation?.slice(0, 2000) ?? "",
    })
    .returning();

  await db.insert(userBooks).values(
    bookIds.map((bookId) => ({
      recommendationId: rec.id,
      bookId,
    }))
  );

  return {
    recommendedBook: finalBook,
    explanation,
  };
}
