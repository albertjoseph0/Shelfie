// WARNING: This is an in-memory storage implementation for development.
// For production deployment on Vercel:
// 1. Functions are stateless and don't maintain memory between executions
// 2. Multiple function instances might run simultaneously
// TODO: Replace with a persistent database solution before deploying to production

import type { Book, InsertBook } from "@shared/schema";

export interface IStorage {
  // Book operations with userId
  createBook(book: InsertBook, uploadId: string, userId: string): Promise<Book>;
  getBook(id: number, userId: string): Promise<Book | undefined>;
  getBooks(userId: string): Promise<Book[]>;
  deleteBook(id: number, userId: string): Promise<void>;
  deleteBooksByUploadId(uploadId: string, userId: string): Promise<void>;
  searchBooks(query: string, userId: string): Promise<Book[]>;
}

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

export const storage = new MemStorage();