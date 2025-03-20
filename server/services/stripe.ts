import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia' // Use the latest API version
});

// This function checks if a user has an active subscription
export async function checkUserSubscription(userId: string): Promise<boolean> {
  try {
    // In a real implementation, you would:
    // 1. Look up the Stripe customer ID for this userId in your database
    // 2. Query Stripe to check if the customer has an active subscription
    
    // For now, we'll use a direct lookup assuming you'll implement 
    // the customer ID storage later
    
    // This is a placeholder implementation
    const customers = await stripe.customers.list({
      email: userId, // Using userId as email for demo purposes
      limit: 1,
    });
    
    if (customers.data.length === 0) {
      return false; // No customer found
    }
    
    const customerId = customers.data[0].id;
    
    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });
    
    return subscriptions.data.length > 0;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false; // Assume no subscription on error
  }
}

export async function createCheckoutSession(successUrl: string, cancelUrl: string, userId?: string) {
  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Shelfie Monthly Subscription',
              description: 'Catalog up to 50 books per month with Shelfie',
              images: ['https://your-domain.com/logo.png'], // You should update this with a real image
            },
            unit_amount: 2000, // $20.00 in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    // If we have a userId, store it as client_reference_id and metadata
    if (userId) {
      sessionParams.client_reference_id = userId;
      sessionParams.metadata = {
        userId: userId
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function handleWebhookEvent(payload: any, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required");
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful checkout
        const session = event.data.object;
        // Store customer info, activate subscription, etc.
        console.log(`Payment succeeded for session: ${session.id}`);
        break;
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        const subscription = event.data.object;
        console.log(`Subscription ${subscription.id} was cancelled`);
        break;
      // Add other webhook handlers as needed
    }

    return { received: true };
  } catch (error) {
    console.error('Webhook error:', error);
    throw error;
  }
}