import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export type UseAuthResult = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

async function fetchUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/user', {
      credentials: 'include',
    });
    
    if (response.status === 401) {
      // User is not authenticated
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Auth fetch error:', error);
    return null;
  }
}

export function useAuth(): UseAuthResult {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}