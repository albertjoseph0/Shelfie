import { z } from "zod";

// Book schema definition
export const bookSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  isbn: z.string().nullable(),
  coverUrl: z.string().nullable(),
  description: z.string().nullable(),
  pageCount: z.number().nullable(),
  googleBooksId: z.string().nullable(),
  createdAt: z.string(),
  metadata: z.object({
    categories: z.array(z.string()).optional(),
    publishedDate: z.string().optional(),
    publisher: z.string().optional(),
  }).nullable(),
});

export const insertBookSchema = bookSchema.omit({ 
  id: true 
});

export type Book = z.infer<typeof bookSchema>;
export type InsertBook = z.infer<typeof insertBookSchema>;