import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  uploadId: text("upload_id").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  isbn: text("isbn"),
  coverUrl: text("cover_url"),
  description: text("description"),
  pageCount: integer("page_count"),
  googleBooksId: text("google_books_id"),
  createdAt: text("created_at").notNull(),
  metadata: jsonb("metadata").$type<{
    categories?: string[];
    publishedDate?: string;
    publisher?: string;
  }>(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull(),
  status: text("status").notNull(), // 'active', 'past_due', 'canceled'
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBookSchema = createInsertSchema(books).omit({ 
  id: true,
  userId: true, 
  uploadId: true 
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export const libraries = pgTable("libraries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  shelfName: text("shelf_name").default("Default"),
  addedAt: text("added_at").notNull(),
});

export const insertLibrarySchema = createInsertSchema(libraries).omit({ 
  id: true 
});

export type Library = typeof libraries.$inferSelect;
export type InsertLibrary = z.infer<typeof insertLibrarySchema>;