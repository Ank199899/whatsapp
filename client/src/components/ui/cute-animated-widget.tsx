import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CuteAnimatedWidgetProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'robot' | 'heart' | 'star' | 'wave' | 'celebration' | 'nature' | 'space' | 'cute';
}

export function CuteAnimatedWidget({ 
  className = '', 
  size = 'md',
  theme = 'robot'
}: CuteAnimatedWidgetProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-8',
    md: 'w-20 h-12',
    lg: 'w-32 h-20'
  };

  const themes = {
    robot: {
      frames: ['🤖', '🤖', '🤖', '🤖', '🤖'],
      colors: 'from-blue-400 to-purple-500',
      label: 'AI Helper'
    },
    heart: {
      frames: ['💙', '💚', '💛', '🧡', '❤️'],
      colors: 'from-pink-400 to-red-500',
      label: 'Love'
    },
    star: {
      frames: ['⭐', '🌟', '✨', '💫', '🌠'],
      colors: 'from-yellow-400 to-orange-500',
      label: 'Magic'
    },
    wave: {
      frames: ['👋', '👋🏻', '👋🏼', '👋🏽', '👋🏾'],
      colors: 'from-green-400 to-blue-500',
      label: 'Hello'
    },
    celebration: {
      frames: ['🎉', '🎊', '🥳', '🎈', '🎁'],
      colors: 'from-purple-400 to-pink-500',
      label: 'Party'
    },
    nature: {
      frames: ['🌱', '🌿', '🍃', '🌳', '🌲'],
      colors: 'from-green-400 to-emerald-500',
      label: 'Nature'
    },
    space: {
      frames: ['🚀', '🛸', '🌌', '🪐', '🌟'],
      colors: 'from-indigo-400 to-purple-600',
      label: 'Space'
    },
    cute: {
      frames: ['🐱', '🐶', '🐰', '🐼', '🦊'],
      colors: 'from-orange-400 to-pink-500',
      label: 'Cute'
    }
  };

  const currentTheme = themes[theme];

  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % currentTheme.frames.length);
    }, isHovered ? 200 : 800);

    return () => clearInterval(interval);
  }, [currentTheme.frames.length, isHovered]);

  return (
    <div 
      className={cn(
        "relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer",
        sizeClasses[size],
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br animate-pulse",
        currentTheme.colors
      )} />
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
            style={{
              left: `${20 + i * 30}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: '3s'
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        {/* Animated Emoji */}
        <div className={cn(
          "transition-all duration-300",
          isHovered ? "scale-125 animate-bounce" : "scale-100"
        )}>
          <span className="text-2xl filter drop-shadow-lg">
            {currentTheme.frames[currentFrame]}
          </span>
        </div>
        
        {/* Label - Removed as requested */}
      </div>

      {/* Hover Effect Overlay */}
      <div className={cn(
        "absolute inset-0 bg-white/10 transition-opacity duration-300",
        isHovered ? "opacity-100" : "opacity-0"
      )} />
    </div>
  );
}

// CSS animations to add to your global styles
export const cuteAnimationStyles = `
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(120deg); }
  66% { transform: translateY(5px) rotate(240deg); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
`;
