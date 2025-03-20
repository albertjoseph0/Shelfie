import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { analyzeBookshelfImage } from "./services/openai";
import { searchBook, getBookById } from "./services/google-books";
import { insertBookSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { extractUserId, requireAuth, ensureUserId } from "./middleware/auth";
import { authLimiter, uploadLimiter } from "./middleware/security";
import { createCheckoutSession, handleSubscriptionUpdated, isUserSubscribed } from "./services/stripe";
import Stripe from "stripe";
import express from 'express';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function registerRoutes(app: Express) {
  // Add authentication middleware to all routes
  app.use(extractUserId);

  // Public routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Stripe webhook handler
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).send('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === 'customer.subscription.updated' || 
          event.type === 'customer.subscription.created') {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error('Error handling webhook:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Create checkout session
  app.post('/api/create-checkout-session', requireAuth, ensureUserId, async (req, res) => {
    try {
      if (!req.auth?.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const session = await createCheckoutSession(req.auth.userId, req.body.email);
      res.json({ url: session.url });
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Check subscription status
  app.get('/api/subscription', requireAuth, ensureUserId, async (req, res) => {
    try {
      if (!req.auth?.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const subscribed = await isUserSubscribed(req.auth.userId);
      res.json({ subscribed });
    } catch (err: any) {
      console.error('Error checking subscription:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Protected routes that require subscription
  const requireSubscription = async (req: any, res: any, next: any) => {
    try {
      if (!req.auth?.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const subscribed = await isUserSubscribed(req.auth.userId);
      if (!subscribed) {
        return res.status(403).json({ 
          message: 'Subscription required',
          code: 'SUBSCRIPTION_REQUIRED'
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };

  // Add subscription check to protected routes
  app.get("/api/books", requireAuth, ensureUserId, requireSubscription, async (req, res) => {
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
  app.get("/api/export", requireAuth, ensureUserId, requireSubscription, async (req, res) => {
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
  app.post("/api/analyze", requireAuth, ensureUserId, requireSubscription, uploadLimiter, async (req, res) => {
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
  app.delete("/api/books/:id", requireAuth, ensureUserId, requireSubscription, async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      await storage.deleteBook(bookId, req.userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Undo an upload - protected
  app.delete("/api/uploads/:uploadId", requireAuth, ensureUserId, requireSubscription, async (req, res) => {
    try {
      const { uploadId } = req.params;
      await storage.deleteBooksByUploadId(uploadId, req.userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get detailed book info - protected
  app.get("/api/books/:id/details", requireAuth, ensureUserId, requireSubscription, async (req, res) => {
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