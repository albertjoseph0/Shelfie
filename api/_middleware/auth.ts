import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

// Middleware that doesn't end the request on failure (for error handling)
export const extractUserId = (req, res, next) => {
  ClerkExpressWithAuth({
    jwtKey: process.env.CLERK_JWT_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  })(req, res, next);
};

// Middleware that requires auth
export const requireAuth = (req, res, next) => {
  ClerkExpressRequireAuth({
    jwtKey: process.env.CLERK_JWT_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  })(req, res, next);
};

// Helper to ensure userId exists and format it
export const ensureUserId = (req, res, next) => {
  const clerkUserId = req.auth?.userId;
  
  if (!clerkUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  req.userId = clerkUserId;
  next();
};
