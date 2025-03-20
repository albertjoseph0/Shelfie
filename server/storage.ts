import type { Book, InsertBook } from "@shared/schema";
import { db } from "./db";
import { books } from "@shared/schema";
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
}

export class DatabaseStorage implements IStorage {
  async getBooksAddedThisMonth(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const count = await db
      .select({ count: books.id })
      .from(books)
      .where(
        and(
          eq(books.userId, userId),
          gte(books.createdAt, startOfMonth)
        )
      )
      .count();

    return Number(count) || 0;
  }

  async createBook(book: InsertBook, uploadId: string, userId: string): Promise<Book> {
    const monthlyCount = await this.getBooksAddedThisMonth(userId);
    if (monthlyCount >= MONTHLY_BOOK_LIMIT) {
      throw new Error(`Monthly limit of ${MONTHLY_BOOK_LIMIT} books reached. Please try again next month.`);
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
      .where(and(
        eq(books.userId, userId),
        or(
          like(books.title, lowercaseQuery),
          like(books.author, lowercaseQuery)
        )
      ));

    return results;
  }
}


// Switch storage implementation based on environment
const isProduction = process.env.NODE_ENV === 'production';
export const storage = isProduction ? new DatabaseStorage() : new DatabaseStorage();