import { Request, Response, NextFunction } from "express";
import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

// Extend Express Request to include auth information
declare global {
  namespace Express {
    interface Request {
      auth: {
        userId: string | null;
        sessionId: string | null;
        session: {
          id: string;
          status: string;
          lastActiveAt: number;
          expireAt: number;
        } | null;
      }
    }
  }
}

// Middleware to extract userId and session info
export const extractUserId = ClerkExpressWithAuth();

// Middleware to require authentication and valid session
export const requireAuth = ClerkExpressRequireAuth();

// Helper middleware to ensure userId exists and session is valid
export const ensureUserId = (req: Request, res: Response, next: NextFunction) => {
  const clerkUserId = req.auth?.userId;
  const sessionId = req.auth?.sessionId;
  const session = req.auth?.session;

  if (!clerkUserId || !sessionId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if session is expired
  if (session && session.expireAt < Date.now()) {
    return res.status(440).json({ message: "Session expired" });
  }

  next();
};