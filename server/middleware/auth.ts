import { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionToken = req.header("Authorization")?.replace("Bearer ", "");

    if (!sessionToken) {
      return res.status(401).json({ message: "No authentication token provided" });
    }

    // Verify the session token using Clerk
    const sessions = await clerkClient.sessions.getSessionList({
      status: "active",
    });
    const session = sessions.find(s => s.id === sessionToken);

    if (!session) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

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