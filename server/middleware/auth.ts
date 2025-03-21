import { Request, Response, NextFunction } from "express";
import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

// Validate required environment variables
if (!process.env.CLERK_SECRET_KEY) {
  console.error('Error: CLERK_SECRET_KEY environment variable is required');
  process.exit(1);
}

// Extend Express Request to include auth information
declare global {
  namespace Express {
    interface Request {
      auth: {
        userId: string | null;
        sessionId: string | null;
        orgId: string | null;
      }
      userId?: string; // Add userId to Request type
    }
  }
}

// Options for Clerk authentication - enable Bearer token support
const clerkOptions = {
  authorizedParties: [],
  jwtKey: process.env.CLERK_JWT_KEY,
  apiKey: process.env.CLERK_SECRET_KEY,
  // Tell Clerk to look for the auth token in the Authorization header
  headerToken: true
};

// Middleware to extract userId and make it available in req
export const extractUserId = ClerkExpressWithAuth(clerkOptions);

// Middleware to require authentication for specific routes
export const requireAuth = ClerkExpressRequireAuth(clerkOptions);

// Helper middleware to ensure userId exists and convert it to internal format
export const ensureUserId = (req: Request, res: Response, next: NextFunction) => {
  const clerkUserId = req.auth?.userId;

  if (!clerkUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Add userId to request object
  req.userId = clerkUserId;
  next();
};