# Book RECKommender

**Book RECKommender** is an AI-powered web app that suggests your next favorite book based on ones you already love. Simply enter a few books you've enjoyed, and our system will analyze your preferences and recommend a new title, complete with a personalized explanation and cover image.

---

## Features

- **Clerk Authentication** — Secure sign-in and session handling.
- **Smart Book Input** — Add ISBNs with optional title/author info.
- **OpenAI Recommendations** — Get intelligent book suggestions with explanations.
- **Book Covers** — Visual previews of your recommended read.
- **History Page** — Review all your past recommendations.
- **PostgreSQL + Drizzle ORM** — Typed schema and database access.
- **Next.js + React + Tailwind CSS** — Fast, responsive UI built with modern tools.

---

## Tech Stack

- **Frontend**: Next.js App Router, React, Tailwind CSS, Clerk
- **Backend**: Node.js, TypeScript, Next.js API routes
- **AI**: OpenAI GPT-4 (via `openai` SDK)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Clerk (JWT-based session management)

---

## How It Works

1. User signs in with Clerk.
2. Inputs a list of books (ISBNs required, titles/authors optional).
3. Backend enriches input books with metadata via ISBNdb.
4. A GPT-4 prompt is crafted using this data and sent to OpenAI.
5. The response includes a recommended book, cover URL, and explanation.
6. The result is stored and displayed to the user with visuals and reasoning.

## License
MIT — feel free to fork, modify, and build on top of it!

## Credits
Built by Jake Reck
Powered by OpenAI, Clerk, and the community behind Next.js & Drizzle ORM.