import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function getBookRecommendation(inputBooks: any[]) {
  const prompt = `The user has read the following books:

  ${inputBooks.map((b, i) => `${i + 1}. "${b.title}" by ${b.author}`).join("\n")}

  Based on these, recommend one additional book. 
  Respond **only** in the following JSON format:

  {
    "title": "Recommended Title",
    "author": "Author Name",
    "explanation": "Short explanation here."
  }

  Do not include anything outside the JSON.`;

  const res = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });

  const raw = res.choices[0].message.content || "";

  try {
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const jsonString = raw.slice(jsonStart, jsonEnd + 1);

    const { title, author, explanation } = JSON.parse(jsonString);

    const recommendedBook = {
      title: title ?? "Unknown Title",
      author: author ?? "Unknown Author",
      isbn: "UNKNOWN-" + Math.random().toString(36).substring(2, 8),
      coverUrl: "",
      genres: "",
      description: explanation, // also saved to DB, not currently shown
    };

    return { recommendedBook, explanation };
  } catch (err) {
    console.error("Failed to parse OpenAI response:", raw);
    throw new Error("Could not parse book recommendation.");
  }
}
