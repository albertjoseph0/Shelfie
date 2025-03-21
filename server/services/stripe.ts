import Stripe from 'stripe';
import { db } from '../db';
import { subscriptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession(userId: string, successUrl: string, cancelUrl: string) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // The price ID for your $20/month subscription
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
    });

    return session;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

export async function getSubscriptionStatus(userId: string) {
  try {
    // For demo purposes, we'll check our database first
    const dbSubscriptions = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);
    
    // If we have an active subscription in our database, return it
    if (dbSubscriptions.length > 0 && dbSubscriptions[0].status === 'active') {
      return { 
        isSubscribed: true,
        subscriptionData: dbSubscriptions[0]
      };
    }
    
    // If no active subscription in the database, check Stripe
    // Find customers with the matching userId in metadata
    const customers = await stripe.customers.search({
      query: `metadata['userId']:'${userId}'`,
    });

    if (customers.data.length === 0) {
      return { isSubscribed: false };
    }

    // Get subscriptions for the customer
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'active',
    });

    return {
      isSubscribed: stripeSubscriptions.data.length > 0,
      subscriptionData: stripeSubscriptions.data[0] || null,
    };
  } catch (error) {
    console.error("Error checking subscription status:", error);
    // In case of an error, default to not subscribed
    return { isSubscribed: false };
  }
}

export { stripe };