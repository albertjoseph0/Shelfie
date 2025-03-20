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

// Middleware to extract userId and make it available in req
export const extractUserId = ClerkExpressWithAuth({
  onError: (err, _req, res) => {
    console.error('Clerk authentication error:', err);
    res.status(401).json({
      error: 'Authentication failed',
      message: 'Please sign in to continue',
      code: 'UNAUTHENTICATED'
    });
  }
});

// Middleware to require authentication for specific routes
export const requireAuth = ClerkExpressRequireAuth({
  onError: (err, _req, res) => {
    console.error('Clerk authorization error:', err);
    res.status(401).json({
      error: 'Authorization required',
      message: 'You must be signed in to access this resource',
      code: 'UNAUTHORIZED'
    });
  }
});

// Helper middleware to ensure userId exists and convert it to internal format
export const ensureUserId = (req: Request, res: Response, next: NextFunction) => {
  const clerkUserId = req.auth?.userId;

  if (!clerkUserId) {
    return res.status(401).json({
      error: 'Authorization required',
      message: 'User ID not found in request',
      code: 'INVALID_USER'
    });
  }

  // Add userId to request object
  req.userId = clerkUserId;
  next();
};