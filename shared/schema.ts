import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  isbn: text("isbn"),
  coverUrl: text("cover_url"),
  description: text("description"),
  pageCount: integer("page_count"),
  googleBooksId: text("google_books_id"),
  metadata: jsonb("metadata").$type<{
    categories?: string[];
    publishedDate?: string;
    publisher?: string;
  }>(),
});

export const libraries = pgTable("libraries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  shelfName: text("shelf_name").default("Default"),
  addedAt: text("added_at").notNull(),
});

export const insertBookSchema = createInsertSchema(books).omit({ 
  id: true 
});

export const insertLibrarySchema = createInsertSchema(libraries).omit({ 
  id: true 
});

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Library = typeof libraries.$inferSelect;
export type InsertLibrary = z.infer<typeof insertLibrarySchema>;
