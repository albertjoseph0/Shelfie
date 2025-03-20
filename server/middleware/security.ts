import rateLimit from "express-rate-limit";
import helmet from "helmet";
import xss from "xss-clean";
import hpp from "hpp";
import { Request, Response, NextFunction } from "express";

// Create a limiter that allows 100 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Create a more strict limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // start blocking after 10 requests
  message: "Too many auth attempts, please try again after an hour",
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a stricter limiter for the image upload endpoint
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 image uploads per hour
  message: "Image upload limit reached, please try again after an hour",
  standardHeaders: true,
  legacyHeaders: false,
});

// Error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' ? { error: err.message } : {})
  });
};

// Security middleware setup
export const setupSecurity = (app: any) => {
  // Set security headers using helmet with custom CSP
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "*.clerk.com", "cdn.jsdelivr.net", "fonts.googleapis.com", "*.clerk.accounts.dev", "js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "*.clerk.com", "cdn.jsdelivr.net", "fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:", "*.clerk.com", "*.googleusercontent.com"],
        connectSrc: ["'self'", "*.clerk.com", "*.googleapis.com", "*.google-analytics.com", "*.clerk.accounts.dev", "api.stripe.com"],
        frameSrc: ["'self'", "*.clerk.com", "*.clerk.accounts.dev", "js.stripe.com", "hooks.stripe.com"],
        fontSrc: ["'self'", "data:", "fonts.googleapis.com", "fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"], // Added for worker support
        childSrc: ["'self'", "blob:"], // Added for worker fallback
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Prevent XSS attacks
  app.use(xss());

  // Prevent HTTP Parameter Pollution attacks
  app.use(hpp());

  // Set CORS headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || req.headers.origin
      : req.headers.origin || '*';

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
  });

  // Add security headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
};