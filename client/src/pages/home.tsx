import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SignedIn, SignedOut, useAuth, SignInButton } from '@clerk/clerk-react';
import UploadDialog from "@/components/upload-dialog";
import BookGrid from "@/components/book-grid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Book, Download, Camera, CheckCircle, BookOpenCheck } from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const { isSignedIn } = useAuth();

  const { data: books = [] } = useQuery({
    queryKey: ["/api/books"],
    enabled: isSignedIn
  });

  const filteredBooks = searchQuery
    ? books.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : books;

  const handleExport = () => {
    window.location.href = '/api/export';
  };

  return (
    <div className="space-y-12 py-8">
      <SignedOut>
        <div className="max-w-6xl mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold tracking-tight max-w-3xl mx-auto">
              Turn Your Physical Bookshelf into a Digital Library in Seconds
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simply snap a photo of your bookshelf and watch as AI identifies and catalogs your entire collection. No more manual entry, no more hassle.
            </p>
            <div className="pt-4">
              <SignInButton mode="modal" afterSignInUrl="/subscribe">
                <Button size="lg" className="text-lg px-8">
                  Start Cataloging
                </Button>
              </SignInButton>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 py-16">
            <div className="text-center space-y-3">
              <Camera className="h-8 w-8 mx-auto text-primary" />
              <h3 className="text-lg font-semibold">Snap a Photo</h3>
              <p className="text-muted-foreground">
                Take a single photo of your bookshelf and let our AI do the rest
              </p>
            </div>
            <div className="text-center space-y-3">
              <BookOpenCheck className="h-8 w-8 mx-auto text-primary" />
              <h3 className="text-lg font-semibold">Instant Recognition</h3>
              <p className="text-muted-foreground">
                Advanced AI identifies titles, authors, and book details automatically
              </p>
            </div>
            <div className="text-center space-y-3">
              <CheckCircle className="h-8 w-8 mx-auto text-primary" />
              <h3 className="text-lg font-semibold">Complete Library</h3>
              <p className="text-muted-foreground">
                Get a fully organized digital catalog of your book collection
              </p>
            </div>
          </div>

          {/* Demo Video Placeholder */}
          <div className="rounded-lg bg-card border aspect-video flex items-center justify-center">
            <div className="text-center space-y-3">
              <Book className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Demo video coming soon</p>
            </div>
          </div>

          {/* Trust Section */}
          <div className="text-center py-16 space-y-6">
            <h2 className="text-2xl font-semibold">Trusted by Book Lovers</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg bg-card border">
                <p className="text-muted-foreground">
                  "Finally, a way to digitize my collection without typing everything manually!"
                </p>
                <p className="mt-2 font-medium">Sarah K.</p>
              </div>
              <div className="p-6 rounded-lg bg-card border">
                <p className="text-muted-foreground">
                  "The AI recognition is incredibly accurate. Saved me hours of work."
                </p>
                <p className="mt-2 font-medium">Michael R.</p>
              </div>
              <div className="p-6 rounded-lg bg-card border">
                <p className="text-muted-foreground">
                  "Perfect for keeping track of my growing book collection."
                </p>
                <p className="mt-2 font-medium">Emily T.</p>
              </div>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">
              Your Digital Library
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Manage your book collection with ease. Upload photos of your bookshelves or search through your existing catalog.
            </p>
            <div className="flex justify-center gap-4">
              <UploadDialog
                onSuccess={() => {
                  // Query will automatically refresh
                }}
              />
              {books.length > 0 && (
                <Button variant="outline" onClick={handleExport} size="lg" className="gap-2">
                  <Download className="h-5 w-5" />
                  Export Library
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 max-w-md mx-auto">
            <Input
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredBooks.length > 0 ? (
            <BookGrid books={filteredBooks} />
          ) : (
            <div className="text-center py-12">
              <Book className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                No books found. Try uploading a shelf photo!
              </p>
            </div>
          )}
        </div>
      </SignedIn>
    </div>
  );
}