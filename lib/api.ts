import { Book } from "./types";

export async function getRecommendation(books: Book[]) {
  const res = await fetch('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ books }),
  });

  if (!res.ok) throw new Error('Failed to get recommendation');

  return res.json() as Promise<{
    recommendedBook: { title: string; author: string, coverUrl: string, isbn: string };
    explanation: string;
  }>;
}

export async function getRecommendationCount(): Promise<number> {
  const res = await fetch("/api/recommend/count");
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count;
}

export async function retryRecommendation(books: Book[], previousIsbn: string) {
  const res = await fetch("/api/recommend/retry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ books, previousIsbn }),
  });

  if (!res.ok) throw new Error("Failed to get a new recommendation");
  return res.json() as Promise<{
    recommendedBook: { title: string; author: string; coverUrl: string; isbn: string };
    explanation: string;
  }>;
}