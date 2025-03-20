import { Router } from "express";
import Stripe from "stripe";
import { db } from "../db";
import { subscriptions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireAuth, ensureUserId } from "../middleware/auth";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

if (!process.env.STRIPE_PRICE_ID) {
  throw new Error("Missing STRIPE_PRICE_ID");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia"
});

const router = Router();

// Create a Stripe checkout session for subscription
router.post("/create-checkout-session", requireAuth, ensureUserId, async (req, res) => {
  try {
    const { userId } = req;

    // Check if user already has an active subscription
    const [existingSubscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    if (existingSubscription?.status === "active") {
      return res.status(400).json({ message: "User already has an active subscription" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/library?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/`,
      metadata: {
        userId: userId,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ message: "Error creating checkout session" });
  }
});

// Webhook handler for Stripe events
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata.userId;

        // Create subscription record
        await db.insert(subscriptions).values({
          userId,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          status: "active",
          currentPeriodEnd: new Date(session.subscription_data.current_period_end * 1000),
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        // Update subscription status
        await db
          .update(subscriptions)
          .set({
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ message: "Error processing webhook" });
  }
});

export default router;