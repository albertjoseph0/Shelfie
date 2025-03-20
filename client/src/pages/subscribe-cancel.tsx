import { useNavigate } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubscribeCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto p-4 text-center">
      <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
      <h1 className="text-3xl font-bold mb-4">Subscription Canceled</h1>
      <p className="mb-8 text-muted-foreground">
        You've canceled the subscription process. You can subscribe any time to access all features.
      </p>
      <div className="flex gap-4 justify-center">
        <Button onClick={() => navigate('/subscribe')} variant="default" size="lg">
          Try Again
        </Button>
        <Button onClick={() => navigate('/')} variant="outline" size="lg">
          Go Home
        </Button>
      </div>
    </div>
  );
}