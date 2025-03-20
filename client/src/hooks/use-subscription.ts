import { useQuery } from "@tanstack/react-query";

export function useSubscription() {
  return useQuery({
    queryKey: ["/api/subscription"],
    retry: false,
  });
}
