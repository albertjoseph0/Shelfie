import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Navbar from "@/components/navbar";
import { SignIn, SignedIn, SignedOut } from "@clerk/clerk-react"; // Added Clerk components

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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
          <SignedIn>
            <Router /> {/* Routes are now within SignedIn component */}
          </SignedIn>
          <SignedOut>
            <div className="flex justify-center items-center min-h-[60vh]">
              <SignIn />
            </div>
          </SignedOut>
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;