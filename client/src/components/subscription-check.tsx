import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

export default function SubscriptionCheck({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { isSignedIn } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    const checkSubscription = async () => {
      try {
        const response = await apiRequest("GET", "/api/subscription");
        const data = await response.json();
        setIsSubscribed(data.isSubscribed);
        
        if (!data.isSubscribed) {
          navigate("/subscribe");
        }
      } catch (error) {
        console.error("Failed to check subscription:", error);
        navigate("/subscribe");
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [isSignedIn, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return children; // Allow non-authenticated users to see the landing page
  }

  if (!isSubscribed) {
    return null; // Will redirect to subscribe page
  }

  return children;
}