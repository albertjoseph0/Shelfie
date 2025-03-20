import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import PaymentRequired from "@/pages/payment-required";
import Navbar from "@/components/navbar";
import { useSubscription } from "@/hooks/use-subscription";

// Auth and subscription protection component
const ProtectedRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any> }) => {
  const { data: subscription, isLoading } = useSubscription();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <SignedIn>
        {subscription?.subscribed ? (
          <Component {...rest} />
        ) : (
          <PaymentRequired />
        )}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

function Router() {
  return (
    <Switch>
      {/* Public landing page */}
      <Route path="/" component={Home} />

      {/* Protected routes requiring subscription */}
      <Route path="/library">
        {() => <ProtectedRoute component={Home} />}
      </Route>

      {/* Payment success page */}
      <Route path="/payment-success">
        {() => <Home />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Router />
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;