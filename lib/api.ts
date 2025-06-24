import { Book } from "./types";

export async function getRecommendation(books: Book[]) {
  const res = await fetch('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ books }),
  });

  if (!res.ok) throw new Error('Failed to get recommendation');
  
  return res.json() as Promise<{
    recommendedBook: { title: string; author: string, coverUrl: string };
    explanation: string;
  }>;
}
