import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Check, Loader2 } from "lucide-react";

export default function SubscribePage() {
  const [isLoading, setIsLoading] = useState(false);
  const { isSignedIn } = useAuth();
  const [, navigate] = useLocation();

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
      const response = await apiRequest("POST", "/api/create-checkout-session", {
        successUrl: `${window.location.origin}/library?subscribed=true`,
        cancelUrl: `${window.location.origin}/subscribe?canceled=true`,
      });
      
      const data = await response.json();
      
      if (data.url) {
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