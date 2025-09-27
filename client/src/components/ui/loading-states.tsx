import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner, SectionLoading } from './loading-spinner';
import { Skeleton, CardSkeleton, ListItemSkeleton, TableRowSkeleton } from './skeleton';

// Generic loading wrapper
interface LoadingWrapperProps {
  isLoading: boolean;
  children: ReactNode;
  skeleton?: ReactNode;
  className?: string;
  loadingText?: string;
  type?: 'spinner' | 'skeleton';
}

export function LoadingWrapper({ 
  isLoading, 
  children, 
  skeleton, 
  className, 
  loadingText = "Loading...",
  type = 'skeleton'
}: LoadingWrapperProps) {
  if (isLoading) {
    if (skeleton) {
      return <div className={className}>{skeleton}</div>;
    }
    
    if (type === 'spinner') {
      return (
        <div className={cn("flex items-center justify-center py-8", className)}>
          <LoadingSpinner text={loadingText} />
        </div>
      );
    }
    
    // Default skeleton loading
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

// Table loading state
interface TableLoadingProps {
  columns: number;
  rows?: number;
}

export function TableLoading({ columns, rows = 5 }: TableLoadingProps) {
  return (
    <table className="w-full">
      <tbody>
        {Array.from({ length: rows }).map((_, index) => (
          <TableRowSkeleton key={index} columns={columns} />
        ))}
      </tbody>
    </table>
  );
}

// Grid loading state
interface GridLoadingProps {
  items?: number;
  className?: string;
}

export function GridLoading({ items = 6, className }: GridLoadingProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

// List loading state
interface ListLoadingProps {
  items?: number;
  className?: string;
}

export function ListLoading({ items = 5, className }: ListLoadingProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <ListItemSkeleton key={index} />
      ))}
    </div>
  );
}

// Search loading state
export function SearchLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-muted-foreground">Searching...</span>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="border rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Empty state with loading option
interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
}

export function EmptyState({ 
  title, 
  description, 
  action, 
  isLoading, 
  loadingText = "Loading..." 
}: EmptyStateProps) {
  if (isLoading) {
    return <SectionLoading text={loadingText} />;
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
}