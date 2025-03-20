# Shelfie - AI-Powered Book Cataloging

Shelfie is a sophisticated book cataloging web application that uses AI to help you digitize your physical book collection. Simply take a photo of your bookshelf, and let the application identify and catalog your books automatically.

## Features

- **AI-Powered Book Detection**: Upload photos of your bookshelves and let AI identify your books
- **Secure Authentication**: User accounts and protected libraries using Clerk
- **Google Books Integration**: Detailed book information fetched from Google Books API
- **Library Management**:
  - View your entire book collection
  - Delete individual books
  - Undo recent shelf uploads
  - Export your library to CSV
- **Rich Book Details**: View comprehensive information including:
  - Cover images
  - Publication details
  - Page counts
  - Categories
  - ISBN numbers

## Technology Stack

- **Frontend**: React with TypeScript
- **Backend**: Express.js
- **Authentication**: Clerk
- **AI Integration**: OpenAI GPT-4 Vision
- **Book Data**: Google Books API
- **Styling**: Tailwind CSS with shadcn/ui components

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables in `.env`:
```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
OPENAI_API_KEY=your_openai_key
GOOGLE_BOOKS_API_KEY=your_google_books_key
```

4. Start the development server:
```bash
npm run dev
```

## Authentication

The application uses Clerk for authentication, providing:
- Secure user accounts
- Protected book libraries
- User-specific data isolation
- Social login options

## Usage

1. **Sign Up/Sign In**:
   - Click the "Sign In" button in the navigation bar
   - Create an account or sign in using Clerk's authentication modal

2. **Adding Books**:
   - Click "Upload Shelf Photo"
   - Select or drag & drop a photo of your bookshelf
   - Wait for AI to analyze and identify books
   - Books will be automatically added to your library

3. **Managing Your Library**:
   - View all books on the home page
   - Click any book to view detailed information
   - Use the search bar to find specific books
   - Delete individual books using the trash icon
   - Undo recent uploads with the "Undo Last Upload" button
   - Export your library to CSV using the "Export Library" button

## Development

- Built using Vite + React
- Type-safe implementation with TypeScript
- Modular component architecture
- Real-time updates using React Query
- Responsive design with Tailwind CSS

## Security

- All routes are protected with authentication
- User data is isolated per account
- Books are only accessible to their owners
- Secure API key handling through environment variables

## Data Privacy

- Book data is private to each user
- Authentication tokens handled securely by Clerk
- No sharing or public access to personal libraries
