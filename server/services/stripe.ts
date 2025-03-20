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

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        // Handle successful checkout
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get the customer and userId
        const userId = session.client_reference_id || session.metadata?.userId;
        
        if (!userId) {
          console.warn('No userId found in session metadata or client_reference_id');
          break;
        }

        // Ensure customer exists and has metadata
        if (session.customer) {
          const customerId = typeof session.customer === 'string' 
            ? session.customer 
            : session.customer.id;
            
          // Update customer with userId in metadata
          await stripe.customers.update(customerId, {
            metadata: { userId }
          });
          
          console.log(`Updated customer ${customerId} with userId ${userId}`);
        }
        
        console.log(`Payment succeeded for session: ${session.id}, userId: ${userId}`);
        break;
      }
      
      case 'customer.subscription.created': {
        // Handle new subscription
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get customer to check metadata
        const customer = await stripe.customers.retrieve(customerId);
        
        if (!customer || customer.deleted) {
          console.warn(`Customer ${customerId} not found or deleted`);
          break;
        }
        
        const userId = customer.metadata?.userId;
        if (userId) {
          console.log(`New subscription ${subscription.id} created for userId: ${userId}`);
        } else {
          console.warn(`Subscription ${subscription.id} created but no userId in customer metadata`);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        // Handle subscription cancellation
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get customer to check metadata
        const customer = await stripe.customers.retrieve(customerId);
        
        if (!customer || customer.deleted) {
          console.warn(`Customer ${customerId} not found or deleted`);
          break;
        }
        
        const userId = customer.metadata?.userId;
        if (userId) {
          console.log(`Subscription ${subscription.id} cancelled for userId: ${userId}`);
        } else {
          console.warn(`Subscription ${subscription.id} cancelled but no userId in customer metadata`);
        }
        break;
      }
      
      // Add other webhook handlers as needed
    }

    return { received: true, event_type: event.type };
  } catch (error) {
    console.error('Webhook error:', error);
    throw error;
  }
}