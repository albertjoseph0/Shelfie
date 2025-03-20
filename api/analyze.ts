import { NextApiRequest, NextApiResponse } from '@vercel/node';
import { storage } from '../server/storage';
import { requireAuth, ensureUserId } from '../server/middleware/auth';
import { analyzeBookshelfImage } from '../server/services/openai';
import { searchBook } from '../server/services/google-books';
import { nanoid } from 'nanoid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method not allowed" });
  }

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
    console.error("Error in /api/analyze:", error);
    res.status(500).json({ message: error.message });
  }
}
