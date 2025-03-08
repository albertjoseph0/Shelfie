import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { analyzeBookshelfImage } from "./services/openai";
import { searchBook, getBookById } from "./services/google-books";
import { insertBookSchema, insertLibrarySchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  // Book analysis and creation
  app.post("/api/analyze", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ message: "Image data is required" });
      }

      const analysis = await analyzeBookshelfImage(image);
      const books = await Promise.all(
        analysis.books.map(async (book) => {
          const googleBooks = await searchBook(`${book.title} ${book.author || ''}`);
          if (googleBooks.length === 0) return null;

          const bookInfo = googleBooks[0].volumeInfo;
          const bookData = {
            title: bookInfo.title,
            author: bookInfo.authors?.[0] || "Unknown",
            isbn: bookInfo.industryIdentifiers?.[0]?.identifier,
            coverUrl: bookInfo.imageLinks?.thumbnail,
            description: bookInfo.description,
            pageCount: bookInfo.pageCount,
            googleBooksId: googleBooks[0].id,
            metadata: {
              categories: bookInfo.categories,
              publishedDate: bookInfo.publishedDate,
              publisher: bookInfo.publisher
            }
          };

          const parsed = insertBookSchema.safeParse(bookData);
          if (!parsed.success) return null;

          return await storage.createBook(parsed.data);
        })
      );

      res.json({ books: books.filter(Boolean) });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Library management
  app.post("/api/library", async (req, res) => {
    try {
      const parsed = insertLibrarySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid library entry data" });
      }

      const entry = await storage.addToLibrary(parsed.data);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/library/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const library = await storage.getLibrary(userId);
      res.json(library);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/library/:userId/:bookId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const bookId = parseInt(req.params.bookId);
      await storage.removeFromLibrary(userId, bookId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
