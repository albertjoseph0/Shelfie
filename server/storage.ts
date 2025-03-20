import { eq, and, desc } from "drizzle-orm";
import { books, type Book, type InsertBook } from "@shared/schema";
import { db } from "./db";

export interface IStorage {
  // Book operations with userId
  createBook(book: InsertBook, uploadId: string, userId: string): Promise<Book>;
  getBook(id: number, userId: string): Promise<Book | undefined>;
  getBooks(userId: string): Promise<Book[]>;
  deleteBook(id: number, userId: string): Promise<void>;
  deleteBooksByUploadId(uploadId: string, userId: string): Promise<void>;
  searchBooks(query: string, userId: string): Promise<Book[]>;
}

export class DatabaseStorage implements IStorage {
  async createBook(book: InsertBook, uploadId: string, userId: string): Promise<Book> {
    const [newBook] = await db
      .insert(books)
      .values({
        ...book,
        uploadId,
        userId,
        createdAt: new Date().toISOString(),
      })
      .returning();

    console.log(`Created book with ID ${newBook.id} for user ${userId}:`, newBook);
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
      .where(eq(books.userId, userId))
      .orderBy(desc(books.createdAt));

    console.log(`Retrieved ${userBooks.length} books for user ${userId}`);
    return userBooks;
  }

  async deleteBook(id: number, userId: string): Promise<void> {
    await db
      .delete(books)
      .where(and(eq(books.id, id), eq(books.userId, userId)));

    console.log(`Deleted book with ID ${id} for user ${userId}`);
  }

  async deleteBooksByUploadId(uploadId: string, userId: string): Promise<void> {
    const result = await db
      .delete(books)
      .where(and(eq(books.uploadId, uploadId), eq(books.userId, userId)));

    console.log(`Deleted books from upload ${uploadId} for user ${userId}`);
  }

  async searchBooks(query: string, userId: string): Promise<Book[]> {
    const lowercaseQuery = query.toLowerCase();

    const userBooks = await db
      .select()
      .from(books)
      .where(eq(books.userId, userId));

    return userBooks.filter(book =>
      book.title.toLowerCase().includes(lowercaseQuery) ||
      book.author.toLowerCase().includes(lowercaseQuery)
    );
  }
}

export const storage = new DatabaseStorage();