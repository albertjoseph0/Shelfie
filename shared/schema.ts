import { pgTable, text, serial, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  isbn: text("isbn"),
  coverUrl: text("cover_url"),
  description: text("description"),
  pageCount: integer("page_count"),
  googleBooksId: text("google_books_id"),
  createdAt: text("created_at").notNull(),
  uploadId: text("upload_id").notNull(),
  metadata: jsonb("metadata").$type<{
    categories?: string[];
    publishedDate?: string;
    publisher?: string;
  }>(),
}, (table) => {
  return {
    userIdIdx: index("user_id_idx").on(table.userId),
    uploadIdIdx: index("upload_id_idx").on(table.uploadId),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  };
});

export const insertBookSchema = createInsertSchema(books).omit({ 
  id: true 
});

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;