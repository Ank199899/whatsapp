import * as React from "react";
import { cn } from "@/lib/utils";

// Glass morphism container
interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: "light" | "medium" | "heavy";
  tint?: "neutral" | "primary" | "secondary";
}

const GlassContainer = React.forwardRef<HTMLDivElement, GlassContainerProps>(
  ({ className, intensity = "medium", tint = "neutral", children, ...props }, ref) => {
    const intensityClasses = {
      light: "backdrop-blur-sm bg-white/10 border-white/20",
      medium: "backdrop-blur-md bg-white/20 border-white/30",
      heavy: "backdrop-blur-lg bg-white/30 border-white/40"
    };

    const tintClasses = {
      neutral: "bg-white/20 border-white/30",
      primary: "bg-primary/10 border-primary/20",
      secondary: "bg-secondary/10 border-secondary/20"
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border backdrop-blur-md transition-all duration-300",
          intensityClasses[intensity],
          tintClasses[tint],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassContainer.displayName = "GlassContainer";

// Gradient text component
interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  gradient?: "primary" | "secondary" | "rainbow" | "sunset" | "ocean";
}

const GradientText = React.forwardRef<HTMLSpanElement, GradientTextProps>(
  ({ className, gradient = "primary", children, ...props }, ref) => {
    const gradientClasses = {
      primary: "bg-gradient-to-r from-primary to-primary/80",
      secondary: "bg-gradient-to-r from-secondary to-secondary/80",
      rainbow: "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500",
      sunset: "bg-gradient-to-r from-orange-500 via-red-500 to-pink-500",
      ocean: "bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500"
    };

    return (
      <span
        ref={ref}
        className={cn(
          "bg-clip-text text-transparent font-bold",
          gradientClasses[gradient],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
GradientText.displayName = "GradientText";

// Animated background component
interface AnimatedBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  pattern?: "dots" | "grid" | "waves" | "gradient";
  speed?: "slow" | "medium" | "fast";
}

const AnimatedBackground = React.forwardRef<HTMLDivElement, AnimatedBackgroundProps>(
  ({ className, pattern = "gradient", speed = "medium", children, ...props }, ref) => {
    const speedClasses = {
      slow: "animate-pulse",
      medium: "animate-pulse",
      fast: "animate-bounce"
    };

    const patternClasses = {
      dots: "bg-[radial-gradient(circle_at_1px_1px,rgba(34,197,94,0.15)_1px,transparent_0)] bg-[length:20px_20px]",
      grid: "bg-[linear-gradient(rgba(34,197,94,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.1)_1px,transparent_1px)] bg-[length:20px_20px]",
      waves: "bg-gradient-to-r from-green-400/20 via-yellow-500/20 to-emerald-500/20",
      gradient: "bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5"
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          patternClasses[pattern],
          speedClasses[speed],
          className
        )}
        {...props}
      >
        {pattern === "waves" && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
        )}
        {children}
      </div>
    );
  }
);
AnimatedBackground.displayName = "AnimatedBackground";

// Floating particles effect
interface FloatingParticlesProps {
  count?: number;
  color?: string;
  size?: "sm" | "md" | "lg";
}

const FloatingParticles: React.FC<FloatingParticlesProps> = ({ 
  count = 20, 
  color = "rgb(59, 130, 246)", 
  size = "md" 
}) => {
  const sizeClasses = {
    sm: "w-1 h-1",
    md: "w-2 h-2", 
    lg: "w-3 h-3"
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "absolute rounded-full opacity-20 animate-bounce",
            sizeClasses[size]
          )}
          style={{
            backgroundColor: color,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 3}s`
          }}
        />
      ))}
    </div>
  );
};

// Shimmer effect component
interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "horizontal" | "vertical" | "diagonal";
}

const Shimmer = React.forwardRef<HTMLDivElement, ShimmerProps>(
  ({ className, direction = "horizontal", children, ...props }, ref) => {
    const directionClasses = {
      horizontal: "bg-gradient-to-r",
      vertical: "bg-gradient-to-b", 
      diagonal: "bg-gradient-to-br"
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]",
            directionClasses[direction],
            "from-transparent via-white/20 to-transparent"
          )}
        />
        {children}
      </div>
    );
  }
);
Shimmer.displayName = "Shimmer";

// Glow effect component
interface GlowProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  intensity?: "low" | "medium" | "high";
}

const Glow = React.forwardRef<HTMLDivElement, GlowProps>(
  ({ className, color = "rgb(59, 130, 246)", intensity = "medium", children, ...props }, ref) => {
    const intensityClasses = {
      low: "shadow-lg",
      medium: "shadow-xl",
      high: "shadow-2xl"
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative transition-all duration-300 hover:scale-105",
          intensityClasses[intensity],
          className
        )}
        style={{
          boxShadow: `0 0 20px ${color}40, 0 0 40px ${color}20, 0 0 60px ${color}10`
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Glow.displayName = "Glow";

export { 
  GlassContainer, 
  GradientText, 
  AnimatedBackground, 
  FloatingParticles, 
  Shimmer, 
  Glow 
};
