import type { Book, InsertBook } from "@shared/schema";
import { db } from "./db";
import { books } from "@shared/schema";
import { eq, and, like, or } from "drizzle-orm";

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
    console.log('Attempting to create book:', { book, uploadId, userId });
    const [newBook] = await db
      .insert(books)
      .values({
        ...book,
        userId,
        uploadId
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
      .where(eq(books.userId, userId));

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

// Keep MemStorage for development if needed
export class MemStorage implements IStorage {
  private books: Map<number, Book & { uploadId: string, userId: string }>;
  private bookId: number;

  constructor() {
    this.books = new Map();
    this.bookId = 1;
  }

  async createBook(book: InsertBook, uploadId: string, userId: string): Promise<Book> {
    const id = this.bookId++;
    const newBook: Book & { uploadId: string, userId: string } = {
      ...book,
      id,
      metadata: book.metadata ?? null,
      isbn: book.isbn ?? null,
      coverUrl: book.coverUrl ?? null,
      description: book.description ?? null,
      pageCount: book.pageCount ?? null,
      googleBooksId: book.googleBooksId ?? null,
      uploadId,
      userId
    };
    this.books.set(id, newBook);
    console.log(`Created book with ID ${id} for user ${userId}:`, newBook);
    return newBook;
  }

  async getBook(id: number, userId: string): Promise<Book | undefined> {
    const book = this.books.get(id);
    return book && book.userId === userId ? book : undefined;
  }

  async getBooks(userId: string): Promise<Book[]> {
    const books = Array.from(this.books.values())
      .filter(book => book.userId === userId);
    console.log(`Retrieved ${books.length} books for user ${userId}`);
    return books;
  }

  async deleteBook(id: number, userId: string): Promise<void> {
    const book = this.books.get(id);
    if (book && book.userId === userId) {
      this.books.delete(id);
      console.log(`Deleted book with ID ${id} for user ${userId}`);
    }
  }

  async deleteBooksByUploadId(uploadId: string, userId: string): Promise<void> {
    const booksToDelete = Array.from(this.books.entries())
      .filter(([_, book]) => book.uploadId === uploadId && book.userId === userId);

    booksToDelete.forEach(([id]) => this.books.delete(id));
    console.log(`Deleted ${booksToDelete.length} books from upload ${uploadId} for user ${userId}`);
  }

  async searchBooks(query: string, userId: string): Promise<Book[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.books.values())
      .filter(book => book.userId === userId)
      .filter(book =>
        book.title.toLowerCase().includes(lowercaseQuery) ||
        book.author.toLowerCase().includes(lowercaseQuery)
      );
  }
}

// Switch storage implementation based on environment
const isProduction = process.env.NODE_ENV === 'production';
export const storage = isProduction ? new DatabaseStorage() : new MemStorage();