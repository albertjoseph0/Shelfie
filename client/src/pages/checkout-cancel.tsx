import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutCancel() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-bold tracking-tight">
          Payment Cancelled
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          Your payment process was cancelled. No charges were made.
        </p>
      </div>
      
      <div className="mt-8 space-y-4 w-full max-w-md">
        <Button asChild className="w-full">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}