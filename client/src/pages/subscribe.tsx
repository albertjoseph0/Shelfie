import { useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { useNavigate, useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";

export default function Subscribe() {
  const { subscription, createCheckoutSession } = useSubscription();
  const [, navigate] = useLocation();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (subscription?.status === "active") {
      navigate("/library");
    } else if (isSignedIn) {
      createCheckoutSession.mutate();
    } else {
      navigate("/");
    }
  }, [subscription, isSignedIn]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">Redirecting to checkout...</div>
    </div>
  );
}