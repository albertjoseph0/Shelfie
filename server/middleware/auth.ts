
import { Request, Response, NextFunction } from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

export const requireAuth = ClerkExpressRequireAuth();

export function addUserToRequest(req: Request, res: Response, next: NextFunction) {
  const userId = req.auth?.userId;
  if (userId) {
    req.user = { id: userId };
  }
  next();
}
