import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { analyzeBookshelfImage } from "./services/openai";
import { searchBook, getBookById } from "./services/google-books";
import { insertBookSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { extractUserId, requireAuth, ensureUserId } from "./middleware/auth";
import { authLimiter, uploadLimiter } from "./middleware/security";

export async function registerRoutes(app: Express) {
  // Add authentication middleware to all routes
  app.use(extractUserId);

  // Public routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Protected routes - all API endpoints that need auth
  app.get("/api/books", requireAuth, ensureUserId, async (req, res) => {
    try {
      const books = await storage.getBooks(req.userId);
      books.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Export library as CSV - protected
  app.get("/api/export", requireAuth, ensureUserId, async (req, res) => {
    try {
      const books = await storage.getBooks(req.userId);

      // Create CSV header
      const csvRows = [
        [
          "Title",
          "Author",
          "ISBN",
          "Added Date",
          "Publisher",
          "Published Date",
          "Categories",
          "Page Count",
          "Description"
        ].join(",")
      ];

      // Add book data
      for (const book of books) {
        const row = [
          `"${book.title.replace(/"/g, '""')}"`,
          `"${book.author.replace(/"/g, '""')}"`,
          `"${book.isbn || ''}"`,
          `"${new Date(book.createdAt).toLocaleDateString()}"`,
          `"${book.metadata?.publisher || ''}"`,
          `"${book.metadata?.publishedDate || ''}"`,
          `"${book.metadata?.categories?.join('; ') || ''}"`,
          `"${book.pageCount || ''}"`,
          `"${(book.description || '').replace(/"/g, '""')}"`
        ].join(",");
        csvRows.push(row);
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=my-library.csv');
      res.send(csvRows.join("\n"));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Book analysis and creation - protected and rate limited
  app.post("/api/analyze", requireAuth, ensureUserId, uploadLimiter, async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ message: "Image data is required" });
      }

      const uploadId = nanoid();
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
            createdAt: new Date().toISOString(),
            metadata: {
              categories: bookInfo.categories,
              publishedDate: bookInfo.publishedDate,
              publisher: bookInfo.publisher
            }
          };

          const parsed = insertBookSchema.safeParse(bookData);
          if (!parsed.success) {
            console.error("Book validation failed:", parsed.error);
            return null;
          }

          const savedBook = await storage.createBook(parsed.data, uploadId, req.userId);
          return savedBook;
        })
      );

      const validBooks = books.filter(Boolean);
      res.json({ books: validBooks, uploadId });
    } catch (error) {
      console.error("Error in /api/analyze:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete a single book - protected
  app.delete("/api/books/:id", requireAuth, ensureUserId, async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      await storage.deleteBook(bookId, req.userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Undo an upload - protected
  app.delete("/api/uploads/:uploadId", requireAuth, ensureUserId, async (req, res) => {
    try {
      const { uploadId } = req.params;
      await storage.deleteBooksByUploadId(uploadId, req.userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get detailed book info - protected
  app.get("/api/books/:id/details", requireAuth, ensureUserId, async (req, res) => {
    try {
      const book = await storage.getBook(parseInt(req.params.id), req.userId);
      if (!book?.googleBooksId) {
        return res.status(404).json({ message: "Book not found" });
      }

      const details = await getBookById(book.googleBooksId);
      res.json(details);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}