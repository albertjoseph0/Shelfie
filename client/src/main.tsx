import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { SubscriptionProvider } from "./lib/subscription";
import App from "./App";
import "./index.css";

// Import Clerk publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <SubscriptionProvider>
      <App />
    </SubscriptionProvider>
  </ClerkProvider>,
);
