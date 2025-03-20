import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/clerk-react";

export default function CheckoutSuccess() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_, setLocation] = useLocation();
  const { isSignedIn } = useAuth();
  
  // Get session_id from URL
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError("Invalid checkout session");
      setLoading(false);
      return;
    }
    
    // Verify the session with our backend
    const verifySubscription = async () => {
      try {
        // Wait a moment to ensure Stripe webhook has processed
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = await fetch('/api/subscription');
        const data = await response.json();
        
        if (data.subscribed) {
          setLoading(false);
        } else {
          // If subscription isn't active yet, retry after delay
          setTimeout(verifySubscription, 2000);
        }
      } catch (error) {
        console.error('Error verifying subscription:', error);
        setError('Could not verify subscription status. Please refresh the page.');
        setLoading(false);
      }
    };
    
    verifySubscription();
  }, [sessionId]);

  const handleGoToLibrary = () => {
    setLocation('/library');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-lg">Activating your subscription...</p>
        <p className="text-sm text-muted-foreground">This may take a moment</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-red-500 text-xl">Error: {error}</div>
        <Button asChild variant="outline">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
        <Book className="h-8 w-8 text-green-600" />
      </div>
      
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-bold tracking-tight">
          Subscription Activated!
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          Thank you for subscribing to Shelfie. You can now start digitizing your book collection.
        </p>
      </div>
      
      <div className="mt-8 space-y-4 w-full max-w-md">
        <Button 
          onClick={handleGoToLibrary} 
          className="w-full"
          size="lg"
        >
          Go to My Library
        </Button>
        
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}