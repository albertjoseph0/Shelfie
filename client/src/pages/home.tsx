import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import UploadDialog from "@/components/upload-dialog";
import BookGrid from "@/components/book-grid";
import { Input } from "@/components/ui/input";
import { Book } from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: books = [] } = useQuery({
    queryKey: ["/api/books"],
  });

  const { data: library = [] } = useQuery({
    queryKey: ["/api/library/1"],
  });

  const libraryBookIds = new Set(library.map((entry) => entry.bookId));

  const filteredBooks = searchQuery
    ? books.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : books;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="font-merriweather text-4xl font-bold">
          Welcome to Shelfie
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Catalog your physical book collection with ease. Simply upload a photo of
          your bookshelf and let AI do the work for you.
        </p>
        <UploadDialog
          onSuccess={() => {
            // Query will automatically refresh
          }}
        />
      </div>

      <div className="flex items-center gap-4 max-w-md mx-auto">
        <Input
          placeholder="Search books..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredBooks.length > 0 ? (
        <BookGrid
          books={filteredBooks}
          libraryBooks={libraryBookIds}
          onLibraryChange={() => {
            // Library query will automatically refresh
          }}
        />
      ) : (
        <div className="text-center py-12">
          <Book className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            No books found. Try uploading a shelf photo!
          </p>
        </div>
      )}
    </div>
  );
}
