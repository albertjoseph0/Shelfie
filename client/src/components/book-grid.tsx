import type { Book } from "@shared/schema";
import BookCard from "./book-card";

interface BookGridProps {
  books: Book[];
  libraryBooks?: Set<number>;
  onLibraryChange?: () => void;
}

export default function BookGrid({ books, libraryBooks, onLibraryChange }: BookGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          inLibrary={libraryBooks?.has(book.id)}
          onAddToLibrary={onLibraryChange}
          onRemoveFromLibrary={onLibraryChange}
        />
      ))}
    </div>
  );
}
