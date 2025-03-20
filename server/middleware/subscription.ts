import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { subscriptions } from "@shared/schema";
import { eq } from "drizzle-orm";

export const requireSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, req.userId));

    if (!subscription || subscription.status !== "active") {
      return res.status(403).json({
        message: "Active subscription required",
        code: "SUBSCRIPTION_REQUIRED"
      });
    }

    next();
  } catch (error) {
    console.error("Error checking subscription:", error);
    res.status(500).json({ message: "Error checking subscription status" });
  }
};

export const getSubscriptionStatus = async (userId: string) => {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  return subscription;
};
