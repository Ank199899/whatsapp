import * as React from "react";
import { cn } from "@/lib/utils";

// Modern spinner component
interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "white" | "current";
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = "md", 
  color = "primary", 
  className 
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };

  const colorClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    white: "text-white",
    current: "text-current"
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
};

// Pulse loading component
interface PulseProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "accent";
  className?: string;
}

export const Pulse: React.FC<PulseProps> = ({ 
  size = "md", 
  color = "primary", 
  className 
}) => {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  const colorClasses = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    accent: "bg-accent"
  };

  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full animate-pulse",
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: "1s"
          }}
        />
      ))}
    </div>
  );
};

// Skeleton loading component
interface SkeletonProps {
  className?: string;
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "rectangular",
  width,
  height,
  lines = 1
}) => {
  const variantClasses = {
    text: "h-4 rounded",
    rectangular: "rounded-lg",
    circular: "rounded-full"
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "bg-muted animate-pulse",
              variantClasses[variant],
              i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
            )}
            style={{
              width: typeof width === "number" ? `${width}px` : width,
              height: typeof height === "number" ? `${height}px` : height
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-muted animate-pulse",
        variantClasses[variant],
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height
      }}
    />
  );
};

// Wave loading component
interface WaveProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "accent";
  className?: string;
}

export const Wave: React.FC<WaveProps> = ({ 
  size = "md", 
  color = "primary", 
  className 
}) => {
  const sizeClasses = {
    sm: "w-1 h-4",
    md: "w-1.5 h-6",
    lg: "w-2 h-8"
  };

  const colorClasses = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    accent: "bg-accent"
  };

  return (
    <div className={cn("flex items-end space-x-1", className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full animate-pulse",
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: "1s"
          }}
        />
      ))}
    </div>
  );
};

// Loading overlay component
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  spinner?: React.ReactNode;
  className?: string;
  blur?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  spinner,
  className,
  blur = true
}) => {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 rounded-lg",
          blur && "backdrop-blur-md"
        )}>
          {spinner || <Spinner size="lg" />}
        </div>
      )}
    </div>
  );
};

// Progress bar component
interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: "primary" | "secondary" | "success" | "warning" | "destructive";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className,
  color = "primary",
  size = "md",
  animated = true
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3"
  };

  const colorClasses = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    destructive: "bg-red-500"
  };

  return (
    <div className={cn(
      "w-full bg-muted rounded-full overflow-hidden",
      sizeClasses[size],
      className
    )}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          colorClasses[color],
          animated && "animate-pulse"
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export { SpinnerProps, PulseProps, SkeletonProps, WaveProps, LoadingOverlayProps, ProgressBarProps };
