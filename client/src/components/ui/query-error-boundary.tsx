import { ReactNode } from 'react';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorBoundary } from './error-boundary';
import { isNetworkError, ApiError } from '@/lib/queryClient';

interface QueryErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'section' | 'component';
}

// Enhanced error boundary specifically for React Query errors
export function QueryErrorBoundary({ children, fallback, level = 'section' }: QueryErrorBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  const handleRetry = () => {
    reset();
  };

  const renderQueryErrorFallback = (error: Error) => {
    const apiError = error as ApiError;
    let title = "Something went wrong";
    let description = "An unexpected error occurred while loading data.";
    let icon = <AlertTriangle className="h-8 w-8 text-destructive" />;
    let canRetry = true;

    // Network errors
    if (isNetworkError(error)) {
      title = "Connection failed";
      description = "Please check your internet connection and try again.";
      icon = <WifiOff className="h-8 w-8 text-destructive" />;
    }
    // Server errors (5xx)
    else if (apiError.status && apiError.status >= 500) {
      title = "Server error";
      description = "Our servers are experiencing issues. Please try again in a moment.";
    }
    // Rate limiting
    else if (apiError.status === 429) {
      title = "Too many requests";
      description = "Please wait a moment before trying again.";
    }
    // Authentication errors
    else if (apiError.status === 401) {
      title = "Session expired";
      description = "Please sign in again to continue.";
      canRetry = false;
    }
    // Authorization errors
    else if (apiError.status === 403) {
      title = "Access denied";
      description = "You don't have permission to access this resource.";
      canRetry = false;
    }
    // Not found errors
    else if (apiError.status === 404) {
      title = "Not found";
      description = "The requested resource could not be found.";
      canRetry = false;
    }

    // Page-level error UI
    if (level === 'page') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">{icon}</div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {canRetry && (
                <Button onClick={handleRetry} data-testid="button-retry-query">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              {!canRetry && apiError.status === 401 && (
                <Button onClick={() => window.location.href = '/login'} data-testid="button-login">
                  Sign In
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    // Section-level error UI
    if (level === 'section') {
      return (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-8">
            {icon}
            <h3 className="text-lg font-semibold mb-2 mt-4">{title}</h3>
            <p className="text-muted-foreground text-center mb-4">{description}</p>
            {canRetry && (
              <Button onClick={handleRetry} variant="outline" size="sm" data-testid="button-retry-query-section">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    // Component-level error UI
    return (
      <div className="flex items-center justify-center p-4 border border-destructive/20 rounded-md bg-destructive/5">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-destructive">{title}</span>
          {canRetry && (
            <Button 
              onClick={handleRetry} 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              data-testid="button-retry-query-component"
            >
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('Query Error Boundary caught error:', error);
      }}
      fallback={fallback}
      level={level}
    >
      {children}
    </ErrorBoundary>
  );
}

// Hook to manually trigger error boundary reset for queries
export function useQueryErrorReset() {
  const { reset } = useQueryErrorResetBoundary();
  return reset;
}