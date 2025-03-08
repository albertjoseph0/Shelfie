import { useQuery } from "@tanstack/react-query";
import BookGrid from "@/components/book-grid";
import { Library } from "lucide-react";

export default function LibraryPage() {
  const { data: library = [] } = useQuery({
    queryKey: ["/api/library/1"],
  });

  const { data: books = [] } = useQuery({
    queryKey: ["/api/books"],
  });

  const libraryBooks = books.filter((book) =>
    library.some((entry) => entry.bookId === book.id)
  );

  const libraryBookIds = new Set(library.map((entry) => entry.bookId));

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-merriweather text-4xl font-bold">My Library</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal book collection
        </p>
      </div>

      {libraryBooks.length > 0 ? (
        <BookGrid
          books={libraryBooks}
          libraryBooks={libraryBookIds}
          onLibraryChange={() => {
            // Library query will automatically refresh
          }}
        />
      ) : (
        <div className="text-center py-12">
          <Library className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            Your library is empty. Add some books from the home page!
          </p>
        </div>
      )}
    </div>
  );
}
