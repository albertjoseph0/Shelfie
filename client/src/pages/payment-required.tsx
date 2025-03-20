import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentRequired() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubscribe = async () => {
    try {
      const response = await apiRequest("POST", "/api/create-checkout-session", {
        email: user?.primaryEmailAddress?.emailAddress,
      });
      const data = await response.json();

      if (!data.url) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center space-y-6 p-6">
        <h1 className="text-3xl font-bold">Subscribe to Shelfie</h1>
        <p className="text-muted-foreground">
          Get full access to AI-powered book cataloging and manage your entire collection.
        </p>

        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="text-4xl font-bold">$20/month</div>
          <ul className="space-y-2 text-left">
            <li className="flex items-center gap-2">
              ✓ AI book recognition
            </li>
            <li className="flex items-center gap-2">
              ✓ Unlimited shelf uploads
            </li>
            <li className="flex items-center gap-2">
              ✓ Export to CSV
            </li>
            <li className="flex items-center gap-2">
              ✓ Full library management
            </li>
          </ul>
          <Button onClick={handleSubscribe} size="lg" className="w-full">
            Subscribe Now
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Secure payment powered by Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
}