import { useUser, useAuth as useClerkAuth, useSession } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useAuth() {
  const { isSignedIn, user } = useUser();
  const { getToken } = useClerkAuth();
  const { session } = useSession();
  const { toast } = useToast();
  
  // Reset query cache when auth state changes
  useEffect(() => {
    if (isSignedIn === false) {
      // Clear all queries when user signs out
      queryClient.clear();
    }
  }, [isSignedIn]);

  // Monitor session status
  useEffect(() => {
    if (session) {
      const checkExpiration = () => {
        const now = Date.now();
        if (session.lastActiveAt < now - 30 * 60 * 1000) { // 30 minutes inactivity
          toast({
            title: "Session Warning",
            description: "Your session will expire soon. Please refresh the page to continue.",
            variant: "destructive"
          });
        }
      };

      // Check every 5 minutes
      const interval = setInterval(checkExpiration, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [session, toast]);

  return {
    isSignedIn,
    user,
    getToken,
    session,
    
    // Helper for components that need user ID
    userId: user?.id || null,
    
    // Helper to check if user is fully loaded
    isLoaded: user !== undefined,
    
    // Session helpers
    isSessionValid: session?.status === "active",
    lastActive: session?.lastActiveAt,
    sessionId: session?.id
  };
}
