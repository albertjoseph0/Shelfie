import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

/**
 * SubscriptionCheck - Direct Subscription Flow Component
 * 
 * This component implements a streamlined flow:
 * 1. Check if user has an active subscription
 * 2. If not, immediately redirect to Stripe Checkout
 * 3. On successful payment, user will be redirected back to the app
 * 
 * This component should be used for authenticated routes that
 * require a subscription.
 */
export default function SubscriptionCheck({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkAttempted, setCheckAttempted] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();
  const [location, navigate] = useLocation();

  // Don't check until Clerk is fully loaded
  useEffect(() => {
    if (!isLoaded) return;
    
    // If not signed in, we can skip subscription check
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    // Prevent checking if we're already on the subscribe page
    if (location === "/subscribe") {
      setIsLoading(false);
      return;
    }

    // Skip if we've already checked
    if (checkAttempted) return;

    const checkSubscription = async () => {
      try {
        const response = await apiRequest("GET", "/api/subscription");
        const data = await response.json();
        
        setIsSubscribed(data.isSubscribed);
        setCheckAttempted(true);
        
        if (!data.isSubscribed) {
          // Create checkout session and redirect to Stripe directly
          try {
            const checkoutResponse = await apiRequest("POST", "/api/create-checkout-session", {
              successUrl: `${window.location.origin}${location}?subscribed=true`,
              cancelUrl: `${window.location.origin}/subscribe?canceled=true`,
            });
            
            const checkoutData = await checkoutResponse.json();
            
            if (checkoutData.url) {
              // Redirect to Stripe checkout
              window.location.href = checkoutData.url;
            } else {
              // Fallback to the subscribe page if something goes wrong
              navigate("/subscribe");
            }
          } catch (error) {
            console.error("Failed to create checkout session:", error);
            navigate("/subscribe");
          }
        }
      } catch (error) {
        console.error("Failed to check subscription:", error);
        setCheckAttempted(true);
        navigate("/subscribe");
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [isSignedIn, isLoaded, navigate, location, checkAttempted]);

  // Show loader while checking
  if (isLoading && isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  // Non-authenticated users shouldn't see subscription-only content
  if (!isSignedIn) {
    return null;
  }

  // We're either subscribed or already being redirected to Stripe
  return isSubscribed ? children : null;
}