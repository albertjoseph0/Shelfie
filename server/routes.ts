import express, { type Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { analyzeBookshelfImage } from "./services/openai";
import { searchBook, getBookById } from "./services/google-books";
import { insertBookSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { extractUserId, requireAuth, ensureUserId } from "./middleware/auth";
import { authLimiter, uploadLimiter } from "./middleware/security";
import { requireSubscription } from "./middleware/subscription";
import { createCheckoutSession, handleWebhook } from "./services/stripe";

export async function registerRoutes(app: Express) {
  // Add authentication middleware to all routes
  app.use(extractUserId);

  // Public routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Stripe webhook - this must be before other middleware
  app.post(
    "/api/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];

      if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res
          .status(400)
          .send(`Webhook Error: Missing signature or secret`);
      }

      try {
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        const event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET,
        );

        await handleWebhook(event);
        res.json({ received: true });
      } catch (error) {
        console.error("Webhook error:", error);
        res.status(400).send(`Webhook Error: ${error.message}`);
      }
    },
  );

  // Create checkout session
  app.post(
    "/api/create-checkout-session",
    requireAuth,
    ensureUserId,
    async (req, res) => {
      try {
        // Get user's email from Clerk
        const { email } = req.body;

        if (!email) {
          return res.status(400).json({ message: "Email is required" });
        }

        const { url } = await createCheckoutSession(req.userId, email);
        res.json({ url });
      } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ message: error.message });
      }
    },
  );

  // Subscription status endpoint
  app.get("/api/subscription", requireAuth, ensureUserId, async (req, res) => {
    try {
      const subscription = await storage.getSubscription(req.userId);
      res.json({
        isSubscribed: subscription?.status === "active",
        subscription,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Protected routes - all API endpoints that need auth and subscription
  app.get(
    "/api/books",
    requireAuth,
    ensureUserId,
    requireSubscription,
    async (req, res) => {
      try {
        const books = await storage.getBooks(req.userId);
        books.sort((a, b) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        res.json(books);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    },
  );

  // Export library as CSV - protected
  app.get(
    "/api/export",
    requireAuth,
    ensureUserId,
    requireSubscription,
    async (req, res) => {
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
            "Description",
          ].join(","),
        ];

        // Add book data
        for (const book of books) {
          const row = [
            `"${book.title.replace(/"/g, '""')}"`,
            `"${book.author.replace(/"/g, '""')}"`,
            `"${book.isbn || ""}"`,
            `"${new Date(book.createdAt).toLocaleDateString()}"`,
            `"${book.metadata?.publisher || ""}"`,
            `"${book.metadata?.publishedDate || ""}"`,
            `"${book.metadata?.categories?.join("; ") || ""}"`,
            `"${book.pageCount || ""}"`,
            `"${(book.description || "").replace(/"/g, '""')}"`,
          ].join(",");
          csvRows.push(row);
        }

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=my-library.csv",
        );
        res.send(csvRows.join("\n"));
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    },
  );

  // Book analysis and creation - protected and rate limited
  app.post(
    "/api/analyze",
    requireAuth,
    ensureUserId,
    requireSubscription,
    uploadLimiter,
    async (req, res) => {
      try {
        const { image } = req.body;
        if (!image) {
          return res.status(400).json({ message: "Image data is required" });
        }

        const uploadId = nanoid();

        // Get current month's book count
        const monthlyCount = await storage.getBooksAddedThisMonth(req.userId);
        const analysis = await analyzeBookshelfImage(image);

        // Check if adding these books would exceed the monthly limit
        if (monthlyCount + analysis.books.length > 50) {
          return res.status(403).json({
            message: `Adding ${analysis.books.length} books would exceed your monthly limit of 50 books. You have added ${monthlyCount} books this month.`,
          });
        }

        const books = await Promise.all(
          analysis.books.map(async (book) => {
            try {
              const googleBooks = await searchBook(
                `${book.title} ${book.author || ""}`,
              );
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
                  publisher: bookInfo.publisher,
                },
              };

              const parsed = insertBookSchema.safeParse(bookData);
              if (!parsed.success) {
                console.error("Book validation failed:", parsed.error);
                return null;
              }

              const savedBook = await storage.createBook(
                parsed.data,
                uploadId,
                req.userId,
              );
              return savedBook;
            } catch (error) {
              if (error.message.includes("Monthly limit")) {
                throw error; // Re-throw monthly limit errors
              }
              console.error("Error processing book:", error);
              return null;
            }
          }),
        ).catch((error) => {
          if (error.message.includes("Monthly limit")) {
            throw error; // Re-throw monthly limit errors
          }
          return [];
        });

        const validBooks = books.filter(Boolean);
        res.json({ books: validBooks, uploadId });
      } catch (error) {
        console.error("Error in /api/analyze:", error);
        if (error.message.includes("Monthly limit")) {
          res.status(403).json({ message: error.message });
        } else {
          res.status(500).json({ message: error.message });
        }
      }
    },
  );

  // Delete a single book - protected
  app.delete(
    "/api/books/:id",
    requireAuth,
    ensureUserId,
    requireSubscription,
    async (req, res) => {
      try {
        const bookId = parseInt(req.params.id);
        await storage.deleteBook(bookId, req.userId);
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    },
  );

  // Undo an upload - protected
  app.delete(
    "/api/uploads/:uploadId",
    requireAuth,
    ensureUserId,
    requireSubscription,
    async (req, res) => {
      try {
        const { uploadId } = req.params;
        await storage.deleteBooksByUploadId(uploadId, req.userId);
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    },
  );

  // Get detailed book info - protected
  app.get(
    "/api/books/:id/details",
    requireAuth,
    ensureUserId,
    requireSubscription,
    async (req, res) => {
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
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}
