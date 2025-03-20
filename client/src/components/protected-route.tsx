import { useClerk, useSession } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session } = useSession();
  const { openSignIn } = useClerk();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!session) {
      // Store the current path to redirect back after sign in
      sessionStorage.setItem('redirectPath', window.location.pathname);
      openSignIn();
    }
  }, [session, openSignIn]);

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
