import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/db"
import { books, recommendations, userBooks, users } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"
import { fetchBookFromIsbndb } from "@/lib/isbndb"
import { getBookRecommendation } from "@/lib/openai"

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const inputBooks = body.books
  if (!Array.isArray(inputBooks) || inputBooks.filter(b => b.isbn).length < 2) {
    return NextResponse.json({ error: "At least 2 books required" }, { status: 400 })
  }

  // Ensure user exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
  const user = existingUser ?? (await db.insert(users).values({ clerkUserId }).returning())[0]

  // Upsert input books and collect their IDs
  const bookIds: number[] = []
  for (const book of inputBooks) {
    const isbn = book.isbn
    let [existingBook] = await db.select().from(books).where(eq(books.isbn, isbn))

    if (!existingBook) {
      const metadata = await fetchBookFromIsbndb(isbn)
      const inserted = await db.insert(books).values(metadata).returning()
      existingBook = inserted[0]
    }

    bookIds.push(existingBook.id)
  }

  // Fetch input book details to use in prompt
  const bookDetails = await db
    .select()
    .from(books)
    .where(inArray(books.id, bookIds))

  // Ask OpenAI
  const { recommendedBook, explanation } = await getBookRecommendation(bookDetails)

  // Handle cases with missing fields or long descriptions
  const cleanedBook = {
    title: recommendedBook.title?.slice(0, 255) ?? "Untitled",
    author: recommendedBook.author?.slice(0, 255) ?? "Unknown",
    isbn: recommendedBook.isbn?.slice(0, 255) || "UNKNOWN-" + crypto.randomUUID().slice(0, 6),
    coverUrl: recommendedBook.coverUrl?.slice(0, 255) ?? null,
    description: recommendedBook.description?.slice(0, 2000) ?? null,
  }

  // Check if book already exists
  const [existingRecommendedBook] = await db
    .select()
    .from(books)
    .where(eq(books.isbn, cleanedBook.isbn))

  const finalBook =
    existingRecommendedBook ??
    (await db.insert(books).values(cleanedBook).returning())[0]
    
  console.log("Final book:", finalBook);

  // Create recommendation entry
  const [rec] = await db
    .insert(recommendations)
    .values({
      userId: user.id,
      resultBookId: finalBook.id,
      explanation: explanation?.slice(0, 2000) ?? "",
    })
    .returning()

  // Link books
  await db.insert(userBooks).values(
    bookIds.map((bookId) => ({
      recommendationId: rec.id,
      bookId,
    }))
  )

  return NextResponse.json({
    recommendedBook: finalBook,
    explanation,
  })
}
