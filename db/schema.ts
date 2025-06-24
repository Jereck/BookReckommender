// db/schema.ts
import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  text,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- User ----------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkUserId: varchar("clerk_user_id", { length: 128 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ---------- Book ----------
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  author: varchar("author", { length: 512 }),
  isbn: varchar("isbn", { length: 32 }).unique(),
  coverUrl: varchar("cover_url", { length: 1024 }),
  genres: text("genres"), // comma-separated, optional
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ---------- Recommendation ----------
export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  resultBookId: integer("result_book_id").references(() => books.id),
  explanation: text("explanation"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ---------- UserBook (books in the recommendation query) ----------
export const userBooks = pgTable("user_books", {
  id: serial("id").primaryKey(),
  recommendationId: integer("recommendation_id")
    .references(() => recommendations.id, { onDelete: "cascade" })
    .notNull(),
  bookId: integer("book_id")
    .references(() => books.id, { onDelete: "cascade" })
    .notNull(),
});

// ---------- Relations ----------
export const usersRelations = relations(users, ({ many }) => ({
  recommendations: many(recommendations),
}));

export const booksRelations = relations(books, ({ many }) => ({
  usedIn: many(userBooks),
  asRecommendation: many(recommendations),
}));

export const recommendationsRelations = relations(recommendations, ({ one, many }) => ({
  user: one(users, { fields: [recommendations.userId], references: [users.id] }),
  resultBook: one(books, { fields: [recommendations.resultBookId], references: [books.id] }),
  inputBooks: many(userBooks),
}));

export const userBooksRelations = relations(userBooks, ({ one }) => ({
  recommendation: one(recommendations, {
    fields: [userBooks.recommendationId],
    references: [recommendations.id],
  }),
  book: one(books, {
    fields: [userBooks.bookId],
    references: [books.id],
  }),
}));
