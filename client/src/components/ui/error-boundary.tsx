import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Error boundary state interface
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

// Error boundary props interface
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'section' | 'component';
}

// Generate unique error ID for tracking
const generateErrorId = (): string => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Enhanced Error Boundary component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || generateErrorId();
    
    // Log error for debugging
    console.error(`[ErrorBoundary ${errorId}]:`, error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo,
      errorId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service (in production)
    if (import.meta.env.PROD) {
      // Add your error reporting service here
      // e.g., Sentry, LogRocket, etc.
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render appropriate error UI based on level
      return this.renderErrorUI();
    }

    return this.props.children;
  }

  private renderErrorUI() {
    const { level = 'component', showDetails = false } = this.props;
    const { error, errorId } = this.state;

    // Page-level error (full page)
    if (level === 'page') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
              </CardDescription>
            </CardHeader>
            {showDetails && error && (
              <CardContent>
                <div className="bg-muted p-3 rounded-md text-sm font-mono">
                  <div className="text-muted-foreground mb-1">Error ID: {errorId}</div>
                  <div className="text-destructive">{error.message}</div>
                </div>
              </CardContent>
            )}
            <CardFooter className="flex gap-2 justify-center">
              <Button onClick={this.handleRetry} variant="default" data-testid="button-retry-error">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" data-testid="button-home-error">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    // Section-level error (smaller container)
    if (level === 'section') {
      return (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="h-8 w-8 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to load this section</h3>
            <p className="text-muted-foreground text-center mb-4">
              Something went wrong while loading this content.
            </p>
            {showDetails && error && (
              <div className="bg-muted p-3 rounded-md text-xs font-mono mb-4 w-full">
                <div className="text-muted-foreground mb-1">Error ID: {errorId}</div>
                <div className="text-destructive">{error.message}</div>
              </div>
            )}
            <Button onClick={this.handleRetry} variant="outline" size="sm" data-testid="button-retry-section">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Component-level error (minimal inline)
    return (
      <div className="flex items-center justify-center p-4 border border-destructive/20 rounded-md bg-destructive/5">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-destructive">Error loading component</span>
          <Button 
            onClick={this.handleRetry} 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs"
            data-testid="button-retry-component"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }
}

// Higher-order component for easier error boundary wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for manual error throwing (for functional components)
export function useErrorHandler() {
  return (error: Error) => {
    throw error;
  };
}