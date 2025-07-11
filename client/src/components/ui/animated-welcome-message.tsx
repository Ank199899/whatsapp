import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedWelcomeMessageProps {
  message: string;
  className?: string;
  animationType?: 'typewriter' | 'fade' | 'slide' | 'bounce' | 'glow';
  speed?: number;
  showCursor?: boolean;
}

export function AnimatedWelcomeMessage({ 
  message,
  className = '',
  animationType = 'typewriter',
  speed = 100,
  showCursor = true
}: AnimatedWelcomeMessageProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showCursorBlink, setShowCursorBlink] = useState(true);

  // Typewriter effect
  useEffect(() => {
    if (animationType === 'typewriter' && currentIndex < message.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + message[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (currentIndex >= message.length) {
      setIsComplete(true);
    }
  }, [currentIndex, message, speed, animationType]);

  // Cursor blinking effect
  useEffect(() => {
    if (showCursor) {
      const cursorTimer = setInterval(() => {
        setShowCursorBlink(prev => !prev);
      }, 500);

      return () => clearInterval(cursorTimer);
    }
  }, [showCursor]);

  // Reset animation when message changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [message]);

  const getAnimationClasses = () => {
    switch (animationType) {
      case 'fade':
        return 'animate-fade-in-slow';
      case 'slide':
        return 'animate-slide-in-right';
      case 'bounce':
        return 'animate-bounce-in';
      case 'glow':
        return 'animate-glow-pulse';
      default:
        return '';
    }
  };

  const renderContent = () => {
    if (animationType === 'typewriter') {
      return (
        <>
          <span className="inline-block">
            {displayedText}
          </span>
          {showCursor && (
            <span 
              className={cn(
                "inline-block w-0.5 h-4 bg-current ml-1 transition-opacity duration-100",
                showCursorBlink ? "opacity-100" : "opacity-0"
              )}
            />
          )}
        </>
      );
    }

    return message;
  };

  return (
    <div className={cn(
      "text-muted-foreground text-sm font-medium transition-all duration-300",
      getAnimationClasses(),
      className
    )}>
      {renderContent()}
    </div>
  );
}

// Enhanced version with multiple effects
export function EnhancedWelcomeMessage({ 
  message,
  className = ''
}: {
  message: string;
  className?: string;
}) {
  const [currentEffect, setCurrentEffect] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const effects = [
    { type: 'gradient', class: 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent' },
    { type: 'glow', class: 'text-blue-600 drop-shadow-lg' },
    { type: 'rainbow', class: 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent' }
  ];

  // Cycle through effects
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEffect(prev => (prev + 1) % effects.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [effects.length]);

  return (
    <div 
      className={cn(
        "text-sm font-medium transition-all duration-1000 cursor-pointer",
        effects[currentEffect].class,
        isHovered ? "scale-105 animate-pulse" : "",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="inline-flex items-center space-x-2">
        <span className="animate-fade-in">{message}</span>
        {isHovered && (
          <span className="text-lg animate-bounce">✨</span>
        )}
      </span>
    </div>
  );
}

// Floating words effect
export function FloatingWordsWelcome({ 
  message,
  className = ''
}: {
  message: string;
  className?: string;
}) {
  const words = message.split(' ');
  
  return (
    <div className={cn("text-sm font-medium text-muted-foreground", className)}>
      {words.map((word, index) => (
        <span
          key={index}
          className="inline-block mr-1 animate-float-in hover:text-blue-600 transition-colors duration-300 cursor-default"
          style={{
            animationDelay: `${index * 100}ms`,
            animationDuration: '0.6s'
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}

// Particle effect welcome
export function ParticleWelcome({ 
  message,
  className = ''
}: {
  message: string;
  className?: string;
}) {
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number}>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className={cn("relative text-sm font-medium text-muted-foreground", className)}>
      {/* Floating particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-blue-400 rounded-full animate-float opacity-30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.id * 0.5}s`,
            animationDuration: '3s'
          }}
        />
      ))}
      
      {/* Message */}
      <span className="relative z-10 hover:text-blue-600 transition-colors duration-300">
        {message}
      </span>
    </div>
  );
}
