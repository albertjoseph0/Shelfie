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

// Debug helper for authentication issues
const logAuthError = (error: any, req: Request) => {
  console.error('Authentication Error:', {
    error: error.message,
    path: req.path,
    headers: {
      authorization: req.headers.authorization ? 'present' : 'missing',
      cookie: req.headers.cookie ? 'present' : 'missing'
    },
    clerk_key_present: !!process.env.CLERK_SECRET_KEY
  });
};

// Middleware to extract userId and make it available in req
export const extractUserId = ClerkExpressWithAuth({
  onError: (err, req, res) => {
    logAuthError(err, req);
    // Continue even if auth fails - some routes are public
    req.auth = { userId: null, sessionId: null, orgId: null };
    return;
  }
});

// Middleware to require authentication for specific routes
export const requireAuth = ClerkExpressRequireAuth({
  onError: (err, req, res) => {
    logAuthError(err, req);
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please sign in to access this resource'
    });
  }
});

// Helper middleware to ensure userId exists and convert it to internal format
export const ensureUserId = (req: Request, res: Response, next: NextFunction) => {
  const clerkUserId = req.auth?.userId;

  if (!clerkUserId) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: "Please sign in to continue"
    });
  }

  // Add userId to request object
  req.userId = clerkUserId;
  next();
};