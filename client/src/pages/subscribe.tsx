import { useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { useNavigate } from "wouter";
import { useAuth } from "@clerk/clerk-react";

export default function Subscribe() {
  const { subscription, createCheckoutSession } = useSubscription();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (subscription?.status === "active") {
      navigate("/");
    } else if (isSignedIn) {
      createCheckoutSession.mutate();
    }
  }, [subscription, isSignedIn]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">Redirecting to checkout...</div>
    </div>
  );
}
