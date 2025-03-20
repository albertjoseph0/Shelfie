import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiRequest } from "./queryClient";
import { useQuery } from "@tanstack/react-query";

type SubscriptionContextType = {
  isSubscribed: boolean;
  isLoading: boolean;
  redirectToCheckout: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, isLoaded, getToken, user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/subscription"],
    enabled: isSignedIn && isLoaded,
  });

  const isSubscribed = data?.isSubscribed || false;

  const redirectToCheckout = async () => {
    if (!isSignedIn || !user?.primaryEmailAddress?.emailAddress) {
      throw new Error("User must be signed in to checkout");
    }

    try {
      const response = await apiRequest(
        "POST",
        "/api/create-checkout-session",
        {
          email: user.primaryEmailAddress.emailAddress,
        },
      );
      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error redirecting to checkout:", error);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{ isSubscribed, isLoading, redirectToCheckout }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
}
