import Stripe from 'stripe';
import { db } from '../db';
import { userSubscriptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const SUBSCRIPTION_PRICE = 2000; // $20.00 in cents

export async function createCheckoutSession(userId: string, email: string) {
  // Check if user already has a stripe customer
  const [existingSubscription] = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId));

  let customerId = existingSubscription?.stripeCustomerId;

  if (!customerId) {
    // Create a new customer in Stripe
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });
    customerId = customer.id;

    // Save the customer ID
    await db.insert(userSubscriptions).values({
      userId,
      stripeCustomerId: customerId,
      isActive: false,
    });
  }

  // Create a checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shelfie Pro Subscription',
            description: 'Full access to Shelfie book cataloging features',
          },
          unit_amount: SUBSCRIPTION_PRICE,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NODE_ENV === 'production' ? 'https://' : 'http://'}${process.env.FRONTEND_URL || 'localhost:5000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NODE_ENV === 'production' ? 'https://' : 'http://'}${process.env.FRONTEND_URL || 'localhost:5000'}/`,
  });

  return session;
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Find the user subscription
  const [userSubscription] = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.stripeCustomerId, customerId));

  if (!userSubscription) {
    console.error('No user found for customer', customerId);
    return;
  }

  // Update subscription status
  await db
    .update(userSubscriptions)
    .set({
      stripeSubscriptionId: subscription.id,
      isActive: subscription.status === 'active',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.stripeCustomerId, customerId));
}

export async function isUserSubscribed(userId: string): Promise<boolean> {
  const [subscription] = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId));

  return Boolean(subscription?.isActive);
}
