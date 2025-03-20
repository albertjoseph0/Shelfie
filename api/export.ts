import { NextApiRequest, NextApiResponse } from '@vercel/node';
import { storage } from '../server/storage';
import { requireAuth, ensureUserId } from '../server/middleware/auth';

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

  if (req.method !== 'GET') {
    return res.status(405).json({ message: "Method not allowed" });
  }

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
}
