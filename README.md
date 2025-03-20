# 📚 Shelfie - Smart Book Cataloging App

Shelfie is a modern web application that makes cataloging your physical book collection effortless using AI-powered image recognition. Simply take a photo of your bookshelf, and let Shelfie do the rest!

## ✨ Features

- **AI-Powered Book Detection**: Upload photos of your bookshelves and let our AI identify your books
- **Google Books Integration**: Automatically fetch detailed book information and cover images
- **Secure Authentication**: User-specific libraries with Clerk authentication
- **Smart Organization**: Books are automatically sorted by addition date
- **Export Capability**: Download your entire library as a CSV file with comprehensive book details
- **Undo Support**: Easily undo recent shelf uploads if mistakes occur
- **Individual Book Management**: Remove specific books from your library as needed

## 🚀 Technology Stack

- **Frontend**: React with TypeScript
- **UI Components**: shadcn/ui + Tailwind CSS
- **Authentication**: Clerk
- **API Integration**: Google Books API
- **Image Analysis**: OpenAI GPT-4 Vision
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack Query

## 🛠️ Setup

### Prerequisites

1. Node.js 18+ installed
2. PostgreSQL database
3. API Keys:
   - Clerk (Authentication)
   - OpenAI (Image Analysis)
   - Google Books API

### Environment Variables

Create a `.env` file with the following:

```env
# Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key

# APIs
OPENAI_API_KEY=your_openai_key
GOOGLE_BOOKS_API_KEY=your_google_books_key

# Database
DATABASE_URL=your_postgresql_url
```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`.

## 📱 Usage

1. **Sign Up/Sign In**
   - Click the "Sign In" button in the navigation bar
   - Create an account or sign in using Clerk's authentication

2. **Adding Books**
   - Click "Upload Shelf Photo" on the home page
   - Select or drag & drop a photo of your bookshelf
   - Wait for the AI to analyze and identify your books
   - Books will automatically appear in your library

3. **Managing Your Library**
   - View all your books on the home page
   - Click any book to see detailed information
   - Use the search bar to find specific books
   - Click the delete button on any book to remove it
   - Use "Undo Last Upload" to reverse your most recent shelf addition

4. **Exporting Your Library**
   - Click "Export Library" to download a CSV file
   - The export includes comprehensive book details including:
     - Title and Author
     - ISBN
     - Publisher and Publication Date
     - Categories
     - Page Count
     - Description
     - Date Added to Library

## 🔒 Security

- All user data is private and secured through Clerk authentication
- Each user can only access and modify their own library
- API endpoints are protected and require authentication
- Book data is associated with specific user accounts

## 📝 Notes

- Supported image formats: JPG, PNG
- Maximum image size: 50MB
- Books are ordered by date added (newest first)
- The application requires an active internet connection for AI analysis and book information retrieval
