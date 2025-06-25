import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getOrCreateUser,
  hasRemainingQuota,
  upsertInputBooks,
  generateRecommendation,
} from "@/lib/usecases/recommend";

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const inputBooks = body.books;
  if (!Array.isArray(inputBooks) || inputBooks.filter((b) => b.isbn).length < 2) {
    return NextResponse.json({ error: "At least 2 books required" }, { status: 400 });
  }

  const user = await getOrCreateUser(clerkUserId);

  const hasQuota = await hasRemainingQuota(user.id);
  if (!hasQuota) {
    return NextResponse.json(
      { error: "You've reached your recommendation limit. Upgrade to get more!" },
      { status: 429 }
    );
  }

  const bookIds = await upsertInputBooks(inputBooks);
  const result = await generateRecommendation(bookIds, user.id);

  return NextResponse.json(result);
}
