import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface AnimatedVideoButtonProps {
  label: string;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'campaign' | 'message' | 'contact' | 'template';
}

export function AnimatedVideoButton({ 
  label,
  onClick,
  className = '', 
  size = 'md',
  variant = 'campaign'
}: AnimatedVideoButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-12 px-4 text-sm',
    lg: 'h-16 px-6 text-base'
  };

  const variants = {
    campaign: {
      gradient: 'from-blue-500 to-purple-600',
      hoverGradient: 'from-blue-600 to-purple-700',
      emoji: '🚀',
      animation: 'animate-pulse'
    },
    message: {
      gradient: 'from-green-500 to-blue-600',
      hoverGradient: 'from-green-600 to-blue-700',
      emoji: '💬',
      animation: 'animate-bounce'
    },
    contact: {
      gradient: 'from-orange-500 to-red-600',
      hoverGradient: 'from-orange-600 to-red-700',
      emoji: '👥',
      animation: 'animate-pulse'
    },
    template: {
      gradient: 'from-purple-500 to-pink-600',
      hoverGradient: 'from-purple-600 to-pink-700',
      emoji: '📝',
      animation: 'animate-bounce'
    }
  };

  const currentVariant = variants[variant];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative overflow-hidden rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
        sizeClasses[size],
        className
      )}
    >
      {/* Animated Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r transition-all duration-300",
        isHovered ? currentVariant.hoverGradient : currentVariant.gradient
      )} />
      
      {/* Animated Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute w-1 h-1 bg-white/30 rounded-full",
              isHovered ? "animate-float" : ""
            )}
            style={{
              left: `${15 + i * 20}%`,
              top: `${20 + (i % 2) * 60}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: '2s'
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center space-x-2">
        {/* Animated Emoji */}
        <span className={cn(
          "text-lg transition-all duration-300",
          isHovered ? currentVariant.animation : "",
          isHovered ? "scale-110" : "scale-100"
        )}>
          {currentVariant.emoji}
        </span>
        
        {/* Plus Icon */}
        <Plus className={cn(
          "w-4 h-4 transition-all duration-300",
          isHovered ? "rotate-90 scale-110" : "rotate-0 scale-100"
        )} />
        
        {/* Label */}
        <span className="font-semibold tracking-wide">
          {label}
        </span>
      </div>

      {/* Shine Effect */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 transition-transform duration-700",
        isHovered ? "translate-x-full" : "-translate-x-full"
      )} />
    </button>
  );
}

// Alternative video-style button with actual video background
export function VideoBackgroundButton({ 
  label,
  onClick,
  className = '', 
  size = 'md'
}: Omit<AnimatedVideoButtonProps, 'variant'>) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-12 px-4 text-sm',
    lg: 'h-16 px-6 text-base'
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative overflow-hidden rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
        sizeClasses[size],
        className
      )}
    >
      {/* Video Background */}
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x" />
        {/* Fallback animated background if video fails */}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center space-x-2">
        <span className={cn(
          "text-lg transition-all duration-300",
          isHovered ? "animate-bounce scale-110" : "scale-100"
        )}>
          🎬
        </span>
        <Plus className={cn(
          "w-4 h-4 transition-all duration-300",
          isHovered ? "rotate-90 scale-110" : "rotate-0 scale-100"
        )} />
        <span className="font-semibold tracking-wide">
          {label}
        </span>
      </div>
    </button>
  );
}
