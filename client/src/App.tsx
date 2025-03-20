import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Navbar from "@/components/navbar";
import SubscribePage from "@/pages/subscribe";
import SubscribeSuccessPage from "@/pages/subscribe-success";
import SubscribeCancelPage from "@/pages/subscribe-cancel";
import { RequireSubscription } from "@/components/subscription-check";

// Auth protection component
const ProtectedRoute = ({
  component: Component,
  ...rest
}: {
  component: React.ComponentType<any>;
}) => (
  <>
    <SignedIn>
      <Component {...rest} />
    </SignedIn>
    <SignedOut>
      <RedirectToSignIn />
    </SignedOut>
  </>
);

// Subscription protection component
const SubscriptionProtectedRoute = ({
  component: Component,
  ...rest
}: {
  component: React.ComponentType<any>;
}) => (
  <ProtectedRoute
    component={(props: any) => (
      <RequireSubscription>
        <Component {...props} {...rest} />
      </RequireSubscription>
    )}
  />
);

function Router() {
  return (
    <Switch>
      {/* Public landing page */}
      <Route path="/" component={Home} />

      {/* Subscription pages */}
      <Route
        path="/subscribe"
        component={() => <ProtectedRoute component={SubscribePage} />}
      />
      <Route
        path="/subscribe-success"
        component={() => <ProtectedRoute component={SubscribeSuccessPage} />}
      />
      <Route
        path="/subscribe-cancel"
        component={() => <ProtectedRoute component={SubscribeCancelPage} />}
      />

      {/* Protected routes that need subscription */}
      <Route path="/library">
        {() => <SubscriptionProtectedRoute component={Home} />}
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
