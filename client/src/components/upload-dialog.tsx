import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UploadDialogProps {
  onSuccess: (books: any[]) => void;
}

export default function UploadDialog({ onSuccess }: UploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const imageData = base64.split(",")[1];
      const response = await apiRequest("POST", "/api/analyze", { image: imageData });
      const data = await response.json();

      onSuccess(data.books);
      setIsOpen(false);
      toast({
        title: "Success",
        description: `Identified ${data.books.length} books from your shelf`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze image",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Upload className="h-5 w-5" />
          Upload Shelf Photo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a photo of your bookshelf</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <div className="w-full h-32 border-2 border-dashed rounded-lg flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </span>
              </label>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
