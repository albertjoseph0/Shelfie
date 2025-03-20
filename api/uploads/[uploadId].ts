import { NextApiRequest, NextApiResponse } from '@vercel/node';
import { storage } from '../../server/storage';
import { requireAuth, ensureUserId } from '../../server/middleware/auth';

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

  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { uploadId } = req.query;
    await storage.deleteBooksByUploadId(uploadId as string, req.userId);
    res.status(204).send(null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
