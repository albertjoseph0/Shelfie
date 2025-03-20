import { Request as ExpressRequest } from 'express';
import { Response } from 'express';

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request extends ExpressRequest {
      userId: string;
    }
  }
}

// Export Vercel types for serverless functions
export type VercelRequest = ExpressRequest & {
  query: { [key: string]: string | string[] };
};

export type VercelResponse = Response;

export {};