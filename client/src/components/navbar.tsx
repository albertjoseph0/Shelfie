import { useState } from "react";
import { Link } from "wouter";
import { Book } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleStartCataloging = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      setIsLoading(false);
    }
  };
  
  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Button variant="ghost" className="flex items-center space-x-2 px-0">
                <Book className="h-5 w-5 text-primary" />
                <span className="text-lg font-medium">Shelfie</span>
              </Button>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <SignedOut>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleStartCataloging}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Login"}
              </Button>
            </SignedOut>
          </div>
        </div>
      </div>
    </nav>
  );
}