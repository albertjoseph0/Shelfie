import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession(userId: string, successUrl: string, cancelUrl: string) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID, // The price ID for your $20/month subscription
        quantity: 1,
      },
    ],
    customer_email: userId, // Using Clerk user ID as customer reference
    client_reference_id: userId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
  });

  return session;
}

export async function getSubscriptionStatus(userId: string) {
  // Find customers with the matching userId in metadata
  const customers = await stripe.customers.list({
    email: userId,
  });

  if (customers.data.length === 0) {
    return { isSubscribed: false };
  }

  // Get subscriptions for the customer
  const subscriptions = await stripe.subscriptions.list({
    customer: customers.data[0].id,
    status: 'active',
  });

  return {
    isSubscribed: subscriptions.data.length > 0,
    subscriptionData: subscriptions.data[0] || null,
  };
}

export { stripe };