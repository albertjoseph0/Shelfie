import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

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
          navigate("/subscribe");
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Non-authenticated users can see all public content
  if (!isSignedIn) {
    return children;
  }

  // We're either subscribed or already being redirected
  return isSubscribed ? children : null;
}