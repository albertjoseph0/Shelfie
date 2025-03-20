import Stripe from "stripe";
import { storage } from "../storage";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

if (!process.env.STRIPE_PRICE_ID) {
  throw new Error("STRIPE_PRICE_ID environment variable is required");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function createCheckoutSession(userId: string, email: string) {
  // Check if user already has a subscription
  const subscription = await storage.getSubscription(userId);

  if (subscription?.status === "active") {
    // User already has an active subscription
    return { url: "/library" };
  }

  // Get or create customer
  let stripeCustomerId: string;
  const existingCustomer = await storage.getStripeCustomer(userId);

  if (existingCustomer) {
    stripeCustomerId = existingCustomer;
  } else {
    // Create a new customer in Stripe
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });
    stripeCustomerId = customer.id;
    await storage.saveStripeCustomer(userId, stripeCustomerId);
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${process.env.FRONTEND_URL || "http://localhost:5000"}/subscribe-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5000"}/subscribe-cancel`,
    metadata: {
      userId,
    },
  });

  return { url: session.url };
}

export async function handleWebhook(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subscriptionId = session.subscription as string;

      if (userId && subscriptionId) {
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        await storage.createSubscription({
          userId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscriptionId,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });
      }
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata.userId;

      if (userId) {
        await storage.updateSubscription(userId, {
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.userId;

      if (userId) {
        await storage.updateSubscription(userId, {
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });
      }
      break;
    }
  }
}
