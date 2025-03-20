import { pgTable, text, serial, integer, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";
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

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  isActive: boolean("is_active").default(false),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBookSchema = createInsertSchema(books).omit({ 
  id: true,
  userId: true, 
  uploadId: true 
});

export const insertSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

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

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Library = typeof libraries.$inferSelect;
export type InsertLibrary = z.infer<typeof insertLibrarySchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertSubscriptionSchema>;