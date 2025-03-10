import type { Book, InsertBook } from "@shared/schema";

export interface IStorage {
  // Book operations
  createBook(book: InsertBook, uploadId: string): Promise<Book>;
  getBook(id: number): Promise<Book | undefined>;
  getBooks(): Promise<Book[]>;
  deleteBook(id: number): Promise<void>;
  deleteBooksByUploadId(uploadId: string): Promise<void>;
  searchBooks(query: string): Promise<Book[]>;
}

export class MemStorage implements IStorage {
  private books: Map<number, Book & { uploadId: string }>;
  private bookId: number;

  constructor() {
    this.books = new Map();
    this.bookId = 1;
  }

  async createBook(book: InsertBook, uploadId: string): Promise<Book> {
    const id = this.bookId++;
    const newBook: Book & { uploadId: string } = {
      ...book,
      id,
      metadata: book.metadata ?? null,
      isbn: book.isbn ?? null,
      coverUrl: book.coverUrl ?? null,
      description: book.description ?? null,
      pageCount: book.pageCount ?? null,
      googleBooksId: book.googleBooksId ?? null,
      uploadId
    };
    this.books.set(id, newBook);
    console.log(`Created book with ID ${id}:`, newBook);
    return newBook;
  }

  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async getBooks(): Promise<Book[]> {
    const books = Array.from(this.books.values());
    console.log(`Retrieved ${books.length} books from storage`);
    return books;
  }

  async deleteBook(id: number): Promise<void> {
    this.books.delete(id);
    console.log(`Deleted book with ID ${id}`);
  }

  async deleteBooksByUploadId(uploadId: string): Promise<void> {
    const booksToDelete = Array.from(this.books.entries())
      .filter(([_, book]) => book.uploadId === uploadId);

    booksToDelete.forEach(([id]) => this.books.delete(id));
    console.log(`Deleted ${booksToDelete.length} books from upload ${uploadId}`);
  }

  async searchBooks(query: string): Promise<Book[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.books.values()).filter(
      book => 
        book.title.toLowerCase().includes(lowercaseQuery) ||
        book.author.toLowerCase().includes(lowercaseQuery)
    );
  }
}

export const storage = new MemStorage();