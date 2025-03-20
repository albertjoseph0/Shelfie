import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useSubscription } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "wouter";
import { Camera, Zap, Shield, Download } from "lucide-react";

export default function SubscribePage() {
  const { isSignedIn } = useAuth();
  const { isSubscribed, redirectToCheckout } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn && isSubscribed) {
      navigate("/library");
    }
  }, [isSignedIn, isSubscribed, navigate]);

  const handleSubscribe = async () => {
    try {
      await redirectToCheckout();
    } catch (error) {
      console.error("Failed to redirect to checkout:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Subscribe to Shelfie
      </h1>

      <Card className="p-8">
        <div className="mb-8 text-center">
          <span className="text-4xl font-bold">$20</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <span>Catalog up to 50 books per month</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Lightning-fast book recognition</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Bank-level security for your library</span>
          </div>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <span>Download your library anytime</span>
          </div>
        </div>
        <Button size="lg" onClick={handleSubscribe} className="w-full">
          Subscribe Now
        </Button>
      </Card>
    </div>
  );
}
