import './types';
import express from 'express';
import serverless from 'serverless-http';
import { extractUserId } from '../server/middleware/auth';
import { storage } from '../server/storage';
import { analyzeBookshelfImage } from '../server/services/openai';
import { searchBook, getBookById } from '../server/services/google-books';
import { nanoid } from 'nanoid';

// Create Express app
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Add authentication middleware
app.use(extractUserId);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Books endpoint
app.get('/books', async (req, res) => {
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

// Export endpoint
app.get('/export', async (req, res) => {
  try {
    const books = await storage.getBooks(req.userId);
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

// Analyze endpoint
app.post('/analyze', async (req, res) => {
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

        const savedBook = await storage.createBook(bookData, uploadId, req.userId);
        return savedBook;
      })
    );

    const validBooks = books.filter(Boolean);
    res.json({ books: validBooks, uploadId });
  } catch (error) {
    console.error("Error in /analyze:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete book endpoint
app.delete('/books/:id', async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    await storage.deleteBook(bookId, req.userId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Undo upload endpoint
app.delete('/uploads/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;
    await storage.deleteBooksByUploadId(uploadId, req.userId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Book details endpoint
app.get('/books/:id/details', async (req, res) => {
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

// Export the serverless handler
export default serverless(app);