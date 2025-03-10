import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import type { Book } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface BookCardProps {
  book: Book;
  inLibrary?: boolean;
  onAddToLibrary?: () => void;
  onRemoveFromLibrary?: () => void;
}

export default function BookCard({
  book,
  inLibrary,
  onAddToLibrary,
  onRemoveFromLibrary
}: BookCardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToLibrary = async () => {
    try {
      setIsLoading(true);
      await apiRequest("POST", "/api/library", {
        userId: 1, // Hardcoded for demo
        bookId: book.id,
        addedAt: new Date().toISOString()
      });

      // Invalidate library query to trigger a refresh
      await queryClient.invalidateQueries({ queryKey: ["/api/library/1"] });

      onAddToLibrary?.();
      toast({
        title: "Success",
        description: "Book added to your library"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add book to library",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromLibrary = async () => {
    try {
      setIsLoading(true);
      await apiRequest("DELETE", `/api/library/1/${book.id}`);

      // Invalidate library query to trigger a refresh
      await queryClient.invalidateQueries({ queryKey: ["/api/library/1"] });

      onRemoveFromLibrary?.();
      toast({
        title: "Success",
        description: "Book removed from your library"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove book from library",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="p-0">
        <img
          src={book.coverUrl || "https://via.placeholder.com/200x300"}
          alt={book.title}
          className="h-48 w-full object-cover rounded-t-lg"
        />
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-merriweather text-lg font-semibold line-clamp-2">
          {book.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
        <p className="text-sm line-clamp-3 mb-4">{book.description}</p>
        <Button
          variant={inLibrary ? "destructive" : "default"}
          size="sm"
          className="w-full"
          onClick={inLibrary ? handleRemoveFromLibrary : handleAddToLibrary}
          disabled={isLoading}
        >
          {inLibrary ? (
            <>
              <Trash className="h-4 w-4 mr-2" />
              Remove
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add to Library
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}