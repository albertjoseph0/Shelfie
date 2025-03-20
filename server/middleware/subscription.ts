import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export const requireSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const subscription = await storage.getSubscription(req.userId);

  if (!subscription || subscription.status !== "active") {
    return res.status(403).json({
      message: "Subscription required",
      code: "subscription_required",
    });
  }

  next();
};
