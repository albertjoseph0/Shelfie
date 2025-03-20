import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";
import { setupSecurity, apiLimiter, errorHandler } from "./middleware/security";

// Load environment variables from the appropriate .env file
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
console.log(`Loading environment from ${envFile}`);
dotenv.config({ path: envFile });

// Check for required environment variables
const requiredEnvVars = [
  'CLERK_SECRET_KEY',
  'VITE_CLERK_PUBLISHABLE_KEY',
  'OPENAI_API_KEY',
  'GOOGLE_BOOKS_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

const app = express();

// Trust proxy - required for rate limiting behind Replit's proxy
app.set('trust proxy', 1);

// Setup security middleware first
setupSecurity(app);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log('Initializing server...');
  const server = await registerRoutes(app);

  // Global error handling
  app.use(errorHandler);

  if (app.get("env") === "development") {
    console.log('Starting in development mode with Vite middleware');
    await setupVite(app, server);
  } else {
    console.log('Starting in production mode with static file serving');
    serveStatic(app);
  }

  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server started and listening on port ${port}`);
  });
})().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});