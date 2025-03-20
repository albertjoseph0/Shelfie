import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Navbar from "@/components/navbar";
import { ClerkProvider } from "@clerk/clerk-react";
import ProtectedRoute from "@/components/protected-route";

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Router />
          </main>
        </div>
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;