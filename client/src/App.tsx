import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CheckoutSuccess from "@/pages/checkout-success";
import CheckoutCancel from "@/pages/checkout-cancel";
import Navbar from "@/components/navbar";

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

function Router() {
  return (
    <Switch>
      {/* Public landing page */}
      <Route path="/" component={Home} />

      {/* Checkout routes */}
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/checkout/cancel" component={CheckoutCancel} />

      {/* Protected routes */}
      <Route path="/library">
        {() => <ProtectedRoute component={Home} />}
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