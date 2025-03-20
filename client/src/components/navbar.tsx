import { Link } from "wouter";
import { Book } from "lucide-react";
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <Book className="h-5 w-5 text-primary" />
              <span className="text-lg font-medium">Shelfie</span>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal" afterSignInUrl="/subscribe">
                <Button variant="default" size="sm">Login</Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </nav>
  );
}