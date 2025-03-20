# Shelfie - AI Book Cataloging App

Shelfie is a modern web application that allows users to easily catalog their physical book collection. Simply upload a photo of your bookshelf, and Shelfie's AI vision system will identify the books and create a digital library for you.

## Features

- **AI-Powered Book Detection**: Upload a photo of your bookshelf, and the AI will identify book titles and authors
- **Book Information Enrichment**: Integration with Google Books API to get detailed information, cover images, and metadata
- **Search and Filter**: Easily search your book collection
- **Export**: Download your library as a CSV file for use in other applications
- **Modern UI**: Clean, responsive design built with React and Tailwind CSS

## Technology Stack

### Frontend
- **React**: UI library 
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality, customizable UI components
- **React Query**: Data fetching and state management
- **Wouter**: Lightweight routing

### Backend
- **Express**: Node.js web application framework
- **OpenAI API**: Powers the AI vision capabilities (GPT-4o)
- **Google Books API**: Book data enrichment
- **In-memory storage**: For demo purposes (can be extended to use a database)

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- OpenAI API key
- Google Books API key (optional)

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```
OPENAI_API_KEY=your_openai_api_key
GOOGLE_BOOKS_API_KEY=your_google_books_api_key
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shelfie.git
cd shelfie
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5000`

## Usage Guide

### Adding Books to Your Library

1. **Upload a Shelf Photo**: Click the "Upload Shelf Photo" button on the homepage
2. **Select an Image**: Choose a clear image of your bookshelf where book spines are visible
3. **AI Analysis**: The app will analyze the image and identify books
4. **Review Results**: Books will be added to your library with enriched information from Google Books

### Managing Your Library

- **Search**: Use the search field to find books by title or author
- **View Details**: Click on any book card to see detailed information
- **Remove Books**: Hover over a book card and click the trash icon to remove it
- **Export Library**: Click the "Export Library" button to download a CSV file of your collection
- **Undo Last Upload**: If you made a mistake, you can undo your last upload with the "Undo Last Upload" button

## Project Structure

```
shelfie/
├── client/                  # Frontend code
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   ├── pages/           # Page components
│   │   └── App.tsx          # Main application component
├── server/                  # Backend code
│   ├── services/            # External API services
│   │   ├── google-books.ts  # Google Books API integration
│   │   └── openai.ts        # OpenAI API integration
│   ├── index.ts             # Server entry point
│   ├── routes.ts            # API routes
│   ├── storage.ts           # In-memory data storage
│   └── vite.ts              # Vite server configuration
└── shared/                  # Shared code between client and server
    └── schema.ts            # Data schemas
```

## Development

### Building for Production

```bash
npm run build
```

This will create a production build in the `dist` directory.

### Running in Production

```bash
npm start
```

## Future Enhancements

- User authentication and accounts
- Multiple libraries and custom shelves
- Reading progress tracking
- Book recommendations
- Mobile app with camera integration
- Integration with Goodreads, StoryGraph and other book services

## License

MIT

## Acknowledgments

- [OpenAI](https://openai.com/) for the vision AI capabilities
- [Google Books API](https://developers.google.com/books) for book information
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the styling system
