import type { Book, InsertBook, Library, InsertLibrary } from "@shared/schema";

export interface IStorage {
  // Book operations
  createBook(book: InsertBook): Promise<Book>;
  getBook(id: number): Promise<Book | undefined>;
  getBooks(): Promise<Book[]>;
  searchBooks(query: string): Promise<Book[]>;

  // Library operations
  addToLibrary(entry: InsertLibrary): Promise<Library>;
  getLibrary(userId: number): Promise<Library[]>;
  removeFromLibrary(userId: number, bookId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private books: Map<number, Book>;
  private libraries: Map<number, Library>;
  private bookId: number;
  private libraryId: number;

  constructor() {
    this.books = new Map();
    this.libraries = new Map();
    this.bookId = 1;
    this.libraryId = 1;
  }

  async createBook(book: InsertBook): Promise<Book> {
    const id = this.bookId++;
    const newBook: Book = {
      ...book,
      id,
      metadata: book.metadata ?? null,
      isbn: book.isbn ?? null,
      coverUrl: book.coverUrl ?? null,
      description: book.description ?? null,
      pageCount: book.pageCount ?? null,
      googleBooksId: book.googleBooksId ?? null
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

  async searchBooks(query: string): Promise<Book[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.books.values()).filter(
      book => 
        book.title.toLowerCase().includes(lowercaseQuery) ||
        book.author.toLowerCase().includes(lowercaseQuery)
    );
  }

  async addToLibrary(entry: InsertLibrary): Promise<Library> {
    const id = this.libraryId++;
    const newEntry: Library = {
      ...entry,
      id,
      shelfName: entry.shelfName ?? 'Default'
    };
    this.libraries.set(id, newEntry);
    return newEntry;
  }

  async getLibrary(userId: number): Promise<Library[]> {
    return Array.from(this.libraries.values())
      .filter(entry => entry.userId === userId);
  }

  async removeFromLibrary(userId: number, bookId: number): Promise<void> {
    const entries = Array.from(this.libraries.entries());
    for (const [key, entry] of entries) {
      if (entry.userId === userId && entry.bookId === bookId) {
        this.libraries.delete(key);
        return;
      }
    }
  }
}

export const storage = new MemStorage();