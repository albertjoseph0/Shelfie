import { Link } from "wouter";
import { Book } from "lucide-react";

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
          <div className="flex space-x-4">
            <Link href="/">
              <a className="text-foreground hover:text-primary">Home</a>
            </Link>
            <Link href="/library">
              <a className="text-foreground hover:text-primary">My Library</a>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
