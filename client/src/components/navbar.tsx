import { Link, useLocation } from "wouter";
import { Book, CreditCard } from "lucide-react";
import { SignedIn, SignedOut, UserButton, SignInButton, useAuth } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function Navbar() {
  const [location] = useLocation();
  const { isSignedIn } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only check subscription status if user is signed in
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    const checkSubscription = async () => {
      try {
        const response = await apiRequest("GET", "/api/subscription");
        const data = await response.json();
        setIsSubscribed(data.isSubscribed);
      } catch (error) {
        console.error("Failed to check subscription:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [isSignedIn]);

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/">
              <Button variant="ghost" className="flex items-center space-x-2 px-0">
                <Book className="h-5 w-5 text-primary" />
                <span className="text-lg font-medium">Shelfie</span>
              </Button>
            </Link>
            
            <SignedIn>
              <div className="hidden md:flex space-x-4">
                <Link href="/library">
                  <Button variant={location === "/library" ? "default" : "ghost"} size="sm">
                    My Library
                  </Button>
                </Link>
              </div>
            </SignedIn>
          </div>

          <div className="flex items-center space-x-4">
            <SignedIn>
              {!isLoading && !isSubscribed && (
                <Link href="/subscribe">
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Upgrade</span>
                  </Button>
                </Link>
              )}
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="default" size="sm">Login</Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </nav>
  );
}