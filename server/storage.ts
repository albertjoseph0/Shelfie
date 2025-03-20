import type { Book, InsertBook } from "@shared/schema";
import { books } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike } from "drizzle-orm";

export interface IStorage {
  // Book operations with userId
  createBook(book: InsertBook, uploadId: string, userId: string): Promise<Book>;
  getBook(id: number, userId: string): Promise<Book | undefined>;
  getBooks(userId: string): Promise<Book[]>;
  deleteBook(id: number, userId: string): Promise<void>;
  deleteBooksByUploadId(uploadId: string, userId: string): Promise<void>;
  searchBooks(query: string, userId: string): Promise<Book[]>;
}

// PostgreSQL implementation
export class PostgresStorage implements IStorage {
  async createBook(book: InsertBook, uploadId: string, userId: string): Promise<Book> {
    try {
      const [newBook] = await db
        .insert(books)
        .values({
          ...book,
          userId,
          uploadId,
          metadata: book.metadata || null,
          createdAt: new Date().toISOString()
        })
        .returning();

      console.log(`Created book with ID ${newBook.id} for user ${userId}`);
      return newBook;
    } catch (error) {
      console.error('Error creating book:', error);
      throw new Error('Failed to create book');
    }
  }

  async getBook(id: number, userId: string): Promise<Book | undefined> {
    try {
      const [book] = await db
        .select()
        .from(books)
        .where(and(eq(books.id, id), eq(books.userId, userId)));

      return book;
    } catch (error) {
      console.error('Error getting book:', error);
      throw new Error('Failed to get book');
    }
  }

  async getBooks(userId: string): Promise<Book[]> {
    try {
      const userBooks = await db
        .select()
        .from(books)
        .where(eq(books.userId, userId));

      console.log(`Retrieved ${userBooks.length} books for user ${userId}`);
      return userBooks;
    } catch (error) {
      console.error('Error getting books:', error);
      throw new Error('Failed to get books');
    }
  }

  async deleteBook(id: number, userId: string): Promise<void> {
    try {
      await db
        .delete(books)
        .where(and(eq(books.id, id), eq(books.userId, userId)));

      console.log(`Deleted book with ID ${id} for user ${userId}`);
    } catch (error) {
      console.error('Error deleting book:', error);
      throw new Error('Failed to delete book');
    }
  }

  async deleteBooksByUploadId(uploadId: string, userId: string): Promise<void> {
    try {
      const result = await db
        .delete(books)
        .where(and(eq(books.uploadId, uploadId), eq(books.userId, userId)))
        .returning();

      console.log(`Deleted ${result.length} books from upload ${uploadId} for user ${userId}`);
    } catch (error) {
      console.error('Error deleting books by upload:', error);
      throw new Error('Failed to delete books by upload');
    }
  }

  async searchBooks(query: string, userId: string): Promise<Book[]> {
    try {
      const searchResults = await db
        .select()
        .from(books)
        .where(
          and(
            eq(books.userId, userId),
            or(
              ilike(books.title, `%${query}%`),
              ilike(books.author, `%${query}%`)
            )
          )
        );

      return searchResults;
    } catch (error) {
      console.error('Error searching books:', error);
      throw new Error('Failed to search books');
    }
  }
}

// Export PostgresStorage
export const storage = new PostgresStorage();