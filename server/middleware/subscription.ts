import { Request, Response, NextFunction } from "express";
import { getSubscriptionStatus } from "../services/stripe";

export const requireSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { isSubscribed } = await getSubscriptionStatus(req.userId);
    
    if (!isSubscribed) {
      return res.status(403).json({ 
        message: "Subscription required", 
        subscriptionRequired: true 
      });
    }
    
    next();
  } catch (error) {
    console.error("Error checking subscription:", error);
    res.status(500).json({ message: "Error checking subscription status" });
  }
};