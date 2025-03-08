const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY || "";
const API_BASE = "https://www.googleapis.com/books/v1";

export interface GoogleBookResult {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail: string;
    };
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    publishedDate?: string;
    publisher?: string;
  };
}

export async function searchBook(query: string): Promise<GoogleBookResult[]> {
  const params = new URLSearchParams({
    q: query,
    key: GOOGLE_BOOKS_API_KEY,
    maxResults: "5"
  });

  const response = await fetch(`${API_BASE}/volumes?${params}`);
  
  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
}

export async function getBookById(id: string): Promise<GoogleBookResult> {
  const params = new URLSearchParams({ key: GOOGLE_BOOKS_API_KEY });
  const response = await fetch(`${API_BASE}/volumes/${id}?${params}`);
  
  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.statusText}`);
  }

  return response.json();
}
