export async function fetchBookFromIsbndb(isbn: string) {
  const key = process.env.ISBNDB_API_KEY!;
  const res = await fetch(`https://api.isbndb.com/book/${isbn}`, {
    headers: { Authorization: key },
  });

  if (!res.ok) throw new Error("Failed to fetch book");

  const data = await res.json();
  const book = data.book;

  return {
    title: book.title,
    author: book.authors?.[0] ?? "",
    isbn: book.isbn13 ?? isbn,
    coverUrl: book.image ?? "",
    genres: book.subjects?.join(", ") ?? "",
    description: book.synopsys ?? "",
  };
}
