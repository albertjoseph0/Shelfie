import { Link } from "wouter";
import { Book } from "lucide-react";
import { UserButton } from '@clerk/nextjs'; // Assuming you are using Clerk Next.js

export default function Navbar() {
  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/">
            <a className="flex items-center space-x-2">
              <Book className="h-6 w-6 text-primary" />
              <span className="font-merriweather text-xl font-bold">Shelfie</span>
            </a>
          </Link>
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </nav>
  );
}