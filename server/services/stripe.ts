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
    // Look for customers with metadata.userId matching the Clerk userId
    const customers = await stripe.customers.list({
      limit: 100
    });
    
    // Find the customer matching our userId in metadata
    const matchingCustomer = customers.data.find(
      customer => customer.metadata?.userId === userId
    );
    
    if (!matchingCustomer) {
      // As a fallback, check if any customers have been created with this client_reference_id
      const checkoutSessions = await stripe.checkout.sessions.list({
        limit: 100
      });
      
      const matchingSession = checkoutSessions.data.find(
        session => session.client_reference_id === userId && session.status === 'complete'
      );
      
      if (!matchingSession) {
        return false; // No matching customer or completed session found
      }
      
      // Use the customer from the matching session
      if (!matchingSession.customer) {
        return false;
      }
      
      const customerId = typeof matchingSession.customer === 'string' 
        ? matchingSession.customer 
        : matchingSession.customer.id;
      
      // Check for active subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });
      
      return subscriptions.data.length > 0;
    }
    
    // Check for active subscriptions for the matching customer
    const subscriptions = await stripe.subscriptions.list({
      customer: matchingCustomer.id,
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