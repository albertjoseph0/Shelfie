import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@clerk/clerk-react";

export function useSubscription() {
  const { isSignedIn } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["/api/subscription/status"],
    enabled: isSignedIn,
  });

  const createCheckoutSession = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/create-checkout-session");
      const data = await response.json();
      window.location.href = data.url;
    },
  });

  return {
    subscription,
    isLoading,
    createCheckoutSession,
  };
}
