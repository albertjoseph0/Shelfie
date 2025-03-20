import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";

export function useSubscription() {
  const { isSignedIn } = useAuth();
  const { toast } = useToast();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["/api/subscription/status"],
    enabled: isSignedIn,
  });

  const createCheckoutSession = useMutation({
    mutationFn: async () => {
      try {
        const response = await apiRequest("POST", "/api/stripe/create-checkout-session");
        const data = await response.json();

        if (!data.url) {
          throw new Error("No checkout URL received");
        }

        window.location.href = data.url;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to start checkout process. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  return {
    subscription,
    isLoading,
    createCheckoutSession,
  };
}