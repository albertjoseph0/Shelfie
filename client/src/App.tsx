import { Switch, Route, useLocation } from "wouter";
import { queryClient, setAuthToken, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Library from "@/pages/library";
import SubscribePage from "@/pages/subscribe";
import Navbar from "@/components/navbar";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Direct Authentication + Subscription Check
// This component will handle the entire flow: 
// 1. Check if user is signed in
// 2. If signed in, check subscription status
// 3. If not subscribed, redirect to Stripe checkout
const SubscriptionRequired = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    // Wait for auth to load
    if (!isLoaded) return;

    // If not signed in, the SignedIn/SignedOut components will handle it
    if (!isSignedIn) {
      setIsChecking(false);
      return;
    }

    // Check subscription status
    const checkSubscription = async () => {
      try {
        const response = await apiRequest("GET", "/api/subscription");
        const data = await response.json();
        
        setIsSubscribed(data.isSubscribed);
        
        // If not subscribed, redirect to subscription flow
        if (!data.isSubscribed) {
          // Create checkout session and redirect to Stripe
          try {
            const checkoutResponse = await apiRequest("POST", "/api/create-checkout-session", {
              successUrl: `${window.location.origin}/library?subscribed=true`,
              cancelUrl: `${window.location.origin}/subscribe?canceled=true`,
            });
            
            const checkoutData = await checkoutResponse.json();
            
            if (checkoutData.url) {
              // Redirect to Stripe checkout
              window.location.href = checkoutData.url;
            } else {
              // If no URL, redirect to subscribe page
              navigate("/subscribe");
            }
          } catch (error) {
            console.error("Failed to create checkout session:", error);
            navigate("/subscribe");
          }
        }
      } catch (error) {
        console.error("Failed to check subscription:", error);
        navigate("/subscribe");
      } finally {
        setIsChecking(false);
      }
    };

    checkSubscription();
  }, [isSignedIn, isLoaded, navigate]);

  // Show loading while checking auth/subscription
  if (isChecking && isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg">Preparing your library...</p>
        </div>
      </div>
    );
  }

  // Not signed in users get the public content
  if (!isSignedIn) {
    return null; // SignedIn/SignedOut will handle this
  }

  // Only return children if subscribed
  return isSubscribed ? children : null;
};

// Auth protection component
const ProtectedRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any> }) => (
  <>
    <SignedIn>
      <Component {...rest} />
    </SignedIn>
    <SignedOut>
      <RedirectToSignIn />
    </SignedOut>
  </>
);

// Auth + Subscription protection component with direct checkout
const SubscriptionProtectedRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any> }) => (
  <>
    <SignedIn>
      <SubscriptionRequired>
        <Component {...rest} />
      </SubscriptionRequired>
    </SignedIn>
    <SignedOut>
      <RedirectToSignIn />
    </SignedOut>
  </>
);

function Router() {
  const [location] = useLocation();
  
  // Check for subscription success/cancel URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    
    if (searchParams.get('subscribed') === 'true') {
      toast({
        title: "Subscription active!",
        description: "Your premium subscription is now active. Enjoy all features!",
      });
    } 
    
    if (searchParams.get('canceled') === 'true') {
      toast({
        title: "Subscription canceled",
        description: "Your subscription process was canceled. You can try again whenever you're ready.",
      });
    }
  }, [location]);
  
  return (
    <Switch>
      {/* Public landing page */}
      <Route path="/" component={Home} />
      
      {/* Subscription page still exists as fallback */}
      <Route path="/subscribe">
        {() => <ProtectedRoute component={SubscribePage} />}
      </Route>

      {/* Protected routes requiring subscription with direct checkout flow */}
      <Route path="/library">
        {() => <SubscriptionProtectedRoute component={Library} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

// Authentication wrapper to manage tokens
function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, getToken } = useAuth();
  
  useEffect(() => {
    async function setupAuth() {
      if (isSignedIn) {
        try {
          // Get the session token and set it for API requests
          const token = await getToken();
          setAuthToken(token);
        } catch (error) {
          console.error("Failed to get auth token:", error);
          setAuthToken(null);
        }
      } else {
        setAuthToken(null);
      }
    }
    
    setupAuth();
    
    // Listen for session changes
    const intervalId = setInterval(setupAuth, 5 * 60 * 1000); // Refresh token every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [isSignedIn, getToken]);
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Router />
          </main>
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;