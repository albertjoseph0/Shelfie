import { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionToken = req.header("Authorization")?.replace("Bearer ", "");

    if (!sessionToken) {
      return res.status(401).json({ message: "No authentication token provided" });
    }

    // Call Clerk's verifyToken endpoint with the session token
    const session = await clerkClient.sessions.verifySession(sessionToken); //Corrected parameter

    req.auth = {
      userId: session.userId,
      sessionId: session.id
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Invalid authentication token" });
  }
}

// Add auth type to Express Request
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
      };
    }
  }
}