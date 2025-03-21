import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, SignIn } from "@clerk/clerk-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Check, Loader2, ShieldCheck, BookOpen, Camera, Download, Zap } from "lucide-react";

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
        variant: "destructive"
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
        description: "Please sign in to subscribe to Shelfie",
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
    <div className="container max-w-5xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Shelfie Subscription</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Access to all Shelfie features requires a subscription. Get started today to transform your physical bookshelf into a digital library.
        </p>
      </div>
      
      <Card className="border-2 border-primary shadow-lg max-w-2xl mx-auto">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">Premium Plan</CardTitle>
          <div className="text-4xl font-bold mt-2">$20<span className="text-base font-normal text-muted-foreground">/month</span></div>
          <CardDescription className="text-base mt-2">Full access to all features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Camera className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">AI Book Recognition</h3>
                  <p className="text-sm text-muted-foreground">Instantly recognize books from shelf photos</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Complete Library</h3>
                  <p className="text-sm text-muted-foreground">Catalog up to 50 books per month</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Secure Storage</h3>
                  <p className="text-sm text-muted-foreground">Your library data is protected and backed up</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Data Export</h3>
                  <p className="text-sm text-muted-foreground">Download your entire library as CSV</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Fast Performance</h3>
                  <p className="text-sm text-muted-foreground">Lightning-quick search and organization</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Cancel Anytime</h3>
                  <p className="text-sm text-muted-foreground">No long-term commitment required</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-4">
          <Button 
            className="w-full py-6 text-lg"
            size="lg" 
            onClick={handleSubscribe}
            disabled={isLoading || alreadySubscribed}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : alreadySubscribed ? (
              "Already Subscribed"
            ) : (
              "Subscribe Now"
            )}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Secure payment processed by Stripe. Cancel anytime from your account settings.
          </p>
        </CardFooter>
      </Card>
      
      <div className="mt-12 text-center">
        <h2 className="text-xl font-semibold mb-6">Customer Reviews</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-6 rounded-lg bg-card border">
            <p className="text-muted-foreground">
              "Finally, a way to digitize my collection without typing everything manually!"
            </p>
            <p className="mt-3 font-medium">Sarah K.</p>
          </div>
          <div className="p-6 rounded-lg bg-card border">
            <p className="text-muted-foreground">
              "The AI recognition is incredibly accurate. Saved me hours of work."
            </p>
            <p className="mt-3 font-medium">Michael R.</p>
          </div>
          <div className="p-6 rounded-lg bg-card border">
            <p className="text-muted-foreground">
              "Perfect for keeping track of my growing book collection."
            </p>
            <p className="mt-3 font-medium">Emily T.</p>
          </div>
        </div>
      </div>
    </div>
  );
}