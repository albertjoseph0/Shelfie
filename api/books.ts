import { VercelRequest, VercelResponse } from './types';
import { storage } from '../server/storage';
import { requireAuth, ensureUserId } from '../server/middleware/auth';
import { getBookById } from '../server/services/google-books';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apply authentication middleware
  try {
    await new Promise((resolve, reject) => {
      requireAuth(req, res, (err) => {
        if (err) reject(err);
        else resolve(null);
      });
    });

    await new Promise((resolve, reject) => {
      ensureUserId(req, res, (err) => {
        if (err) reject(err);
        else resolve(null);
      });
    });
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Handle different HTTP methods
  if (req.method === 'GET') {
    const { id } = req.query;

    try {
      if (id) {
        // Get single book details
        const book = await storage.getBook(parseInt(id as string), req.userId);
        if (!book?.googleBooksId) {
          return res.status(404).json({ message: "Book not found" });
        }
        const details = await getBookById(book.googleBooksId);
        return res.json(details);
      } else {
        // Get all books
        const books = await storage.getBooks(req.userId);
        books.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        return res.json(books);
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } 
  else if (req.method === 'DELETE') {
    try {
      const bookId = parseInt(req.query.id as string);
      await storage.deleteBook(bookId, req.userId);
      return res.status(204).send(null);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
}