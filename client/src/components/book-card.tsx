import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Book as BookIcon, Calendar, Building2, Hash } from "lucide-react";
import type { Book } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const { data: details, isLoading } = useQuery({
    queryKey: [`/api/books/${book.id}/details`],
    enabled: showDetails,
  });

  return (
    <>
      <Card 
        className="h-full cursor-pointer transition-transform hover:scale-105"
        onClick={() => setShowDetails(true)}
      >
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
          <p className="text-sm line-clamp-3">{book.description}</p>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{book.title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex gap-4">
              <img
                src={book.coverUrl || "https://via.placeholder.com/200x300"}
                alt={book.title}
                className="w-32 h-48 object-cover rounded-lg"
              />
              <div>
                <h4 className="font-semibold mb-2">{book.author}</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {book.metadata?.publisher && (
                    <p className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {book.metadata.publisher}
                    </p>
                  )}
                  {book.metadata?.publishedDate && (
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {book.metadata.publishedDate}
                    </p>
                  )}
                  {book.isbn && (
                    <p className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      ISBN: {book.isbn}
                    </p>
                  )}
                  {book.pageCount && (
                    <p className="flex items-center gap-2">
                      <BookIcon className="h-4 w-4" />
                      {book.pageCount} pages
                    </p>
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm">{book.description}</p>
            {book.metadata?.categories && (
              <div className="flex gap-2 flex-wrap">
                {book.metadata.categories.map((category) => (
                  <span
                    key={category}
                    className="px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}