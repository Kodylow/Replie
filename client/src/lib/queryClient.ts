import { QueryClient, QueryFunction, MutationCache, QueryCache } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// Network error detection
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("NetworkError") ||
      error.message.includes("Failed to fetch") ||
      error.name === "NetworkError"
    );
  }
  return false;
}

// Enhanced error type for better error handling
export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

// Enhanced error throwing with better error information
async function throwIfResNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    let errorMessage = res.statusText;
    let errorDetails: unknown = undefined;

    try {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorDetails = errorData.details || errorData;
      } else {
        const text = await res.text();
        errorMessage = text || errorMessage;
      }
    } catch {
      // If we can't parse the error response, use the status text
    }

    const error = new Error(errorMessage) as ApiError;
    error.status = res.status;
    error.details = errorDetails;
    
    // Add specific error codes for common HTTP statuses
    if (res.status === 401) error.code = "UNAUTHORIZED";
    if (res.status === 403) error.code = "FORBIDDEN";
    if (res.status === 404) error.code = "NOT_FOUND";
    if (res.status === 429) error.code = "RATE_LIMITED";
    if (res.status >= 500) error.code = "SERVER_ERROR";
    
    throw error;
  }
}

// Enhanced API request function with better error handling
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Add network error context
    if (error instanceof TypeError && error.message.includes("fetch")) {
      const networkError = new Error("Network connection failed. Please check your internet connection.") as ApiError;
      networkError.code = "NETWORK_ERROR";
      networkError.details = error;
      throw networkError;
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    const url = queryKey.join("/") as string;
    
    try {
      const res = await fetch(url, {
        credentials: "include",
        signal, // Add abort signal support
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Don't throw for aborted requests
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      
      // Add network error context
      if (error instanceof TypeError && error.message.includes("fetch")) {
        const networkError = new Error("Network connection failed. Please check your internet connection.") as ApiError;
        networkError.code = "NETWORK_ERROR";
        networkError.details = error;
        throw networkError;
      }
      
      throw error;
    }
  };

// Retry delay function with exponential backoff
const retryDelayFunction = (attemptIndex: number): number => {
  return Math.min(1000 * 2 ** attemptIndex, 30000); // Max 30 seconds
};

// Retry condition function
const retryCondition = (failureCount: number, error: unknown): boolean => {
  // Don't retry after 3 attempts
  if (failureCount >= 3) return false;
  
  // Don't retry for client errors (400-499) except for 408, 429
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as ApiError).status;
    if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
      return false;
    }
  }
  
  // Retry for network errors
  if (isNetworkError(error)) return true;
  
  // Retry for server errors (500+)
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as ApiError).status;
    if (status && status >= 500) return true;
  }
  
  return true;
};

// Global error handler for queries
const queryErrorHandler = (error: unknown): void => {
  console.error("Query error:", error);
  
  // Don't show toast for auth errors - let components handle them
  if (error && typeof error === 'object' && 'status' in error) {
    const apiError = error as ApiError;
    if (apiError.status === 401 || apiError.status === 403) {
      return;
    }
  }
  
  // Don't show toast for aborted requests
  if (error instanceof Error && error.name === "AbortError") {
    return;
  }
  
  // Show user-friendly error messages
  let title = "Something went wrong";
  let description = "An unexpected error occurred. Please try again.";
  
  if (isNetworkError(error)) {
    title = "Connection failed";
    description = "Please check your internet connection and try again.";
  } else if (error && typeof error === 'object' && 'status' in error) {
    const apiError = error as ApiError;
    if (apiError.status === 429) {
      title = "Too many requests";
      description = "Please wait a moment before trying again.";
    } else if (apiError.status && apiError.status >= 500) {
      title = "Server error";
      description = "Our servers are experiencing issues. Please try again later.";
    }
  }
  
  // Only show error toast if error has a message (not just network failures we'll handle elsewhere)
  if (error instanceof Error && error.message) {
    toast({
      title,
      description,
      variant: "destructive",
    });
  }
};

// Global error handler for mutations
const mutationErrorHandler = (error: unknown): void => {
  console.error("Mutation error:", error);
  
  // Let individual mutations handle their own error toasts
  // This is just for logging and general error tracking
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: queryErrorHandler,
  }),
  mutationCache: new MutationCache({
    onError: mutationErrorHandler,
  }),
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: retryCondition,
      retryDelay: retryDelayFunction,
      // Enable background refetching for better UX
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount: number, error: unknown): boolean => {
        // Only retry mutations for network errors and server errors
        if (failureCount >= 2) return false;
        
        if (isNetworkError(error)) return true;
        
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as ApiError).status;
          if (status && status >= 500) return true;
        }
        
        return false;
      },
      retryDelay: retryDelayFunction,
    },
  },
});