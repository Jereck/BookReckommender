import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function getBookRecommendation(inputBooks: any[]) {
  const prompt = `
Based on these books:

${inputBooks.map((b, i) => `${i + 1}. "${b.title}" by ${b.author}`).join("\n")}

Suggest a single book (not one of the input ones) the user might enjoy. Respond in the following JSON format:

{
  "title": "Book Title",
  "author": "Author Name",
  "isbn": "9780000000000", // optional
  "coverUrl": "https://example.com/cover.jpg", // optional
  "explanation": "Why this book fits well with the user's preferences"
}
`.trim();

  const res = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const raw = res.choices[0].message.content || "";

  try {
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const jsonString = raw.slice(jsonStart, jsonEnd + 1).replace(/```json|```/g, "");

    const { title, author, explanation, coverUrl, isbn } = JSON.parse(jsonString);

    const recommendedBook = {
      title: title ?? "Unknown Title",
      author: author ?? "Unknown Author",
      isbn: isbn ?? "UNKNOWN-" + Math.random().toString(36).substring(2, 8),
      coverUrl: coverUrl,
      genres: "",
      description: explanation, // optional: keep both explanation & description if needed
    };

    return { recommendedBook, explanation };
  } catch (err) {
    console.error("Failed to parse OpenAI response:", raw);
    throw new Error("Could not parse book recommendation.");
  }
}

