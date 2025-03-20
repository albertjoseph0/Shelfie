import type { Book, InsertBook, Subscription } from "@shared/schema";
import { db } from "./db";
import { books, subscriptions } from "@shared/schema";
import { eq, and, like, or, gte } from "drizzle-orm";

const MONTHLY_BOOK_LIMIT = 50;

export interface IStorage {
  createBook(book: InsertBook, uploadId: string, userId: string): Promise<Book>;
  getBook(id: number, userId: string): Promise<Book | undefined>;
  getBooks(userId: string): Promise<Book[]>;
  deleteBook(id: number, userId: string): Promise<void>;
  deleteBooksByUploadId(uploadId: string, userId: string): Promise<void>;
  searchBooks(query: string, userId: string): Promise<Book[]>;
  getBooksAddedThisMonth(userId: string): Promise<number>;
  // New subscription methods
  getSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(data: {
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    status: string;
    currentPeriodEnd: Date;
  }): Promise<Subscription>;
  updateSubscription(
    userId: string,
    data: {
      status: string;
      currentPeriodEnd: Date;
    },
  ): Promise<Subscription | undefined>;
  getStripeCustomer(userId: string): Promise<string | undefined>;
  saveStripeCustomer(userId: string, stripeCustomerId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getBooksAddedThisMonth(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const count = await db
      .select({ count: books.id })
      .from(books)
      .where(and(eq(books.userId, userId), gte(books.createdAt, startOfMonth)))
      .count();

    return Number(count) || 0;
  }

  async createBook(
    book: InsertBook,
    uploadId: string,
    userId: string,
  ): Promise<Book> {
    const monthlyCount = await this.getBooksAddedThisMonth(userId);
    if (monthlyCount >= MONTHLY_BOOK_LIMIT) {
      throw new Error(
        `Monthly limit of ${MONTHLY_BOOK_LIMIT} books reached. Please try again next month.`,
      );
    }

    const [newBook] = await db
      .insert(books)
      .values({
        ...book,
        userId,
        uploadId,
        createdAt: new Date(),
      })
      .returning();

    return newBook;
  }

  async getBook(id: number, userId: string): Promise<Book | undefined> {
    const [book] = await db
      .select()
      .from(books)
      .where(and(eq(books.id, id), eq(books.userId, userId)));
    return book;
  }

  async getBooks(userId: string): Promise<Book[]> {
    const userBooks = await db
      .select()
      .from(books)
      .where(eq(books.userId, userId));

    return userBooks;
  }

  async deleteBook(id: number, userId: string): Promise<void> {
    await db
      .delete(books)
      .where(and(eq(books.id, id), eq(books.userId, userId)));
  }

  async deleteBooksByUploadId(uploadId: string, userId: string): Promise<void> {
    await db
      .delete(books)
      .where(and(eq(books.uploadId, uploadId), eq(books.userId, userId)));
  }

  async searchBooks(query: string, userId: string): Promise<Book[]> {
    const lowercaseQuery = `%${query.toLowerCase()}%`;

    const results = await db
      .select()
      .from(books)
      .where(
        and(
          eq(books.userId, userId),
          or(
            like(books.title, lowercaseQuery),
            like(books.author, lowercaseQuery),
          ),
        ),
      );

    return results;
  }

  // New subscription methods
  async getSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    return subscription;
  }

  async createSubscription(data: {
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    status: string;
    currentPeriodEnd: Date;
  }): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        userId: data.userId,
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        status: data.status,
        currentPeriodEnd: data.currentPeriodEnd,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return subscription;
  }

  async updateSubscription(
    userId: string,
    data: {
      status: string;
      currentPeriodEnd: Date;
    },
  ): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set({
        status: data.status,
        currentPeriodEnd: data.currentPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId))
      .returning();
    return subscription;
  }

  async getStripeCustomer(userId: string): Promise<string | undefined> {
    const [subscription] = await db
      .select({ stripeCustomerId: subscriptions.stripeCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    return subscription?.stripeCustomerId;
  }

  async saveStripeCustomer(
    userId: string,
    stripeCustomerId: string,
  ): Promise<void> {
    await db.insert(subscriptions).values({
      userId,
      stripeCustomerId,
      stripeSubscriptionId: "pending", // Placeholder until subscription is created
      status: "incomplete",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now as placeholder
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

// Switch storage implementation based on environment
const isProduction = process.env.NODE_ENV === "production";
export const storage = isProduction
  ? new DatabaseStorage()
  : new DatabaseStorage();
