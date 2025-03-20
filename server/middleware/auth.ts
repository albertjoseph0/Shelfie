import { Request, Response, NextFunction } from "express";
import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

// Extend Express Request to include auth information
declare global {
  namespace Express {
    interface Request {
      auth: {
        userId: string | null;
        sessionId: string | null;
        orgId: string | null;
      }
    }
  }
}

// Middleware to extract userId and make it available in req
export const extractUserId = ClerkExpressWithAuth({
  jwtKey: process.env.CLERK_JWT_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Middleware to require authentication for specific routes
export const requireAuth = ClerkExpressRequireAuth({
  jwtKey: process.env.CLERK_JWT_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Helper middleware to ensure userId exists and convert it to internal format
export const ensureUserId = (req: Request, res: Response, next: NextFunction) => {
  const clerkUserId = req.auth?.userId;
  
  if (!clerkUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // You might want to transform the clerk user ID or perform additional validation
  req.userId = clerkUserId;
  next();
};
