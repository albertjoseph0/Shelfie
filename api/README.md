# Serverless API Functions

This directory contains Vercel serverless functions that replace our Express routes.

## Local Development

To test the API locally:

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
vercel dev
```

## Important Notes

- The current implementation uses in-memory storage which is NOT suitable for production:
  - Functions are stateless and don't maintain memory between executions
  - Multiple function instances might run simultaneously
  - Data will be lost on function restarts

- All routes are prefixed with `/api` automatically by Vercel:
  - Example: `/books` becomes `/api/books` in production
  - The `vercel.json` configuration handles this routing

## Environment Variables

Required environment variables:
- `CLERK_SECRET_KEY`: For authentication
- `OPENAI_API_KEY`: For image analysis
- `GOOGLE_BOOKS_API_KEY`: For book information
