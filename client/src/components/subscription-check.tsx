import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useSubscription } from "@/lib/subscription";
import { useLocation, useNavigate } from "wouter";

export function RequireSubscription({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, isLoaded } = useAuth();
  const { isLoaded: isUserLoaded } = useUser();
  const { isSubscribed, isLoading } = useSubscription();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (isLoaded && isUserLoaded && !isLoading) {
      if (!isSignedIn) {
        navigate("/");
      } else if (!isSubscribed && !location.includes("/subscribe")) {
        navigate("/subscribe");
      }
    }
  }, [
    isSignedIn,
    isLoaded,
    isUserLoaded,
    isSubscribed,
    isLoading,
    location,
    navigate,
  ]);

  if (isLoading || !isLoaded || !isUserLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  if (!isSubscribed) {
    return null;
  }

  return <>{children}</>;
}
