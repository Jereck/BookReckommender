// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");

  if (!query) return NextResponse.json({ books: [] });

  const res = await fetch(`https://api2.isbndb.com/books/${encodeURIComponent(query)}`, {
    headers: {
      Authorization: process.env.ISBNDB_API_KEY!,
    },
  });

  if (!res.ok) return NextResponse.json({ books: [] });

  const data = await res.json();
  const books = data.books.map((b: any) => ({
    title: b.title,
    author: b.authors?.[0] ?? "Unknown",
    isbn: b.isbn13,
    coverUrl: b.image,
  }));

  return NextResponse.json({ books });
}
