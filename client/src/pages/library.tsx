import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import BookGrid from "@/components/book-grid";
import UploadDialog from "@/components/upload-dialog";
import { Book, Download, Search } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import type { Book as BookType } from "@shared/schema";

export default function LibraryPage() {
  const [books, setBooks] = useState<BookType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [location] = useLocation();
  
  // Check for subscription success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscribed = params.get("subscribed");
    
    if (subscribed === "true") {
      toast({
        title: "Subscription Active",
        description: "Your premium subscription is now active. Enjoy all the features!",
        variant: "default",
      });
      
      // Clear the URL parameter
      window.history.replaceState({}, document.title, location);
    }
  }, [location]);

  // Fetch books
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("GET", "/api/books");
        const data = await response.json();
        setBooks(data);
      } catch (error) {
        console.error("Failed to fetch books:", error);
        toast({
          title: "Error",
          description: "Failed to load your library. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If search is empty, fetch all books
      const response = await apiRequest("GET", "/api/books");
      const data = await response.json();
      setBooks(data);
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest("GET", `/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error("Search failed:", error);
      toast({
        title: "Search Error",
        description: "Failed to search your library. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = (newBooks: BookType[]) => {
    setBooks((prevBooks) => [...newBooks, ...prevBooks]);
    setIsUploadDialogOpen(false);
  };

  const handleExport = async () => {
    try {
      // First, create a URL to the export endpoint
      const exportUrl = "/api/export";
      
      // Use a direct window location approach for download
      const anchor = document.createElement('a');
      anchor.href = exportUrl;
      anchor.download = "my-library.csv";
      anchor.click();
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Error",
        description: "Failed to export your library. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">My Library</h1>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button onClick={() => setIsUploadDialogOpen(true)} className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            <span>Add Books</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-64 bg-muted rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : books.length > 0 ? (
        <BookGrid books={books} />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Book className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium">Your library is empty</h3>
          <p className="text-muted-foreground mt-2 mb-6">
            Start by adding books to your collection
          </p>
          <Button onClick={() => setIsUploadDialogOpen(true)}>Add Books</Button>
        </div>
      )}

      <UploadDialog 
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}