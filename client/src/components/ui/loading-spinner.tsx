import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex items-center gap-2">
        <Loader2 className={cn("animate-spin", sizeClasses[size])} />
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    </div>
  );
}

// Button loading spinner
interface ButtonLoadingProps {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
}

export function ButtonLoading({ children, isLoading, loadingText }: ButtonLoadingProps) {
  if (isLoading) {
    return (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {loadingText || "Loading..."}
      </>
    );
  }

  return <>{children}</>;
}

// Page loading overlay
interface PageLoadingProps {
  text?: string;
  className?: string;
}

export function PageLoading({ text = "Loading...", className }: PageLoadingProps) {
  return (
    <div className={cn("fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50", className)}>
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

// Inline loading for sections
interface SectionLoadingProps {
  text?: string;
  className?: string;
}

export function SectionLoading({ text = "Loading...", className }: SectionLoadingProps) {
  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <LoadingSpinner text={text} />
    </div>
  );
}