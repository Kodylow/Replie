import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, getQueryFn, apiRequest, ApiError } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export type UseAuthResult = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: unknown;
  refetch: () => void;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
};

export function useAuth(): UseAuthResult {
  const { toast } = useToast();

  // Use the enhanced query function that supports proper error handling
  const { 
    data: user, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Don't retry auth errors (401, 403)
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as ApiError;
        if (apiError.status === 401 || apiError.status === 403) {
          return false;
        }
      }
      // Retry network errors and server errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Logout mutation with proper error handling
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      // Clear all queries on logout
      queryClient.clear();
      
      // Redirect to login or home page
      window.location.href = '/';
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    },
    onError: (error: unknown) => {
      console.error('Logout error:', error);
      
      // Even if logout fails, clear local state
      queryClient.clear();
      window.location.href = '/';
      
      const apiError = error as ApiError;
      toast({
        title: "Sign out error",
        description: apiError.message || "There was an issue signing you out, but you've been signed out locally.",
        variant: "destructive",
      });
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Enhanced refetch function that handles errors gracefully
  const enhancedRefetch = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Auth refetch error:', error);
      // Don't show toast for auth refetch errors - let components handle them
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    refetch: enhancedRefetch,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
}

// Hook for handling auth errors in components
export function useAuthError() {
  const { toast } = useToast();

  const handleAuthError = (error: unknown, action?: string) => {
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as ApiError;
      
      if (apiError.status === 401) {
        toast({
          title: "Session expired",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
        
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        
        return;
      }
      
      if (apiError.status === 403) {
        toast({
          title: "Access denied",
          description: `You don't have permission to ${action || 'perform this action'}.`,
          variant: "destructive",
        });
        return;
      }
    }
    
    // Generic auth error
    toast({
      title: "Authentication error",
      description: "There was an issue with your authentication. Please try again.",
      variant: "destructive",
    });
  };

  return { handleAuthError };
}

// Hook for protecting routes/components that require authentication
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  
  if (!isLoading && !user) {
    // Redirect to login if not authenticated
    window.location.href = '/login';
  }
  
  return { user, isLoading, isAuthenticated: !!user };
}