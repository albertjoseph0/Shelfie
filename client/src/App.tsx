import { Switch, Route } from "wouter";
import { queryClient, setAuthToken } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react';
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Library from "@/pages/library";
import SubscribePage from "@/pages/subscribe";
import Navbar from "@/components/navbar";
import SubscriptionCheck from "@/components/subscription-check";

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

// Auth + Subscription protection component
const SubscriptionProtectedRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any> }) => (
  <>
    <SignedIn>
      <SubscriptionCheck>
        <Component {...rest} />
      </SubscriptionCheck>
    </SignedIn>
    <SignedOut>
      <RedirectToSignIn />
    </SignedOut>
  </>
);

function Router() {
  return (
    <Switch>
      {/* Public landing page */}
      <Route path="/" component={Home} />
      
      {/* Subscription page - auth required but not subscription */}
      <Route path="/subscribe">
        {() => <ProtectedRoute component={SubscribePage} />}
      </Route>

      {/* Protected routes requiring subscription */}
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