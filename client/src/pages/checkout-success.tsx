import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClerk } from "@clerk/clerk-react";

export default function CheckoutSuccess() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_, setLocation] = useLocation();
  const { openSignUp } = useClerk();
  
  // Get session_id from URL
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError("Invalid checkout session");
      setLoading(false);
      return;
    }
    
    // You could verify the session with your backend here
    // For now, we'll just simulate a successful verification
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [sessionId]);

  const handleContinue = () => {
    // Open Clerk signup modal
    openSignUp();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-lg">Verifying your payment...</p>
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
          Payment Successful!
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          Thank you for subscribing to Shelfie. You're just one step away from digitizing your book collection.
        </p>
      </div>
      
      <div className="mt-8 space-y-4 w-full max-w-md">
        <Button 
          onClick={handleContinue} 
          className="w-full"
          size="lg"
        >
          Create Your Account
        </Button>
        
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}