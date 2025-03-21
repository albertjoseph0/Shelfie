import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, SignIn } from "@clerk/clerk-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Check, Loader2 } from "lucide-react";

export default function SubscribePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();
  const [location, navigate] = useLocation();

  // Check subscription status on load
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setIsCheckingSubscription(false);
      return;
    }

    // Check for query parameters
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('subscribed') === 'true') {
      toast({
        title: "Subscription active!",
        description: "Your premium subscription is now active. Enjoy all features!",
      });
      
      // Redirect back to library after showing the toast
      setTimeout(() => {
        navigate("/library");
      }, 1500);
      return;
    }
    
    if (searchParams.get('canceled') === 'true') {
      toast({
        title: "Subscription canceled",
        description: "Your subscription process was canceled. You can try again whenever you're ready.",
      });
    }

    // Check if already subscribed
    const checkSubscription = async () => {
      try {
        const response = await apiRequest("GET", "/api/subscription");
        const data = await response.json();
        
        if (data.isSubscribed) {
          setAlreadySubscribed(true);
          toast({
            title: "Already subscribed",
            description: "You already have an active subscription!",
          });
          // Redirect to library after a short delay
          setTimeout(() => {
            navigate("/library");
          }, 1500);
        }
      } catch (error) {
        console.error("Failed to check subscription:", error);
      } finally {
        setIsCheckingSubscription(false);
      }
    };

    checkSubscription();
  }, [isSignedIn, isLoaded, navigate, location]);

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe to Shelfie Premium",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Include window.location.origin to ensure proper redirect URLs
      const response = await apiRequest("POST", "/api/create-checkout-session", {
        successUrl: `${window.location.origin}/library?subscribed=true`,
        cancelUrl: `${window.location.origin}/subscribe?canceled=true`,
      });
      
      const data = await response.json();
      
      if (data.url) {
        // Use window.location.href for a full page navigation to Stripe
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      toast({
        title: "Subscription error",
        description: "Unable to initiate checkout. Please try again later.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-8">Upgrade to Shelfie Premium</h1>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle>Free Plan</CardTitle>
            <div className="text-3xl font-bold">$0</div>
            <CardDescription>Limited features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-2 text-gray-400" />
                <span>Browse sample books</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-2 text-gray-400" />
                <span>Preview library features</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-2 text-gray-400" />
                <span>Limited to 5 books</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-2 border-primary shadow-lg">
          <CardHeader>
            <CardTitle>Premium Plan</CardTitle>
            <div className="text-3xl font-bold">$20<span className="text-sm font-normal">/month</span></div>
            <CardDescription>Full access to all features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-2 text-primary" />
                <span>Unlimited book catalog</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-2 text-primary" />
                <span>AI-powered bookshelf scanning</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-2 text-primary" />
                <span>Export your library to CSV</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-2 text-primary" />
                <span>Detailed book information</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-2 text-primary" />
                <span>Add up to 50 books per month</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleSubscribe}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Subscribe Now"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}