import { Link } from "wouter";
import { Book } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
} from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/lib/subscription";

export default function Navbar() {
  const { isSubscribed } = useSubscription();

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Button
                variant="ghost"
                className="flex items-center space-x-2 px-0"
              >
                <Book className="h-5 w-5 text-primary" />
                <span className="text-lg font-medium">Shelfie</span>
              </Button>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <SignedIn>
              {isSubscribed ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  Subscribed
                </Badge>
              ) : (
                <Link href="/subscribe">
                  <Button variant="outline" size="sm">
                    Subscribe
                  </Button>
                </Link>
              )}
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="default" size="sm">
                  Login
                </Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </nav>
  );
}
