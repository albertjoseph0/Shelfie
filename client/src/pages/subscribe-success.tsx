import { useEffect } from "react";
import { useNavigate } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

export default function SubscribeSuccessPage() {
  const navigate = useNavigate();
  const sessionId = new URLSearchParams(window.location.search).get(
    "session_id",
  );

  // Invalidate subscription query to refresh status
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
  }, []);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["/api/subscription"],
  });

  // Redirect to library if we have a subscription
  useEffect(() => {
    if (!isLoading && subscription?.isSubscribed) {
      // Give time to see the success message
      const timer = setTimeout(() => {
        navigate("/library");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, subscription, navigate]);

  return (
    <div className="max-w-md mx-auto p-4 text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h1 className="text-3xl font-bold mb-4">Subscription Successful!</h1>
      <p className="mb-8 text-muted-foreground">
        Thank you for subscribing to Shelfie. You now have full access to all
        features.
      </p>
      <Button onClick={() => navigate("/library")} size="lg">
        Go to My Library
      </Button>
    </div>
  );
}
